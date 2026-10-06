import { describe, expect, it } from "vitest";

import { selectDueRecipients } from "./notificationDelivery";

const at = (iso: string) => new Date(iso);
const minutesBefore = (date: Date, minutes: number) =>
  new Date(date.getTime() - minutes * 60 * 1000);

const now = at("2026-10-20T12:30:00Z");

// An "immediately" subscriber whose last digest was long enough ago that the
// cadence never holds them back; only the settle period is under test.
const immediate = {
  userId: 1,
  email: "a@example.com",
  externalId: "user_1",
  frequencyMinutes: 0,
  lastNotifiedAt: at("2026-10-19T00:00:00Z"),
};

describe("selectDueRecipients settle period", () => {
  it("holds every recipient while the newest item is still settling", () => {
    // A drop being scraped: the first night queued 20 minutes ago, the latest
    // night just now. Sending would split the drop across two emails.
    const pending = [
      { queuedAt: minutesBefore(now, 20) },
      { queuedAt: minutesBefore(now, 1) },
    ];
    expect(selectDueRecipients([immediate], pending, now)).toEqual([]);
  });

  it("sends the whole drop once the queue has been quiet long enough", () => {
    const pending = [
      { queuedAt: minutesBefore(now, 20) },
      { queuedAt: minutesBefore(now, 12) },
    ];
    const due = selectDueRecipients([immediate], pending, now);
    expect(due).toHaveLength(1);
    expect(due[0].items).toHaveLength(2);
  });

  it("still enforces the cadence after the queue settles", () => {
    const pending = [{ queuedAt: minutesBefore(now, 30) }];
    const recent = { ...immediate, lastNotifiedAt: minutesBefore(now, 20) };
    expect(selectDueRecipients([recent], pending, now)).toEqual([]);
  });
});
