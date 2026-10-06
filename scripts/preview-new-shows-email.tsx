// Renders the new-shows notification email with fake data so you can see it
// without touching the DB, the cron, or SES.
//
// Preview only (writes HTML + text to disk, no send):
//   node_modules/.bin/tsx scripts/preview-new-shows-email.tsx
//
// The template (packages/core/emails/newShowsEmail.tsx) is a pure function —
// it takes plain show data and returns { subject, html, text }.
import { writeFileSync } from "node:fs";
import {
  renderNewShowsEmail,
  type NewShowEmailItem,
} from "../packages/core/emails/newShowsEmail";

const unix = (iso: string) => Math.floor(Date.parse(iso) / 1000);

// Fake shows across two nights, including a "special" and varied metadata.
const shows: NewShowEmailItem[] = [
  {
    timestamp: unix("2026-07-17T19:00:00-04:00"),
    description: "Featuring surprise drop-ins",
    cover: 28,
    note: "2-drink minimum",
    special: false,
    roomName: "MacDougal St",
    soldOut: false,
  },
  {
    timestamp: unix("2026-07-17T21:45:00-04:00"),
    description: "Late show — rotating lineup",
    cover: 24,
    note: null,
    special: true,
    roomName: "Village Underground",
    // Announced to us and already full — the case the copy has to be honest about.
    soldOut: true,
  },
  {
    timestamp: unix("2026-07-18T20:00:00-04:00"),
    description: null,
    cover: 28,
    note: "2-drink minimum",
    special: false,
    roomName: "MacDougal St",
    soldOut: false,
  },
];

// The reported bug: a single show that is sold out the moment we learn of it.
const allSoldOut: NewShowEmailItem[] = [
  {
    timestamp: unix("2026-07-17T17:00:00-04:00"),
    description: "5pm Aziz Ansari Working On New Material",
    cover: 25,
    note: "Two-item minimum per person",
    special: true,
    roomName: "MacDougal St",
    soldOut: true,
  },
];

// A bulk calendar release: three weeks of the regular rotation across three rooms
// (~200 shows), with a handful of specials / named shows and some already
// full. This is the case that triggers the compact layout.
function bulkDrop(): NewShowEmailItem[] {
  const rooms: Array<[string, string[], string[]]> = [
    // [room, weeknight times, extra weekend times]
    ["MacDougal St", ["19:00", "20:30", "21:45", "23:00"], ["00:15"]],
    ["Village Underground", ["19:30", "21:30", "23:30"], []],
    ["Fat Black Pussycat", ["20:00", "22:00"], ["23:45"]],
  ];
  const named: Record<string, Partial<NewShowEmailItem>> = {
    "2026-10-22T19:00": { description: "Dave Attell & Friends", special: true },
    "2026-10-24T21:45": { description: "Album taping \u2014 no phones", special: true, cover: 40 },
    "2026-10-25T17:00": { description: "5pm Aziz Ansari Working On New Material", special: true, soldOut: true },
    "2026-10-29T20:00": { description: "Hot Soup: the Cellar's open writers' room" },
    "2026-11-01T19:30": { special: true },
  };
  const shows: NewShowEmailItem[] = [];
  for (let d = 0; d < 21; d++) {
    const day = new Date(Date.UTC(2026, 9, 20 + d));
    const date = day.toISOString().slice(0, 10);
    const weekend = [5, 6].includes(day.getUTCDay());
    for (const [roomName, times, weekendTimes] of rooms) {
      for (const time of weekend ? [...times, ...weekendTimes] : times) {
        // After-midnight shows belong to the next calendar day in NY time.
        // NY leaves daylight time on Nov 1, 2026.
        const showDate = time.startsWith("00")
          ? new Date(Date.UTC(2026, 9, 21 + d)).toISOString().slice(0, 10)
          : date;
        // The 00:15 show on Nov 1 is still EDT; the clocks change at 2am.
        const offset =
          showDate > "2026-11-01" || (showDate === "2026-11-01" && !time.startsWith("00"))
            ? "-05:00"
            : "-04:00";
        const iso = `${showDate}T${time}:00${offset}`;
        shows.push({
          timestamp: unix(iso),
          description: null,
          cover: roomName === "Fat Black Pussycat" ? 20 : 25,
          note: "Two-item minimum per person",
          special: false,
          roomName,
          // Weekend prime-time MacDougal shows are gone by the time we scrape.
          soldOut: weekend && roomName === "MacDougal St" && time === "21:45",
          ...named[`${date}T${time}`],
        });
      }
    }
  }
  // An early show outside the regular rotation slots.
  shows.push({
    timestamp: unix("2026-10-25T17:00:00-04:00"),
    cover: 25,
    note: "Two-item minimum per person",
    roomName: "MacDougal St",
    special: false,
    soldOut: false,
    description: null,
    ...named["2026-10-25T17:00"],
  });
  return shows;
}

async function main() {
  const { subject, html, text } = await renderNewShowsEmail({ shows });

  const outHtml = "scripts/.preview-new-shows.html";
  const outText = "scripts/.preview-new-shows.txt";
  writeFileSync(outHtml, html);
  writeFileSync(outText, text);

  console.log("Subject:", subject);
  console.log("HTML   :", outHtml);
  console.log("Text   :", outText);

  const soldOutOnly = await renderNewShowsEmail({ shows: allSoldOut });
  const outSoldOutHtml = "scripts/.preview-new-shows-soldout.html";
  const outSoldOutText = "scripts/.preview-new-shows-soldout.txt";
  writeFileSync(outSoldOutHtml, soldOutOnly.html);
  writeFileSync(outSoldOutText, soldOutOnly.text);

  console.log("");
  console.log("Sold-out subject:", soldOutOnly.subject);
  console.log("Sold-out HTML   :", outSoldOutHtml);
  console.log("Sold-out text   :", outSoldOutText);

  const bulk = await renderNewShowsEmail({ shows: bulkDrop() });
  const outBulkHtml = "scripts/.preview-new-shows-bulk.html";
  const outBulkText = "scripts/.preview-new-shows-bulk.txt";
  writeFileSync(outBulkHtml, bulk.html);
  writeFileSync(outBulkText, bulk.text);

  console.log("");
  console.log("Bulk subject:", bulk.subject);
  console.log("Bulk HTML   :", outBulkHtml, `(${Math.round(Buffer.byteLength(bulk.html) / 1024)} KB)`);
  console.log("Bulk text   :", outBulkText);
}

main();
