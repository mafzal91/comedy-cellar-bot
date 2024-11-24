import { formatInTimeZone } from "date-fns-tz";
import { getFutureDatesByDay } from "@core/getFutureDatesByDay";
import { getLastShow } from "@core/models/show";
import { handleLineUp } from "@core/handleLineUp";
import { handleShowDetails } from "@core/handleShowDetails";
import { parseTimestampString } from "@core/utils";
import { sendEmail } from "@core/email";
import { sleep } from "@core/common/sleep";

const IS_ACTIVE = process.env.IS_ACTIVE === "1";
const IS_CRON = process.env.IS_CRON === "1";

export async function handler() {
  if (!IS_ACTIVE && IS_CRON) {
    return;
  }
  const [lastKnownShow] = await getLastShow();
  const dateOfLastShow = parseTimestampString({
    timestamp: `${lastKnownShow.timestamp}`,
  });

  let moreShows = true;
  let days = 1;

  const now = new Date();
  const dateForLogging = formatInTimeZone(
    now,
    "America/New_York",
    "MM/dd/yyyy hh:mm:ss a"
  );
  const currentHour = parseInt(
    formatInTimeZone(now, "America/New_York", "k"),
    10
  );

  while (moreShows) {
    const futureDays = getFutureDatesByDay(days, dateOfLastShow.jsTimestamp);
    const nextDayToFetch = futureDays[futureDays.length - 1];
    const data = await handleShowDetails({ date: nextDayToFetch });
    console.log(dateForLogging, "Cron Data", data);

    if (data.shows.length) {
      await sendEmail({
        subject: "New Show Cron",
        message: JSON.stringify(
          {
            executionTime: dateForLogging,
            currentHour,
            ...data,
          },
          null,
          2
        ),
      }).catch((e) => console.error(e));
    }

    if (!data.shows.length) {
      moreShows = false;
    } else {
      await handleLineUp({ date: nextDayToFetch });
      days += 1;
      await sleep(5000);
    }
  }

  return {};
}
