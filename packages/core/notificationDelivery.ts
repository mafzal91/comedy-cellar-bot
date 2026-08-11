import { differenceInMilliseconds } from "date-fns";

import {
  IMMEDIATE_BATCH_WINDOW_MINUTES,
  frequencyIntervalMs,
  isNotificationFrequency,
} from "./common/notificationFrequency";

// A subscriber to one of the global digests (new shows / new comics), carrying
// the per-user delivery cursor needed to honour their chosen cadence.
export type DigestRecipient = {
  userId: number;
  email: string;
  externalId: string;
  frequency: string;
  lastNotifiedAt: Date | null;
};

// Anything queued for announcement; only its enqueue time matters here.
export type QueuedItem = { queuedAt: Date };

const IMMEDIATE_BATCH_WINDOW_MS = IMMEDIATE_BATCH_WINDOW_MINUTES * 60 * 1000;

// Given every subscriber and every still-pending item, decide who gets an email
// on this tick and which items each one should receive.
//
// Per-user cursor model: a recipient is owed every item queued AFTER their
// `lastNotifiedAt`, but never more often than their cadence allows. This
// replaces the old global "claim the whole queue once" outbox so that a weekly
// or monthly subscriber can still be served items an "immediately" subscriber
// already saw.
export function selectDueRecipients<
  R extends DigestRecipient,
  I extends QueuedItem
>(recipients: R[], pending: I[], now: Date): Array<{ recipient: R; items: I[] }> {
  const due: Array<{ recipient: R; items: I[] }> = [];

  for (const recipient of recipients) {
    const frequency = isNotificationFrequency(recipient.frequency)
      ? recipient.frequency
      : "immediately";
    const cursor = recipient.lastNotifiedAt;

    // Everything this recipient has not been told about yet.
    const items = pending.filter((item) => !cursor || item.queuedAt > cursor);
    if (!items.length) continue;

    if (cursor) {
      // Already had a digest — enforce the cadence between digests.
      if (differenceInMilliseconds(now, cursor) < frequencyIntervalMs(frequency)) {
        continue;
      }
    } else {
      // Never notified. Hold the very first digest for the short batch window
      // so a burst of items posted together arrives in one email; the cadence
      // then applies from this first send onward, regardless of frequency.
      const oldest = items.reduce(
        (min, item) => (item.queuedAt < min ? item.queuedAt : min),
        items[0].queuedAt
      );
      if (differenceInMilliseconds(now, oldest) < IMMEDIATE_BATCH_WINDOW_MS) {
        continue;
      }
    }

    due.push({ recipient, items });
  }

  return due;
}
