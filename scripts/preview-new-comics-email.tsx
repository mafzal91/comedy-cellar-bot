// Renders the new-comics notification email with fake data so you can see it
// without touching the DB, the cron, or SES.
//
// Preview only (writes HTML + text to disk, no send):
//   node_modules/.bin/tsx scripts/preview-new-comics-email.tsx
//
// The template (packages/core/emails/newComicsEmail.tsx) is a pure function —
// it takes plain comic data and returns { subject, html, text }.
import { writeFileSync } from "node:fs";
import {
  renderNewComicsEmail,
  type NewComicEmailItem,
} from "../packages/core/emails/newComicsEmail";

// Fake comics with varied metadata (photo/no-photo, website/no-website).
const comics: NewComicEmailItem[] = [
  {
    name: "Nabil Abdulrashid",
    img: "https://www.comedycellar.com/wp-content/uploads/nabil.jpg",
    website: "https://example.com/nabil",
    description: "sharp crowd work and political material",
  },
  {
    name: "Sam Morril",
    img: "https://www.comedycellar.com/wp-content/uploads/sam.jpg",
    website: null,
    description: null,
  },
  {
    name: "Michelle Wolf",
    img: null,
    website: "https://example.com/michelle",
    description: "a debut on the late set",
  },
];

async function main() {
  const { subject, html, text } = await renderNewComicsEmail({ comics });

  const outHtml = "scripts/.preview-new-comics.html";
  const outText = "scripts/.preview-new-comics.txt";
  writeFileSync(outHtml, html);
  writeFileSync(outText, text);

  console.log("Subject:", subject);
  console.log("HTML   :", outHtml);
  console.log("Text   :", outText);
}

main();
