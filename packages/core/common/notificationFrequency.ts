// Delivery cadence for the two GLOBAL subscriber emails (new shows, new
// comics). It does NOT apply to the per-comic "a comic I follow was booked"
// emails — those stay event-driven.
//
//   immediately — send as soon as there is something to announce (still held
//                 for the short batch window so a burst of new shows/comics
//                 rides in one email; this is the historical behaviour).
//   weekly      — at most one digest every 7 days.
//   monthly     — at most one digest every 30 days.
export const NOTIFICATION_FREQUENCIES = [
  "immediately",
  "weekly",
  "monthly",
] as const;

export type NotificationFrequency = (typeof NOTIFICATION_FREQUENCIES)[number];

export const DEFAULT_NOTIFICATION_FREQUENCY: NotificationFrequency =
  "immediately";

export function isNotificationFrequency(
  value: unknown
): value is NotificationFrequency {
  return (
    typeof value === "string" &&
    (NOTIFICATION_FREQUENCIES as readonly string[]).includes(value)
  );
}

// "immediately" still batches new items for up to an hour before sending so a
// burst of shows/comics posted together arrives in a single email.
export const IMMEDIATE_BATCH_WINDOW_MINUTES = 60;

const MINUTES = 60 * 1000;
const DAYS = 24 * 60 * MINUTES;

// Minimum time between two digests for a recipient at the given cadence.
export function frequencyIntervalMs(frequency: NotificationFrequency): number {
  switch (frequency) {
    case "weekly":
      return 7 * DAYS;
    case "monthly":
      return 30 * DAYS;
    case "immediately":
    default:
      return IMMEDIATE_BATCH_WINDOW_MINUTES * MINUTES;
  }
}
