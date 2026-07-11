import { differenceInMinutes } from "date-fns";

import {
  claimPendingNewShows,
  getPendingNewShows,
} from "@core/models/newShowQueue";
import { getShowNotificationRecipients } from "@core/models/showNotification";
import { renderNewShowsEmail } from "@core/emails/newShowsEmail";
import { sendEmail, sendHtmlEmail } from "@core/email";

const IS_ACTIVE = process.env.IS_ACTIVE === "1";
const IS_CRON = process.env.IS_CRON === "1";

// New shows are typically posted over the span of about an hour, so hold the
// batch until the first queued show is this old. Everything that trickles in
// while we wait rides along in the same email instead of spamming users.
const BATCH_WINDOW_MINUTES = 60;
const SEND_CHUNK_SIZE = 25;

export async function handler() {
  if (!IS_ACTIVE && IS_CRON) {
    return;
  }

  const pending = await getPendingNewShows();

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
      `Holding batch: ${pending.length} show(s) queued, oldest queued ${batchAgeMinutes}m ago (window is ${BATCH_WINDOW_MINUTES}m)`
    );
    return {};
  }

  // Claim before sending so an overlapping run can't announce the same shows
  const claimed = await claimPendingNewShows(
    pending.map((item) => item.queueId)
  );

  if (!claimed.length) {
    console.log("Batch already claimed by another run");
    return {};
  }

  const claimedIds = new Set(claimed.map((row) => row.id));
  const nowInSeconds = Math.floor(now.getTime() / 1000);

  // Skip anything that started while the batch was collecting
  const batch = pending.filter(
    (item) =>
      claimedIds.has(item.queueId) && (item.show.timestamp ?? 0) > nowInSeconds
  );

  if (!batch.length) {
    console.log("No upcoming shows left in the claimed batch");
    return {};
  }

  const recipients = await getShowNotificationRecipients();

  if (!recipients.length) {
    console.log(`No subscribers; skipping ${batch.length} queued show(s)`);
    return {};
  }

  const { subject, html, text } = renderNewShowsEmail({
    shows: batch.map(({ show, room }) => ({
      timestamp: show.timestamp ?? 0,
      description: show.description,
      cover: show.cover,
      note: show.note,
      special: show.special,
      roomName: room?.name ?? null,
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
    `Announced ${batch.length} show(s) to ${
      recipients.length - failures.length
    }/${recipients.length} subscriber(s)`
  );

  if (failures.length) {
    await sendEmail({
      subject: "Show Notification Cron",
      message: `Failed to send ${failures.length} of ${
        recipients.length
      } new-show notification emails:\n\n${failures.join("\n")}`,
    }).catch((e) => console.error(e));
  }

  return {};
}
