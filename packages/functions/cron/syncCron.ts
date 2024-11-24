import { addDays, endOfDay, getUnixTime, startOfDay } from "date-fns";

import { getFutureDatesByDay } from "@core/getFutureDatesByDay";
import { getLastShow } from "@core/models/show";
import { handleLineUp } from "@core/handleLineUp";
import { handleShowDetails } from "@core/handleShowDetails";
import { parseTimestampString } from "@core/utils";
import { sendEmail } from "@core/email";
import { sleep } from "@core/common/sleep";

const IS_ACTIVE = process.env.IS_ACTIVE === "1";
const IS_CRON = process.env.IS_CRON === "1";
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(
        `Attempt ${attempt}/${maxRetries} failed for ${operationName}:`,
        error.message
      );

      if (attempt < maxRetries) {
        await sleep(delay * attempt); // Exponential backoff
        continue;
      }
    }
  }

  throw lastError!;
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

  try {
    for (const date of [dates[0]]) {
      console.log("fetching", date);

      const results = await Promise.allSettled([
        withRetry(() => {
          return handleShowDetails({ date });
        }, `handleShowDetails for date ${date}`),
        withRetry(() => {
          return handleLineUp({ date });
        }, `handleLineUp for date ${date}`),
      ]);

      // Check if any operations failed
      const failures = results.filter((result) => result.status === "rejected");

      if (failures.length > 0) {
        const errors = failures.map((f) => (f as PromiseRejectedResult).reason);
        throw new Error(`Operations failed:\n${errors.join("\n")}`);
      }

      await sleep(7500);
    }
  } catch (e) {
    const errorMessage = `There was an error in the syncCron: ${e.message}\n\nStack Trace:\n${e.stack}`;

    await sendEmail({
      subject: "Sync Show Cron",
      message: errorMessage,
    }).catch((e) => console.error(e));
  }

  return {};
}
