import { differenceInMinutes } from "date-fns";

import {
  claimPendingComicActs,
  getPendingComicActs,
} from "@core/models/comicNotificationQueue";
import { getComicNotificationRecipientsForComics } from "@core/models/comicNotification";
import {
  ComicBookedEmailItem,
  renderComicBookedEmail,
} from "@core/emails/comicBookedEmail";
import { sendEmail, sendHtmlEmail } from "@core/email";

const IS_ACTIVE = process.env.IS_ACTIVE === "1";
const IS_CRON = process.env.IS_CRON === "1";

// Unproven feature: gate sends to a hardcoded allowlist while it's being
// dogfooded. Empty (the current default) means nobody receives it yet. Not
// meant to be exhaustive -- just enough to keep this off by default until
// it's proven out, then widen or remove it.
const ALLOWED_EMAILS: string[] = [
  "mafzal91@gmail.com",
];
const ALLOWED_EMAILS_SET = new Set(
  ALLOWED_EMAILS.map((email) => email.toLowerCase())
);

// Comics tend to get added to a lineup in bursts as the day's booking
// settles, so hold the batch until the first queued act is this old.
// Everything that trickles in while we wait rides along in the same email.
const BATCH_WINDOW_MINUTES = 60;
const SEND_CHUNK_SIZE = 25;

export async function handler() {
  if (!IS_ACTIVE && IS_CRON) {
    return;
  }

  const pending = await getPendingComicActs();

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
      `Holding batch: ${pending.length} comic booking(s) queued, oldest queued ${batchAgeMinutes}m ago (window is ${BATCH_WINDOW_MINUTES}m)`
    );
    return {};
  }

  // Claim before sending so an overlapping run can't announce the same acts
  const claimed = await claimPendingComicActs(
    pending.map((item) => item.queueId)
  );

  if (!claimed.length) {
    console.log("Batch already claimed by another run");
    return {};
  }

  const claimedIds = new Set(claimed.map((row) => row.id));
  const nowInSeconds = Math.floor(now.getTime() / 1000);

  // Skip anything that started while the batch was collecting, and skip
  // shows that no longer have capacity as of this send-time snapshot
  const batch = pending.filter((item) => {
    if (!claimedIds.has(item.queueId)) return false;
    if ((item.show.timestamp ?? 0) <= nowInSeconds) return false;
    const available = (item.show.max ?? 0) - (item.show.totalGuests ?? 0);
    return available > 0;
  });

  if (!batch.length) {
    console.log("No upcoming shows with capacity left in the claimed batch");
    return {};
  }

  const comicIds = Array.from(new Set(batch.map((item) => item.comicId)));
  const subscriberRows = await getComicNotificationRecipientsForComics(
    comicIds
  );
  const recipientRows = subscriberRows.filter((row) =>
    ALLOWED_EMAILS_SET.has(row.email.toLowerCase())
  );

  if (!recipientRows.length) {
    console.log(
      `${subscriberRows.length} subscriber(s) found but none are allowlisted; skipping ${batch.length} queued booking(s)`
    );
    return {};
  }

  const itemsByComicId = new Map<number, ComicBookedEmailItem[]>();
  for (const item of batch) {
    const list = itemsByComicId.get(item.comicId) ?? [];
    list.push({
      comicName: item.comicName,
      comicImg: item.comicImg,
      timestamp: item.show.timestamp ?? 0,
      description: item.show.description,
      cover: item.show.cover,
      note: item.show.note,
      special: item.show.special,
      roomName: item.room?.name ?? null,
      available: (item.show.max ?? 0) - (item.show.totalGuests ?? 0),
    });
    itemsByComicId.set(item.comicId, list);
  }

  // Group into one email per subscriber, covering every comic (in this
  // batch) they follow, so a user following multiple newly-booked comics
  // gets a single email instead of one per comic
  const itemsByRecipient = new Map<string, ComicBookedEmailItem[]>();
  for (const { email, comicId } of recipientRows) {
    const comicItems = itemsByComicId.get(comicId);
    if (!comicItems) continue;
    const existing = itemsByRecipient.get(email) ?? [];
    itemsByRecipient.set(email, existing.concat(comicItems));
  }

  const recipients = Array.from(itemsByRecipient.entries());

  if (!recipients.length) {
    console.log(`No subscribers; skipping ${batch.length} queued booking(s)`);
    return {};
  }

  const failures: string[] = [];

  for (let i = 0; i < recipients.length; i += SEND_CHUNK_SIZE) {
    const chunk = recipients.slice(i, i + SEND_CHUNK_SIZE);
    const results = await Promise.allSettled(
      chunk.map(async ([email, items]) => {
        const { subject, html, text } = await renderComicBookedEmail({
          items,
        });
        return sendHtmlEmail({ to: email, subject, html, text });
      })
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        failures.push(`${chunk[index][0]}: ${result.reason}`);
      }
    });
  }

  console.log(
    `Announced ${batch.length} comic booking(s) to ${
      recipients.length - failures.length
    }/${recipients.length} subscriber(s)`
  );

  if (failures.length) {
    await sendEmail({
      subject: "Comic Notification Cron",
      message: `Failed to send ${failures.length} of ${
        recipients.length
      } comic-booking notification emails:\n\n${failures.join("\n")}`,
    }).catch((e) => console.error(e));
  }

  return {};
}
