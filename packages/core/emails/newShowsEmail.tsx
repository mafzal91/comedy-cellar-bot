// Explicit React import keeps this file working under both the classic and
// automatic JSX transforms, whichever the bundler is configured for
import * as React from "react";

import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
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

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Arial, Helvetica, sans-serif";

export type NewShowEmailItem = {
  timestamp: number; // unix seconds
  description: string | null;
  cover: number | null;
  note: string | null;
  special: boolean | null;
  roomName: string | null;
};

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
            {show.special ? (
              <span
                style={{
                  display: "inline-block",
                  backgroundColor: COLOR.ink,
                  color: COLOR.yellow,
                  fontFamily: SANS,
                  fontSize: "10px",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  marginLeft: "8px",
                  verticalAlign: "middle",
                }}
              >
                Special
              </span>
            ) : null}
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
        </Column>
        <Column align="right" style={{ paddingLeft: "16px", whiteSpace: "nowrap", verticalAlign: "top" }}>
          <Button
            href={`${RESERVATION_URL}${show.timestamp}`}
            style={{
              backgroundColor: COLOR.yellow,
              color: COLOR.ink,
              fontFamily: SANS,
              fontSize: "13px",
              fontWeight: "bold",
              textDecoration: "none",
              padding: "10px 18px",
              border: `2px solid ${COLOR.ink}`,
              borderRadius: "8px",
            }}
          >
            Reserve&nbsp;&rarr;
          </Button>
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
}: {
  shows: NewShowEmailItem[];
  preheader: string;
}) {
  const groups = groupByDate(shows);
  const count = shows.length;
  const plural = count === 1 ? "" : "s";

  return (
    <Html lang="en">
      <Head />
      <Preview>{preheader}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: COLOR.bg }}>
        <Container style={{ maxWidth: "600px", padding: "32px 16px" }}>
          {/* Masthead */}
          <Section
            style={{
              backgroundColor: COLOR.ink,
              border: `2px solid ${COLOR.ink}`,
              borderRadius: "14px 14px 0 0",
              padding: "28px 28px 24px",
              textAlign: "center" as const,
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: SERIF,
                fontSize: "12px",
                color: COLOR.yellow,
                letterSpacing: "6px",
              }}
            >
              &#9733;&nbsp;&#9733;&nbsp;&#9733;
            </Text>
            <Text
              style={{
                margin: 0,
                paddingTop: "8px",
                fontFamily: SERIF,
                fontSize: "26px",
                fontWeight: "bold",
                color: COLOR.yellow,
                letterSpacing: "3px",
              }}
            >
              COMEDY CELLAR CALENDAR
            </Text>
            <Text
              style={{
                margin: 0,
                paddingTop: "6px",
                fontFamily: SANS,
                fontSize: "11px",
                color: "#A99F90",
                textTransform: "uppercase",
                letterSpacing: "3px",
              }}
            >
              Fresh off the marquee
            </Text>
          </Section>
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
              {count} new show{plural} just hit the calendar
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
              Reservations are open now &mdash; the best tables go fast.
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
          <Section
            style={{
              backgroundColor: COLOR.surface,
              border: `2px solid ${COLOR.ink}`,
              borderTop: 0,
              borderRadius: "0 0 14px 14px",
              padding: "24px 28px",
              textAlign: "center" as const,
            }}
          >
            <Button
              href={SITE_URL}
              style={{
                backgroundColor: COLOR.ink,
                color: COLOR.yellow,
                fontFamily: SANS,
                fontSize: "14px",
                fontWeight: "bold",
                textDecoration: "none",
                padding: "12px 24px",
                borderRadius: "8px",
              }}
            >
              Browse the full calendar
            </Button>
          </Section>
          {/* Footer */}
          <Section style={{ padding: "24px 28px", textAlign: "center" as const }}>
            <Text
              style={{
                margin: 0,
                fontFamily: SANS,
                fontSize: "12px",
                color: COLOR.faint,
                lineHeight: "1.6",
              }}
            >
              You&#39;re receiving this because new-show notifications are
              turned on for your account.
              <br />
              <Link
                href={MANAGE_URL}
                style={{ color: COLOR.muted, textDecoration: "underline" }}
              >
                Manage notification settings
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function buildText({
  groups,
  count,
  plural,
  dateRange,
}: {
  groups: NewShowEmailItem[][];
  count: number;
  plural: string;
  dateRange: string;
}) {
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

  return `NEW SHOWS AT THE COMEDY CELLAR

${count} new show${plural} just hit the calendar (${dateRange}). Reservations are open now.

${textGroups}

Browse the full calendar: ${SITE_URL}

---
You're receiving this because new-show notifications are turned on for your account.
Manage notification settings: ${MANAGE_URL}`;
}

export async function renderNewShowsEmail({
  shows,
}: {
  shows: NewShowEmailItem[];
}) {
  const sorted = [...shows].sort((a, b) => a.timestamp - b.timestamp);
  const groups = groupByDate(sorted);
  const count = sorted.length;
  const plural = count === 1 ? "" : "s";

  const firstDate = formatDateShort(sorted[0].timestamp);
  const lastDate = formatDateShort(sorted[sorted.length - 1].timestamp);
  const dateRange =
    firstDate === lastDate ? firstDate : `${firstDate} – ${lastDate}`;

  const subject = `🎤 ${count} new Comedy Cellar show${plural} just dropped (${dateRange})`;
  const preheader = `Reservations are open for ${count} new show${plural} on the calendar. The best seats go fast.`;

  const html = await render(
    <NewShowsEmail shows={sorted} preheader={preheader} />
  );
  const text = buildText({ groups, count, plural, dateRange });

  return { subject, html, text };
}
