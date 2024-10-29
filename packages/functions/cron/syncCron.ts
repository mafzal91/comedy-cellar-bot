import { addDays, endOfDay, getUnixTime, startOfDay } from "date-fns";

import { getLastShow } from "@core/models/show";
import { sendEmail } from "@core/email";
import { parseTimestampString } from "@core/utils";
import { getFutureDatesByDay } from "@core/getFutureDatesByDay";
import { handleShowDetails } from "@core/handleShowDetails";
import { sleep } from "@core/common/sleep";
import { handleLineUp } from "@core/handleLineUp";

const IS_ACTIVE = process.env.IS_ACTIVE === "1";
const IS_CRON = process.env.IS_CRON === "1";

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export async function handler() {
  if (!IS_ACTIVE && IS_CRON) {
    return;
  }

  const today = new Date();
  const startOfToday = startOfDay(today);
  const startOfTodayUnixTimestamp = getUnixTime(startOfToday);
  const [lastKnownShow] = await getLastShow();

  const dateOfLastShow = parseTimestampString({
    timestamp: `${lastKnownShow.timestamp}`,
  });

  const startDate = startOfTodayUnixTimestamp;
  const endDate = getUnixTime(
    addDays(endOfDay(new Date(dateOfLastShow.jsTimestamp)), 0)
  );

  const differenceInSeconds = endDate - startOfTodayUnixTimestamp;
  const differenceInDays = Math.round(differenceInSeconds / 86400);
  const dates = getFutureDatesByDay(differenceInDays, startDate * 1000);
  const dateChunks = chunkArray(dates, 10);

  try {
    for (const dateChunk of dateChunks) {
      for (const date of dateChunk) {
        console.log("fetching", date);
        await handleShowDetails({ date });
        await handleLineUp({ date });
      }
      await sleep(5000);
    }
  } catch (e) {
    await sendEmail({
      subject: "New Show Cron",
      message: "There was an error in the syncCron",
    }).catch((e) => console.error(e));
  }

  return {};
}
