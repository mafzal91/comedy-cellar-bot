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
}

main();
