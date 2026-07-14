// Renders the comic-booked notification email with fake data so you can see
// it without touching the DB, the cron, or SES.
//
// Preview only (writes HTML + text to disk, no send):
//   node_modules/.bin/tsx scripts/preview-comic-booked-email.tsx
//
// The template (packages/core/emails/comicBookedEmail.tsx) is a pure
// function — it takes plain booking data and returns { subject, html, text }.
import { writeFileSync } from "node:fs";
import {
  renderComicBookedEmail,
  type ComicBookedEmailItem,
} from "../packages/core/emails/comicBookedEmail";

const unix = (iso: string) => Math.floor(Date.parse(iso) / 1000);

// Fake bookings across two comics, one with two shows (tests grouping) and
// varied metadata/capacity.
const items: ComicBookedEmailItem[] = [
  {
    comicName: "Dave Chappelle",
    comicImg: "https://www.comedycellar.com/img/comics/dave-chappelle.jpg",
    timestamp: unix("2026-07-17T21:45:00-04:00"),
    description: "Surprise drop-in set",
    cover: 28,
    note: "2-drink minimum",
    special: true,
    roomName: "Village Underground",
    available: 3,
  },
  {
    comicName: "Dave Chappelle",
    comicImg: "https://www.comedycellar.com/img/comics/dave-chappelle.jpg",
    timestamp: unix("2026-07-18T20:00:00-04:00"),
    description: null,
    cover: 28,
    note: "2-drink minimum",
    special: false,
    roomName: "MacDougal St",
    available: 1,
  },
  {
    comicName: "Ali Wong",
    comicImg: null,
    timestamp: unix("2026-07-19T19:00:00-04:00"),
    description: "Late show — rotating lineup",
    cover: 24,
    note: null,
    special: false,
    roomName: "Fat Black Pussycat",
    available: 12,
  },
];

async function main() {
  const { subject, html, text } = await renderComicBookedEmail({ items });

  const outHtml = "scripts/.preview-comic-booked.html";
  const outText = "scripts/.preview-comic-booked.txt";
  writeFileSync(outHtml, html);
  writeFileSync(outText, text);

  console.log("Subject:", subject);
  console.log("HTML   :", outHtml);
  console.log("Text   :", outText);
}

main();
