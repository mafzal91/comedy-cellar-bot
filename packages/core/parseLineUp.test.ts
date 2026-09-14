import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

import { parseLineUp } from "./parseLineUp";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "../__fixtures__", name), "utf-8");

describe("parseLineUp", () => {
  it("computes each show's timestamp from the requested date and the displayed time, not the showid", () => {
    // Captured live from comedycellar.com on 2026-09-13 for date 2026-09-14.
    // Expected timestamps are getShows' values for the same date and times,
    // captured separately, not the showid in this fixture's own HTML - the
    // showid is known to disagree with getShows and must not be used.
    const html = fixture("lineup-2026-09-14.html");
    const result = parseLineUp({ html, date: "2026-09-14" });

    expect(result.map((show) => show.timestamp)).toEqual([
      1789419600, // 5:00 pm
      1789423200, // 6:00 pm
      1789426800, // 7:00 pm
      1789428600, // 7:30 pm
      1789428900, // 7:35 pm
      1789430400, // 8:00 pm
      1789432200, // 8:30 pm
      1789435800, // 9:30 pm
      1789436100, // 9:35 pm
      1789437600, // 10:00 pm
      1789443000, // 11:30 pm
    ]);

    expect(result).toHaveLength(11);
    for (const show of result) {
      expect(show.acts.length).toBeGreaterThan(0);
      for (const act of show.acts) {
        expect(act.name).toBeTruthy();
      }
    }
  });

  it("returns an empty list for a day with no lineups posted yet", () => {
    const html = fixture("lineup-no-shows.html");
    const result = parseLineUp({ html, date: "2026-09-19" });
    expect(result).toEqual([]);
  });

  it("keeps the requested date for an after-midnight show instead of rolling to the next day", () => {
    // Synthetic fixture mirroring the real markup shape. The expected
    // timestamp for the "12:30 am" show is getShows' real value for
    // 2026-09-19 (verified live: getShows reports that show at
    // 2026-09-19T00:30:00 America/New_York, the SAME calendar date you
    // requested - comedycellar.com does not roll after-midnight shows to
    // the next date even though its own site groups them with the prior
    // evening for browsing).
    const html = fixture("lineup-after-midnight.html");
    const result = parseLineUp({ html, date: "2026-09-19" });

    expect(result.map((show) => show.timestamp)).toEqual([
      1789876500, // 11:55 pm, same day
      1789792200, // 12:30 am, still 2026-09-19 - not rolled to 2026-09-20
    ]);
  });
});
