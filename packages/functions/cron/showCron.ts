import { Resource } from "sst";
import { format } from "date-fns";
import { getLastShow } from "@core/models/show";
import { sendEmail } from "@core/email";
import { parseTimestampString } from "@core/utils";
import { getFutureDatesByDay } from "@core/getFutureDatesByDay";
import { handleShowDetails } from "@core/handleShowDetails";
import { formatInTimeZone } from "date-fns-tz";

const FromEmail = Resource.FromEmail.value;
const FromEmailPw = Resource.FromEmailPw.value;

export async function handler() {
  const [lastKnownShow] = await getLastShow();
  const dateOfLastShow = parseTimestampString({
    timestamp: `${lastKnownShow.timestamp}`,
  });

  let moreShows = true;
  let days = 1;

  while (moreShows) {
    const dateForLogging = formatInTimeZone(
      new Date(),
      "America/New_York",
      "MM/dd/yyyy hh:mm:ss a"
    );

    const futureDays = getFutureDatesByDay(days, dateOfLastShow.jsTimestamp);
    const nextDayToFetch = futureDays[futureDays.length - 1];
    const data = await handleShowDetails({ date: nextDayToFetch });

    console.log(dateForLogging, "Cron Data", data);
    await sendEmail(
      {
        subject: "New Show Cron",
        message: JSON.stringify(
          {
            executionTime: dateForLogging,
            ...data,
          },
          null,
          2
        ),
      },
      {
        FromEmail,
        FromEmailPw,
      }
    );
    if (!data.shows.length) {
      moreShows = false;
    } else {
      days += 1;
    }
  }

  return {};
}
