import { formatInTimeZone } from "date-fns-tz";
import axios from "axios";
import * as cheerio from "cheerio";
import { sendEmail } from "@core/email";
import { sendSlackMessage, formatEventAvailabilityMessage } from "@core/slack";

const IS_ACTIVE = process.env.IS_ACTIVE === "1";
const IS_CRON = process.env.IS_CRON === "1";
const EVENT_URL = "https://partiful.com/e/G85U206a6eTvJdIxti8k";

interface EventAvailability {
  spotsLeft: number;
  totalSpots: number;
  going: number;
  waitlist: number;
  interested: number;
}

async function fetchEventAvailability(): Promise<EventAvailability | null> {
  try {
    const response = await axios.get(EVENT_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);

    // Find the spots left text: "0/50 spots left"
    const spotsText = $('span.ptf-6n-N4.ptf-NNO7K.ptf-l-tpQlB')
      .text()
      .trim();

    // Find the guest list text: "50 Going · 43 Waitlist · 30 Interested"
    const guestListText = $('span.ptf-QE3Iy.ptf-aJIzb')
      .text()
      .trim();

    console.log("Spots text:", spotsText);
    console.log("Guest list text:", guestListText);

    // Parse "X/Y spots left"
    const spotsMatch = spotsText.match(/(\d+)\/(\d+)\s+spots?\s+left/i);
    if (!spotsMatch) {
      console.error("Could not parse spots text:", spotsText);
      return null;
    }

    const spotsLeft = parseInt(spotsMatch[1], 10);
    const totalSpots = parseInt(spotsMatch[2], 10);

    // Parse "X Going · Y Waitlist · Z Interested"
    const guestListMatch = guestListText.match(
      /(\d+)\s+Going\s*·\s*(\d+)\s+Waitlist\s*·\s*(\d+)\s+Interested/i
    );

    let going = 0;
    let waitlist = 0;
    let interested = 0;

    if (guestListMatch) {
      going = parseInt(guestListMatch[1], 10);
      waitlist = parseInt(guestListMatch[2], 10);
      interested = parseInt(guestListMatch[3], 10);
    }

    return {
      spotsLeft,
      totalSpots,
      going,
      waitlist,
      interested,
    };
  } catch (error) {
    console.error("Error fetching event availability:", error);
    throw error;
  }
}

export async function handler() {
  if (!IS_ACTIVE && IS_CRON) {
    return { message: "Cron is not active" };
  }

  const now = new Date();
  const dateForLogging = formatInTimeZone(
    now,
    "America/New_York",
    "MM/dd/yyyy hh:mm:ss a"
  );

  try {
    const availability = await fetchEventAvailability();

    if (!availability) {
      await sendEmail({
        subject: "Event Availability Check - Error",
        message: `Failed to parse event availability at ${dateForLogging}`,
      });
      return { error: "Failed to parse event availability" };
    }

    console.log(dateForLogging, "Event Availability:", availability);

    // Send Slack notification about current availability
    const slackMessage = formatEventAvailabilityMessage({
      spotsLeft: availability.spotsLeft,
      totalSpots: availability.totalSpots,
      going: availability.going,
      waitlist: availability.waitlist,
      interested: availability.interested,
      eventUrl: EVENT_URL,
    });

    await sendSlackMessage(slackMessage).catch((error) => {
      console.error("Failed to send Slack message:", error);
    });

    // Check if spots are available and send email notification
    if (availability.spotsLeft > 0) {
      await sendEmail({
        subject: "🎉 Event Spots Available!",
        message: `Spots are now available for the Akdeniz Restaurant dinner meetup!

Event URL: ${EVENT_URL}

Current Status:
- Spots Left: ${availability.spotsLeft}/${availability.totalSpots}
- Going: ${availability.going}
- Waitlist: ${availability.waitlist}
- Interested: ${availability.interested}

Checked at: ${dateForLogging}`,
      }).catch((error) => {
        console.error("Failed to send email:", error);
      });

      return {
        message: "Spots available - notifications sent",
        ...availability,
      };
    }

    return {
      message: "No spots available - Slack notification sent",
      ...availability,
    };
  } catch (error) {
    console.error("Error in eventAvailabilityCron:", error);

    await sendEmail({
      subject: "Event Availability Check - Error",
      message: `Error checking event availability at ${dateForLogging}:

${error instanceof Error ? error.message : String(error)}

${error instanceof Error && error.stack ? error.stack : ""}`,
    }).catch((emailError) => {
      console.error("Failed to send error email:", emailError);
    });

    throw error;
  }
}
