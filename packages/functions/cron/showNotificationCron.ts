import {
  getPendingNewShows,
  prunePastShows,
} from "@core/models/newShowQueue";
import {
  getShowNotificationRecipients,
  markShowNotificationsNotified,
} from "@core/models/showNotification";
import { selectDueRecipients } from "@core/notificationDelivery";
import { renderNewShowsEmail } from "@core/emails/newShowsEmail";
import { sendEmail, sendHtmlEmail } from "@core/email";
import {
  UnsubscribeChannel,
  createUnsubscribeToken,
} from "@core/unsubscribe";
import { unsubscribeUrl } from "@core/emails/shared/constants";

const IS_ACTIVE = process.env.IS_ACTIVE === "1";
const IS_CRON = process.env.IS_CRON === "1";

const SEND_CHUNK_SIZE = 25;

export async function handler() {
  if (!IS_ACTIVE && IS_CRON) {
    return;
  }

  const now = new Date();

  // Retained outbox of upcoming shows; each subscriber is served the ones
  // queued since their own last digest, no more often than their cadence.
  const pending = await getPendingNewShows(now);

  if (!pending.length) {
    await prunePastShows(now);
    return {};
  }

  const recipients = await getShowNotificationRecipients();

  const due = selectDueRecipients(recipients, pending, now);

  if (!due.length) {
    await prunePastShows(now);
    return {};
  }

  // Advance every due recipient's cursor BEFORE sending, so a send failure just
  // means that recipient misses this batch (never a repeat), exactly as the old
  // outbox behaved. NOTE: this UPDATE is unconditional, so unlike the old
  // per-row conditional claim it does NOT fully guarantee mutual exclusion — two
  // overlapping runs (at-least-once delivery, or a slow run overlapping the next
  // tick) could each read the same cursor and both send. Accepted: low
  // probability at this scale, and the failure is a rare duplicate, not a miss.
  await markShowNotificationsNotified(
    due.map(({ recipient }) => recipient.userId),
    now
  );

  const nowInSeconds = Math.floor(now.getTime() / 1000);
  const failures: string[] = [];

  for (let i = 0; i < due.length; i += SEND_CHUNK_SIZE) {
    const chunk = due.slice(i, i + SEND_CHUNK_SIZE);
    const results = await Promise.allSettled(
      chunk.map(async ({ recipient, items }) => {
        const shows = items
          .filter(({ show }) => (show.timestamp ?? 0) > nowInSeconds)
          .map(({ show, room }) => ({
            timestamp: show.timestamp ?? 0,
            description: show.description,
            cover: show.cover,
            note: show.note,
            special: show.special,
            roomName: room?.name ?? null,
          }));

        if (!shows.length) return;

        const unsubUrl = unsubscribeUrl(
          createUnsubscribeToken(
            recipient.externalId,
            UnsubscribeChannel.NEW_SHOWS
          )
        );
        const { subject, html, text } = await renderNewShowsEmail({
          shows,
          unsubscribeUrl: unsubUrl,
        });
        return sendHtmlEmail({
          to: recipient.email,
          subject,
          html,
          text,
          unsubscribeUrl: unsubUrl,
        });
      })
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        failures.push(`${chunk[index].recipient.email}: ${result.reason}`);
      }
    });
  }

  console.log(
    `Announced new shows to ${due.length - failures.length}/${
      due.length
    } due subscriber(s)`
  );

  await prunePastShows(now);

  if (failures.length) {
    await sendEmail({
      subject: "Show Notification Cron",
      message: `Failed to send ${failures.length} of ${
        due.length
      } new-show notification emails:\n\n${failures.join("\n")}`,
    }).catch((e) => console.error(e));
  }

  return {};
}
