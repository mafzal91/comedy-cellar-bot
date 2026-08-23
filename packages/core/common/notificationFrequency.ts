// Delivery cadence for the two GLOBAL subscriber emails (new shows, new
// comics). It does NOT apply to the per-comic "a comic I follow was booked"
// emails — those stay event-driven.
//
// The cadence is stored as an arbitrary INTERVAL IN MINUTES so any value is
// possible on the backend; the UI only exposes a curated set of presets (see
// FREQUENCY_PRESETS) so end users pick a friendly label rather than a number.
//
//   0 (immediately) — send as soon as there is something to announce. Still
//                     held for the short batch window (below) so a burst of new
//                     shows/comics rides in one email; this is the historical
//                     behaviour.
//   any N > 0       — at most one digest every N minutes.

export const MINUTES_PER_DAY = 24 * 60;

// "immediately" still batches new items for up to an hour before sending, and
// this doubles as the GLOBAL minimum spacing between any two digests: no
// cadence, however small, emails a user more often than once per window.
export const IMMEDIATE_BATCH_WINDOW_MINUTES = 60;

export const FREQUENCY_IMMEDIATELY = 0;
export const FREQUENCY_WEEKLY = 7 * MINUTES_PER_DAY; // 10080
export const FREQUENCY_MONTHLY = 30 * MINUTES_PER_DAY; // 43200

export const DEFAULT_FREQUENCY_MINUTES = FREQUENCY_IMMEDIATELY;

// The longest cadence the pipeline can honour is bounded by how long queue rows
// are retained (see COMIC_QUEUE_RETENTION_DAYS in models/newComicQueue.ts):
// a subscriber's cursor may be up to their cadence old, and the items queued
// since then must still exist. Keep this comfortably below the retention window
// so a max-cadence digest is never assembled from a half-pruned queue.
export const MAX_FREQUENCY_MINUTES = 40 * MINUTES_PER_DAY; // 57600

// Curated presets the UI offers. Storage/validation is not limited to these —
// they exist purely so end users pick a label instead of typing minutes.
export const FREQUENCY_PRESETS = [
  { label: "Immediately", minutes: FREQUENCY_IMMEDIATELY },
  { label: "Weekly", minutes: FREQUENCY_WEEKLY },
  { label: "Monthly", minutes: FREQUENCY_MONTHLY },
] as const;

export function isValidFrequencyMinutes(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_FREQUENCY_MINUTES
  );
}

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
