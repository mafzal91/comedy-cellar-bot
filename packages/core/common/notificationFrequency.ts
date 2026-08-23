// Delivery cadence for the two GLOBAL subscriber emails (new shows, new
// comics). It does NOT apply to the per-comic "a comic I follow was booked"
// emails — those stay event-driven.
//
// The cadence is stored as an arbitrary INTERVAL IN MINUTES so any value is
// possible on the backend; the UI only exposes a curated set of presets (see
// FREQUENCY_PRESETS) so end users pick a friendly label rather than a number.
//
//   0 (immediately) — the shortest cadence: a digest as often as the batch
//                     window (below) allows. For an "immediately" user that
//                     spacing is what makes a burst of shows/comics land in one
//                     email — they fall inside the same gap between sends.
//   any N > 0       — at most one digest every N minutes.

export const MINUTES_PER_DAY = 24 * 60;

// The 60-minute window is the GLOBAL minimum spacing between any two digests:
// no cadence, however small, emails a user more often than once per window.
// It is spacing measured from the last send, not a hold on each item — only a
// brand-new subscriber's first digest waits out the window itself.
export const IMMEDIATE_BATCH_WINDOW_MINUTES = 60;

export const FREQUENCY_IMMEDIATELY = 0;
export const FREQUENCY_WEEKLY = 7 * MINUTES_PER_DAY; // 10080
export const FREQUENCY_MONTHLY = 30 * MINUTES_PER_DAY; // 43200

export const DEFAULT_FREQUENCY_MINUTES = FREQUENCY_IMMEDIATELY;

// The longest cadence the pipeline could honour, bounded by how long queue rows
// are retained (see COMIC_QUEUE_RETENTION_DAYS in models/newComicQueue.ts):
// a subscriber's cursor may be up to their cadence old, and the items queued
// since then must still exist. This documents that ceiling — nothing currently
// enforces it, because the API only accepts the presets below (max = Monthly,
// 30 days), comfortably inside the 45-day retention window. It becomes a real
// bound only if the API is ever opened up to arbitrary intervals.
export const MAX_FREQUENCY_MINUTES = 40 * MINUTES_PER_DAY; // 57600

// Curated presets the UI offers. Storage is not limited to these — the column
// holds any interval — but the API is: see isAllowedFrequencyMinutes below.
export const FREQUENCY_PRESETS = [
  { label: "Immediately", minutes: FREQUENCY_IMMEDIATELY },
  { label: "Weekly", minutes: FREQUENCY_WEEKLY },
  { label: "Monthly", minutes: FREQUENCY_MONTHLY },
] as const;

// The exact minute values behind the UI presets. The DB column accepts any
// interval (future-proofing), but the API only lets users SET one of these —
// so the storage layer stays flexible while the user-facing surface is locked
// to the curated presets for now.
export const FREQUENCY_PRESET_MINUTES: readonly number[] =
  FREQUENCY_PRESETS.map((preset) => preset.minutes);

export function isAllowedFrequencyMinutes(value: unknown): value is number {
  return (
    typeof value === "number" && FREQUENCY_PRESET_MINUTES.includes(value)
  );
}

// Minimum time between two digests for a recipient at the given cadence. The
// batch window is a floor, so an "immediately" (0) subscriber is still spaced
// by one window and never emailed more than once per window.
export function frequencyIntervalMs(frequencyMinutes: number): number {
  const effectiveMinutes = Math.max(
    frequencyMinutes,
    IMMEDIATE_BATCH_WINDOW_MINUTES
  );
  return effectiveMinutes * 60 * 1000;
}
