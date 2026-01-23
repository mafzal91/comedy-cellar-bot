import axios from "axios";

const SlackWebhookUrl = [
  "https://hooks.slack.com",
  "/services/",
  "TBHAGL5NG",
  "/B0AA5JRMEJ3/",
  "tMG1ohHbKoAHwk8Va1PHgspy",
].join("");

interface SlackMessageBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
}

export async function sendSlackMessage({
  text,
  blocks,
}: {
  text: string;
  blocks?: SlackMessageBlock[];
}) {
  if (!SlackWebhookUrl) {
    console.error("Slack webhook URL not configured");
    return;
  }

  try {
    const payload: any = {
      text,
    };

    if (blocks) {
      payload.blocks = blocks;
    }

    await axios.post(SlackWebhookUrl, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Slack message sent successfully");
  } catch (error) {
    console.error("Failed to send Slack message:", error);
    throw error;
  }
}

export function formatEventAvailabilityMessage({
  spotsLeft,
  totalSpots,
  going,
  waitlist,
  interested,
  eventUrl,
}: {
  spotsLeft: number;
  totalSpots: number;
  going: number;
  waitlist: number;
  interested: number;
  eventUrl: string;
}) {
  const hasSpots = spotsLeft > 0;

  return {
    text: hasSpots
      ? `🎉 Event Spots Available! ${spotsLeft}/${totalSpots} spots left`
      : `Event Full - ${spotsLeft}/${totalSpots} spots left`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: hasSpots
            ? "🎉 Event Spots Available!"
            : "📊 Event Availability Update",
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Spots Left:*\n${spotsLeft}/${totalSpots}`,
          },
          {
            type: "mrkdwn",
            text: `*Going:*\n${going}`,
          },
          {
            type: "mrkdwn",
            text: `*Waitlist:*\n${waitlist}`,
          },
          {
            type: "mrkdwn",
            text: `*Interested:*\n${interested}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Akdeniz Restaurant Dinner Meetup*\n${hasSpots ? "Spots are available! RSVP now:" : "Currently full. Check back later:"} <${eventUrl}|View Event>`,
        },
      },
    ],
  };
}
