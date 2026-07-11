import { formatInTimeZone } from "date-fns-tz";

// Pure template module: takes plain data in, returns subject/html/text.
// Keep it free of db/sst imports so it can be rendered and previewed offline.

const TIME_ZONE = "America/New_York";
const RESERVATION_URL = "https://www.comedycellar.com/reservation/?showid=";
const SITE_URL = "https://comedycellar.mafz.al";
const MANAGE_URL = `${SITE_URL}/profile`;

// Brand tokens borrowed from packages/frontend/src/theme.css
const COLOR = {
  bg: "#FBF6EC",
  surface: "#FFFFFF",
  ink: "#1A1714",
  muted: "#857B6D",
  faint: "#A99F8E",
  track: "#EDE7DA",
  yellow: "#F3C44C",
};

export type NewShowEmailItem = {
  timestamp: number; // unix seconds
  description: string | null;
  cover: number | null;
  note: string | null;
  special: boolean | null;
  roomName: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTime(timestamp: number) {
  return formatInTimeZone(timestamp * 1000, TIME_ZONE, "h:mm a");
}

function formatDateHeading(timestamp: number) {
  return formatInTimeZone(timestamp * 1000, TIME_ZONE, "EEEE, MMMM d");
}

function formatDateShort(timestamp: number) {
  return formatInTimeZone(timestamp * 1000, TIME_ZONE, "MMM d");
}

function metaLine(show: NewShowEmailItem) {
  const parts: string[] = [];
  if (show.cover) parts.push(`$${show.cover} cover`);
  if (show.note) parts.push(show.note);
  return parts.join(" · ");
}

function groupByDate(shows: NewShowEmailItem[]) {
  const groups = new Map<string, NewShowEmailItem[]>();
  for (const show of shows) {
    const key = formatInTimeZone(show.timestamp * 1000, TIME_ZONE, "yyyy-MM-dd");
    const group = groups.get(key) ?? [];
    group.push(show);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function renderShowRowHtml(show: NewShowEmailItem, isLast: boolean) {
  const meta = metaLine(show);
  const specialBadge = show.special
    ? `<span style="display:inline-block;background-color:${COLOR.ink};color:${COLOR.yellow};font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:2px 8px;border-radius:4px;margin-left:8px;vertical-align:middle;">Special</span>`
    : "";

  return `
              <tr>
                <td style="padding:18px 28px;${isLast ? "" : `border-bottom:1px dashed ${COLOR.track};`}">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td valign="top">
                        <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;color:${COLOR.ink};line-height:1.2;">${formatTime(show.timestamp)}${specialBadge}</div>
                        <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${COLOR.muted};text-transform:uppercase;letter-spacing:1.5px;padding-top:4px;">${escapeHtml(show.roomName ?? "Comedy Cellar")}</div>
                        ${
                          show.description
                            ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${COLOR.ink};padding-top:6px;">${escapeHtml(show.description)}</div>`
                            : ""
                        }
                        ${
                          meta
                            ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${COLOR.faint};padding-top:4px;">${escapeHtml(meta)}</div>`
                            : ""
                        }
                      </td>
                      <td valign="top" align="right" style="padding-left:16px;white-space:nowrap;">
                        <a href="${RESERVATION_URL}${show.timestamp}" style="display:inline-block;background-color:${COLOR.yellow};color:${COLOR.ink};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;text-decoration:none;padding:10px 18px;border:2px solid ${COLOR.ink};border-radius:8px;">Reserve&nbsp;&rarr;</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
}

function renderDateGroupHtml(group: NewShowEmailItem[]) {
  const heading = formatDateHeading(group[0].timestamp);
  const rows = group
    .map((show, index) => renderShowRowHtml(show, index === group.length - 1))
    .join("");

  return `
              <tr>
                <td style="background-color:${COLOR.yellow};border-top:2px solid ${COLOR.ink};border-bottom:2px solid ${COLOR.ink};padding:10px 28px;">
                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:bold;color:${COLOR.ink};text-transform:uppercase;letter-spacing:2px;">${heading}</div>
                </td>
              </tr>${rows}`;
}

export function renderNewShowsEmail({ shows }: { shows: NewShowEmailItem[] }) {
  const sorted = [...shows].sort((a, b) => a.timestamp - b.timestamp);
  const groups = groupByDate(sorted);
  const count = sorted.length;
  const plural = count === 1 ? "" : "s";

  const firstDate = formatDateShort(sorted[0].timestamp);
  const lastDate = formatDateShort(sorted[sorted.length - 1].timestamp);
  const dateRange = firstDate === lastDate ? firstDate : `${firstDate} – ${lastDate}`;

  const subject = `🎤 ${count} new Comedy Cellar show${plural} just dropped (${dateRange})`;
  const preheader = `Reservations are open for ${count} new show${plural} on the calendar. The best seats go fast.`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLOR.bg};">
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLOR.bg};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
            <!-- Masthead -->
            <tr>
              <td style="background-color:${COLOR.ink};border:2px solid ${COLOR.ink};border-radius:14px 14px 0 0;padding:28px 28px 24px;" align="center">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:12px;color:${COLOR.yellow};letter-spacing:6px;">&#9733;&nbsp;&#9733;&nbsp;&#9733;</div>
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:bold;color:${COLOR.yellow};letter-spacing:3px;padding-top:8px;">COMEDY CELLAR BOT</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#A99F90;text-transform:uppercase;letter-spacing:3px;padding-top:6px;">Fresh off the marquee</div>
              </td>
            </tr>
            <!-- Headline -->
            <tr>
              <td style="background-color:${COLOR.surface};border-left:2px solid ${COLOR.ink};border-right:2px solid ${COLOR.ink};padding:28px 28px 22px;" align="center">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:bold;color:${COLOR.ink};line-height:1.25;">${count} new show${plural} just hit the calendar</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${COLOR.muted};line-height:1.5;padding-top:10px;">Reservations are open now &mdash; the best tables go fast.</div>
              </td>
            </tr>
            <!-- Shows -->
            <tr>
              <td style="background-color:${COLOR.surface};border-left:2px solid ${COLOR.ink};border-right:2px solid ${COLOR.ink};padding:0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${groups.map(renderDateGroupHtml).join("")}
                </table>
              </td>
            </tr>
            <!-- Card footer -->
            <tr>
              <td style="background-color:${COLOR.surface};border:2px solid ${COLOR.ink};border-top:0;border-radius:0 0 14px 14px;padding:24px 28px;" align="center">
                <a href="${SITE_URL}" style="display:inline-block;background-color:${COLOR.ink};color:${COLOR.yellow};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:8px;">Browse the full calendar</a>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:24px 28px;" align="center">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${COLOR.faint};line-height:1.6;">
                  You&#39;re receiving this because new-show notifications are turned on for your account.<br />
                  <a href="${MANAGE_URL}" style="color:${COLOR.muted};text-decoration:underline;">Manage notification settings</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textGroups = groups
    .map((group) => {
      const heading = formatDateHeading(group[0].timestamp);
      const lines = group.map((show) => {
        const meta = metaLine(show);
        return [
          `  ${formatTime(show.timestamp)} — ${show.roomName ?? "Comedy Cellar"}${show.special ? " (Special)" : ""}`,
          show.description ? `    ${show.description}` : null,
          meta ? `    ${meta}` : null,
          `    Reserve: ${RESERVATION_URL}${show.timestamp}`,
        ]
          .filter(Boolean)
          .join("\n");
      });
      return `${heading}\n${lines.join("\n\n")}`;
    })
    .join("\n\n");

  const text = `NEW SHOWS AT THE COMEDY CELLAR

${count} new show${plural} just hit the calendar (${dateRange}). Reservations are open now.

${textGroups}

Browse the full calendar: ${SITE_URL}

---
You're receiving this because new-show notifications are turned on for your account.
Manage notification settings: ${MANAGE_URL}`;

  return { subject, html, text };
}
