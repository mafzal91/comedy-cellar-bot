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
import { formatDateHeading, formatDateShort, formatTime } from "./shared/format";
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

function ShowRow({ show, isLast }: { show: NewShowEmailItem; isLast: boolean }) {
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
            {groups.map((group) => (
              <DateGroup key={group[0].timestamp} group={group} />
            ))}
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

function buildText({
  groups,
  headline,
  subline,
  dateRange,
  unsubscribeUrl,
}: {
  groups: NewShowEmailItem[][];
  headline: string;
  subline: string;
  dateRange: string;
  unsubscribeUrl?: string;
}) {
  const textGroups = groups
    .map((group) => {
      const heading = formatDateHeading(group[0].timestamp);
      const lines = group.map((show) => {
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
      });
      return `${heading}\n${lines.join("\n\n")}`;
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
  const text = buildText({ groups, headline, subline, dateRange, unsubscribeUrl });

  return { subject, html, text };
}
