// Explicit React import keeps this file working under both the classic and
// automatic JSX transforms, whichever the bundler is configured for
import * as React from "react";

import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import { formatInTimeZone } from "date-fns-tz";

// Pure template module: takes plain data in, returns subject/html/text.
// Keep it free of db/sst imports so it can be rendered and previewed offline.

import { BrowseCalendarFooter } from "./shared/BrowseCalendarFooter";
import { buildTextFooter } from "./shared/buildTextFooter";
import { COLOR, RESERVATION_URL, SANS, SERIF, SITE_URL, TIME_ZONE } from "./shared/constants";
import { EmailFooter } from "./shared/EmailFooter";
import {
  formatDateHeading,
  formatDateShort,
  formatDayAbbrev,
  formatTime,
  formatTimeCompact,
} from "./shared/format";
import { Masthead } from "./shared/Masthead";
import { ReserveButton } from "./shared/ReserveButton";
import { SoldOutBadge } from "./shared/SoldOutBadge";
import { SpecialBadge } from "./shared/SpecialBadge";

export type NewShowEmailItem = {
  timestamp: number; // unix seconds
  description: string | null;
  cover: number | null;
  note: string | null;
  special: boolean | null;
  roomName: string | null;
  // A show can be announced to us and already be unbookable: the venue posts
  // it and it fills before our scrape ever sees it. Carry that through so the
  // email never promises a reservation that cannot be made.
  soldOut: boolean;
};

// "Sold out" at the Cellar means no online reservation, not no entry: unclaimed
// seats go to the standby line at showtime (the venue says so in its own
// confirmation email, see packages/__fixtures__/createReservation.ts). So a
// sold-out show still has a next step for the reader, and the copy says what it
// is instead of dead-ending.
export const STANDBY_NOTE =
  "Sold out online \u2014 the standby line at the door still gets people in.";

// Copy for the headline block and the plain-text lede. "New" here means new to
// us, not necessarily newly bookable — see soldOut above.
export function announcementCopy(shows: NewShowEmailItem[]) {
  const count = shows.length;
  const plural = count === 1 ? "" : "s";
  const soldOut = shows.filter((show) => show.soldOut).length;

  if (soldOut === 0) {
    return {
      headline: `${count} new show${plural} just hit the calendar`,
      subline: "Reservations are open now \u2014 the best tables go fast.",
      subjectSuffix: "",
    };
  }

  if (soldOut === count) {
    return {
      headline:
        count === 1
          ? "1 new show just hit the calendar \u2014 already sold out"
          : `${count} new shows just hit the calendar \u2014 all sold out`,
      subline:
        (count === 1 ? "Reservations are gone" : "Reservations are gone on all of them") +
        ", but unclaimed seats go to the standby line at showtime \u2014 turn up early and you have a shot.",
      subjectSuffix: " \u2014 already sold out",
    };
  }

  const open = count - soldOut;
  return {
    headline: `${count} new show${plural} just hit the calendar`,
    subline: `${open} still open for reservations. The other ${soldOut === 1 ? "one is" : `${soldOut} are`} sold out, but the standby line at the door is still worth a try.`,
    subjectSuffix: `, ${open} still bookable`,
  };
}

// When the Cellar opens a new block of dates it posts hundreds of shows at
// once. A full card per show then runs to hundreds of KB (Gmail clips anything
// over ~102KB, hiding the rest and the unsubscribe link) and is mostly the same
// "7:00 PM, MacDougal St" row repeated. Past this many shows the email switches
// to the compact layout: a few full cards for the shows worth reading about,
// then one row per night with each show as a small time chip.
export const COMPACT_THRESHOLD = 20;

// Cap on full cards in the compact layout so a drop full of specials cannot
// grow back into the long email; any overflow stays in the day grid, starred.
export const FEATURED_LIMIT = 8;

// A show is worth a full card when it differs from the regular rotation:
// flagged special, or carrying its own description (a named headliner, a
// taping, a themed night).
export function isFeatured(show: NewShowEmailItem) {
  return Boolean(show.special) || Boolean(show.description?.trim());
}

// Splits a (timestamp-sorted) batch into the shows that get full cards and the
// ones summarised in the day grid. Below the threshold everything is a card.
export function planLayout(shows: NewShowEmailItem[]) {
  if (shows.length <= COMPACT_THRESHOLD) {
    return { compact: false, featured: shows, rest: [] as NewShowEmailItem[] };
  }
  const featured = shows.filter(isFeatured).slice(0, FEATURED_LIMIT);
  const featuredSet = new Set(featured);
  const rest = shows.filter((show) => !featuredSet.has(show));
  return { compact: true, featured, rest };
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
  return Array.from(groups.values());
}

function ShowRow({
  show,
  isLast,
  withDate = false,
}: {
  show: NewShowEmailItem;
  isLast: boolean;
  // Cards outside a DateGroup (the compact layout's featured list) have no date
  // heading above them, so they carry their own.
  withDate?: boolean;
}) {
  const meta = metaLine(show);

  return (
    <Section
      style={{
        padding: "18px 28px",
        borderBottom: isLast ? undefined : `1px dashed ${COLOR.track}`,
      }}
    >
      <Row>
        <Column>
          {withDate ? (
            <Text
              style={{
                margin: 0,
                paddingBottom: "4px",
                fontFamily: SANS,
                fontSize: "12px",
                fontWeight: "bold",
                color: COLOR.ink,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
              }}
            >
              {formatDateHeading(show.timestamp)}
            </Text>
          ) : null}
          <Text
            style={{
              margin: 0,
              fontFamily: SERIF,
              fontSize: "20px",
              fontWeight: "bold",
              color: COLOR.ink,
              lineHeight: "1.2",
            }}
          >
            {formatTime(show.timestamp)}
            {show.special ? <SpecialBadge /> : null}
          </Text>
          <Text
            style={{
              margin: 0,
              paddingTop: "4px",
              fontFamily: SANS,
              fontSize: "12px",
              color: COLOR.muted,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
            }}
          >
            {show.roomName ?? "Comedy Cellar"}
          </Text>
          {show.description ? (
            <Text
              style={{
                margin: 0,
                paddingTop: "6px",
                fontFamily: SANS,
                fontSize: "14px",
                color: COLOR.ink,
              }}
            >
              {show.description}
            </Text>
          ) : null}
          {meta ? (
            <Text
              style={{
                margin: 0,
                paddingTop: "4px",
                fontFamily: SANS,
                fontSize: "12px",
                color: COLOR.faint,
              }}
            >
              {meta}
            </Text>
          ) : null}
          {show.soldOut ? (
            <Text
              style={{
                margin: 0,
                paddingTop: "6px",
                fontFamily: SANS,
                fontSize: "12px",
                fontStyle: "italic",
                color: COLOR.muted,
              }}
            >
              {STANDBY_NOTE}
            </Text>
          ) : null}
        </Column>
        <Column align="right" style={{ paddingLeft: "16px", whiteSpace: "nowrap", verticalAlign: "top" }}>
          {show.soldOut ? (
            <SoldOutBadge />
          ) : (
            <ReserveButton timestamp={show.timestamp} />
          )}
        </Column>
      </Row>
    </Section>
  );
}

function DateGroup({ group }: { group: NewShowEmailItem[] }) {
  return (
    <>
      <Section
        style={{
          backgroundColor: COLOR.yellow,
          borderTop: `2px solid ${COLOR.ink}`,
          borderBottom: `2px solid ${COLOR.ink}`,
          padding: "10px 28px",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: SERIF,
            fontSize: "15px",
            fontWeight: "bold",
            color: COLOR.ink,
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          {formatDateHeading(group[0].timestamp)}
        </Text>
      </Section>
      {group.map((show, index) => (
        <ShowRow
          key={show.timestamp}
          show={show}
          isLast={index === group.length - 1}
        />
      ))}
    </>
  );
}

const roomKey = (show: NewShowEmailItem) => show.roomName ?? "Comedy Cellar";

// Rooms in a fixed order (by name) so every night's rows line up the same way
// and a reader can scan one room straight down the grid.
function groupByRoom(shows: NewShowEmailItem[]) {
  const rooms = new Map<string, NewShowEmailItem[]>();
  const byRoom = [...shows].sort((a, b) => roomKey(a).localeCompare(roomKey(b)));
  for (const show of byRoom) {
    const key = roomKey(show);
    const group = rooms.get(key) ?? [];
    group.push(show);
    rooms.set(key, group);
  }
  return Array.from(rooms.entries());
}

// Chip styles are kept to the bare minimum per element: a drop can carry 200+
// chips, so every byte here is multiplied. Font, size and weight are inherited
// from the wrapping <Text> in DayGridRow instead.
const chipBase = {
  display: "inline-block",
  padding: "4px 8px",
  margin: "0 4px 6px 0",
  borderRadius: "6px",
};

// One show in the day grid. Bookable shows are links straight to the
// reservation page; sold-out ones are struck through and not links, matching
// the full card's rule of never offering a reservation that cannot be made.
function TimeChip({ show }: { show: NewShowEmailItem }) {
  const label = `${formatTimeCompact(show.timestamp)}${show.special ? " \u2605" : ""}`;
  if (show.soldOut) {
    return (
      <span
        style={{
          ...chipBase,
          backgroundColor: COLOR.track,
          color: COLOR.faint,
          textDecoration: "line-through",
        }}
      >
        {label}
      </span>
    );
  }
  return (
    <a
      href={`${RESERVATION_URL}${show.timestamp}`}
      style={{
        ...chipBase,
        color: COLOR.ink,
        border: `1px solid ${COLOR.ink}`,
        textDecoration: "none",
      }}
    >
      {label}
    </a>
  );
}

// Built from plain table/p markup rather than react-email's Row/Column/Text:
// those wrap every element in nested tables and repeated margin resets, which
// at ~20 nights x 3 rooms was half the weight of the compact email.
function DayGridRow({ group, isLast }: { group: NewShowEmailItem[]; isLast: boolean }) {
  const first = group[0].timestamp;
  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{
        padding: "12px 28px 6px",
        borderBottom: isLast ? undefined : `1px dashed ${COLOR.track}`,
      }}
    >
      <tbody>
        <tr>
          <td style={{ width: "64px", verticalAlign: "top", paddingTop: "2px" }}>
            <p style={{ margin: 0, fontFamily: SANS, fontSize: "11px", fontWeight: "bold", color: COLOR.muted, letterSpacing: "1.5px" }}>
              {formatDayAbbrev(first).toUpperCase()}
            </p>
            <p style={{ margin: 0, fontFamily: SERIF, fontSize: "16px", fontWeight: "bold", color: COLOR.ink }}>
              {formatDateShort(first)}
            </p>
          </td>
          <td style={{ verticalAlign: "top", fontFamily: SANS, fontSize: "13px", fontWeight: "bold" }}>
            {groupByRoom(group).map(([roomName, roomShows]) => (
              <p key={roomName} style={{ margin: "0 0 2px" }}>
                <span style={{ display: "block", padding: "2px 0 4px", fontSize: "11px", fontWeight: "normal", color: COLOR.muted, letterSpacing: "1.5px" }}>
                  {roomName.toUpperCase()}
                </span>
                {roomShows.map((show) => (
                  <TimeChip key={show.timestamp} show={show} />
                ))}
              </p>
            ))}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function SectionLabel({ title, detail }: { title: string; detail?: string }) {
  return (
    <Section
      style={{
        backgroundColor: COLOR.yellow,
        borderTop: `2px solid ${COLOR.ink}`,
        borderBottom: `2px solid ${COLOR.ink}`,
        padding: "10px 28px",
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: SERIF,
          fontSize: "15px",
          fontWeight: "bold",
          color: COLOR.ink,
          textTransform: "uppercase",
          letterSpacing: "2px",
        }}
      >
        {title}
      </Text>
      {detail ? (
        <Text
          style={{
            margin: 0,
            paddingTop: "2px",
            fontFamily: SANS,
            fontSize: "12px",
            color: COLOR.ink,
          }}
        >
          {detail}
        </Text>
      ) : null}
    </Section>
  );
}

function nightsLabel(count: number) {
  return `${count} night${count === 1 ? "" : "s"}`;
}

function CompactBody({
  featured,
  rest,
}: {
  featured: NewShowEmailItem[];
  rest: NewShowEmailItem[];
}) {
  const restGroups = groupByDate(rest);
  return (
    <>
      {featured.length ? (
        <>
          <SectionLabel title="Worth a look" />
          {featured.map((show, index) => (
            <ShowRow
              key={show.timestamp}
              show={show}
              isLast={index === featured.length - 1}
              withDate
            />
          ))}
        </>
      ) : null}
      {restGroups.length ? (
        <>
          <SectionLabel
            title={featured.length ? `Plus ${rest.length} more` : "Every show"}
            detail={`${nightsLabel(restGroups.length)} \u00b7 tap a time to reserve${
              rest.some((show) => show.soldOut) ? " \u00b7 struck-through times are sold out" : ""
            }${rest.some((show) => show.special) ? " \u00b7 \u2605 special" : ""}`}
          />
          {restGroups.map((group, index) => (
            <DayGridRow
              key={group[0].timestamp}
              group={group}
              isLast={index === restGroups.length - 1}
            />
          ))}
        </>
      ) : null}
    </>
  );
}

export function NewShowsEmail({
  shows,
  preheader,
  unsubscribeUrl,
}: {
  shows: NewShowEmailItem[];
  preheader: string;
  unsubscribeUrl?: string;
}) {
  const groups = groupByDate(shows);
  const { headline, subline } = announcementCopy(shows);
  const layout = planLayout(shows);

  return (
    <Html lang="en">
      <Head />
      <Preview>{preheader}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: COLOR.bg }}>
        <Container style={{ maxWidth: "600px", padding: "32px 16px" }}>
          {/* Masthead */}
          <Masthead tagline="Fresh off the marquee" />
          {/* Headline */}
          <Section
            style={{
              backgroundColor: COLOR.surface,
              borderLeft: `2px solid ${COLOR.ink}`,
              borderRight: `2px solid ${COLOR.ink}`,
              padding: "28px 28px 22px",
              textAlign: "center" as const,
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: SERIF,
                fontSize: "24px",
                fontWeight: "bold",
                color: COLOR.ink,
                lineHeight: "1.25",
              }}
            >
              {headline}
            </Text>
            <Text
              style={{
                margin: 0,
                paddingTop: "10px",
                fontFamily: SANS,
                fontSize: "14px",
                color: COLOR.muted,
                lineHeight: "1.5",
              }}
            >
              {subline}
            </Text>
          </Section>
          {/* Shows */}
          <Section
            style={{
              backgroundColor: COLOR.surface,
              borderLeft: `2px solid ${COLOR.ink}`,
              borderRight: `2px solid ${COLOR.ink}`,
              padding: 0,
            }}
          >
            {layout.compact ? (
              <CompactBody featured={layout.featured} rest={layout.rest} />
            ) : (
              groups.map((group) => (
                <DateGroup key={group[0].timestamp} group={group} />
              ))
            )}
          </Section>
          {/* Card footer */}
          <BrowseCalendarFooter />
          {/* Footer */}
          <EmailFooter
            reason={
              <>
                You&#39;re receiving this because new-show notifications are
                turned on for your account.
              </>
            }
            unsubscribeUrl={unsubscribeUrl}
          />
        </Container>
      </Body>
    </Html>
  );
}

function showTextBlock(show: NewShowEmailItem) {
  const meta = metaLine(show);
  return [
    `  ${formatTime(show.timestamp)} — ${show.roomName ?? "Comedy Cellar"}${show.special ? " (Special)" : ""}${show.soldOut ? " (SOLD OUT)" : ""}`,
    show.description ? `    ${show.description}` : null,
    meta ? `    ${meta}` : null,
    show.soldOut
      ? `    ${STANDBY_NOTE}`
      : `    Reserve: ${RESERVATION_URL}${show.timestamp}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// Plain-text twin of CompactBody: featured shows in full, then one line per
// room per night. Per-show links are dropped from the grid to keep it short.
function buildCompactText(featured: NewShowEmailItem[], rest: NewShowEmailItem[]) {
  const sections: string[] = [];
  if (featured.length) {
    sections.push(
      `WORTH A LOOK\n\n${featured
        .map((show) => `${formatDateHeading(show.timestamp)}\n${showTextBlock(show)}`)
        .join("\n\n")}`
    );
  }
  const restGroups = groupByDate(rest);
  if (restGroups.length) {
    const title = featured.length ? `PLUS ${rest.length} MORE` : "EVERY SHOW";
    const lines = restGroups.map((group) => {
      const rooms = groupByRoom(group).map(
        ([roomName, roomShows]) =>
          `  ${roomName}: ${roomShows
            .map(
              (show) =>
                `${formatTimeCompact(show.timestamp)}${show.special ? "*" : ""}${show.soldOut ? " (sold out)" : ""}`
            )
            .join(", ")}`
      );
      return `${formatDateHeading(group[0].timestamp)}\n${rooms.join("\n")}`;
    });
    sections.push(
      `${title} (${nightsLabel(restGroups.length)}${rest.some((show) => show.special) ? "; * = special" : ""})\n\n${lines.join("\n\n")}\n\nReserve any of these at ${SITE_URL}`
    );
  }
  return sections.join("\n\n");
}

function buildText({
  groups,
  headline,
  subline,
  dateRange,
  unsubscribeUrl,
  body,
}: {
  groups: NewShowEmailItem[][];
  // Pre-built body that replaces the per-date listing (compact layout).
  body?: string;
  headline: string;
  subline: string;
  dateRange: string;
  unsubscribeUrl?: string;
}) {
  const textGroups = body ?? groups
    .map((group) => {
      const heading = formatDateHeading(group[0].timestamp);
      return `${heading}\n${group.map(showTextBlock).join("\n\n")}`;
    })
    .join("\n\n");

  return `NEW SHOWS AT THE COMEDY CELLAR

${headline} (${dateRange}). ${subline}

${textGroups}

Browse the full calendar: ${SITE_URL}

${buildTextFooter(
  "You're receiving this because new-show notifications are turned on for your account.",
  unsubscribeUrl
)}`;
}

export async function renderNewShowsEmail({
  shows,
  unsubscribeUrl,
}: {
  shows: NewShowEmailItem[];
  unsubscribeUrl?: string;
}) {
  const sorted = [...shows].sort((a, b) => a.timestamp - b.timestamp);
  const groups = groupByDate(sorted);
  const count = sorted.length;
  const plural = count === 1 ? "" : "s";
  const { headline, subline, subjectSuffix } = announcementCopy(sorted);
  const openCount = sorted.filter((show) => !show.soldOut).length;

  const firstDate = formatDateShort(sorted[0].timestamp);
  const lastDate = formatDateShort(sorted[sorted.length - 1].timestamp);
  const dateRange =
    firstDate === lastDate ? firstDate : `${firstDate} – ${lastDate}`;

  const subject = `🎤 ${count} new Comedy Cellar show${plural} just dropped${subjectSuffix} (${dateRange})`;
  const preheader = openCount
    ? `Reservations are open for ${openCount} of ${count} new show${plural} on the calendar. The best seats go fast.`
    : `${count === 1 ? "It's" : "They're"} sold out online, but the standby line at the door still gets people in.`;

  const html = await render(
    <NewShowsEmail
      shows={sorted}
      preheader={preheader}
      unsubscribeUrl={unsubscribeUrl}
    />
  );
  const layout = planLayout(sorted);
  const text = buildText({
    groups,
    headline,
    subline,
    dateRange,
    unsubscribeUrl,
    body: layout.compact
      ? buildCompactText(layout.featured, layout.rest)
      : undefined,
  });

  return { subject, html, text };
}
