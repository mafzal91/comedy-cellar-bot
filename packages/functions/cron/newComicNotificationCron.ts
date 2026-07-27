import { differenceInMinutes } from "date-fns";

import {
  claimPendingNewComics,
  getPendingNewComics,
} from "@core/models/newComicQueue";
import { getNewComicNotificationRecipients } from "@core/models/newComicNotification";
import { renderNewComicsEmail } from "@core/emails/newComicsEmail";
import { sendEmail, sendHtmlEmail } from "@core/email";

const IS_ACTIVE = process.env.IS_ACTIVE === "1";
const IS_CRON = process.env.IS_CRON === "1";

// New comics are discovered as lineups are scraped over time, so hold the batch
// until the first queued comic is this old. Anything that trickles in while we
// wait rides along in the same email instead of spamming subscribers.
const BATCH_WINDOW_MINUTES = 60;
const SEND_CHUNK_SIZE = 25;

export async function handler() {
  if (!IS_ACTIVE && IS_CRON) {
    return;
  }

  const pending = await getPendingNewComics();

  if (!pending.length) {
    return {};
  }

  const now = new Date();
  const oldestQueuedAt = pending.reduce(
    (oldest, item) => (item.queuedAt < oldest ? item.queuedAt : oldest),
    pending[0].queuedAt
  );
  const batchAgeMinutes = differenceInMinutes(now, oldestQueuedAt);

  if (batchAgeMinutes < BATCH_WINDOW_MINUTES) {
    console.log(
      `Holding batch: ${pending.length} comic(s) queued, oldest queued ${batchAgeMinutes}m ago (window is ${BATCH_WINDOW_MINUTES}m)`
    );
    return {};
  }

  // Claim before sending so an overlapping run can't announce the same comics
  const claimed = await claimPendingNewComics(
    pending.map((item) => item.queueId)
  );

  if (!claimed.length) {
    console.log("Batch already claimed by another run");
    return {};
  }

  const claimedIds = new Set(claimed.map((row) => row.id));
  const batch = pending.filter((item) => claimedIds.has(item.queueId));

  if (!batch.length) {
    console.log("No comics left in the claimed batch");
    return {};
  }

  const recipients = await getNewComicNotificationRecipients();

  if (!recipients.length) {
    console.log(`No subscribers; skipping ${batch.length} queued comic(s)`);
    return {};
  }

  const { subject, html, text } = await renderNewComicsEmail({
    comics: batch.map(({ comic }) => ({
      name: comic.name,
      img: comic.img,
      website: comic.website,
      description: comic.description,
    })),
  });

  const failures: string[] = [];

  for (let i = 0; i < recipients.length; i += SEND_CHUNK_SIZE) {
    const chunk = recipients.slice(i, i + SEND_CHUNK_SIZE);
    const results = await Promise.allSettled(
      chunk.map(({ email }) => sendHtmlEmail({ to: email, subject, html, text }))
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        failures.push(`${chunk[index].email}: ${result.reason}`);
      }
    });
  }

  console.log(
    `Announced ${batch.length} comic(s) to ${
      recipients.length - failures.length
    }/${recipients.length} subscriber(s)`
  );

  if (failures.length) {
    await sendEmail({
      subject: "New Comic Notification Cron",
      message: `Failed to send ${failures.length} of ${
        recipients.length
      } new-comic notification emails:\n\n${failures.join("\n")}`,
    }).catch((e) => console.error(e));
  }

  return {};
}
