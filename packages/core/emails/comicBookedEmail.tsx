// Explicit React import keeps this file working under both the classic and
// automatic JSX transforms, whichever the bundler is configured for
import * as React from "react";

import {
  Body,
  Column,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";

// Pure template module: takes plain data in, returns subject/html/text.
// Keep it free of db/sst imports so it can be rendered and previewed offline.

import {
  BrowseCalendarFooter,
  COLOR,
  EmailFooter,
  Masthead,
  RESERVATION_URL,
  ReserveButton,
  SANS,
  SERIF,
  SITE_URL,
  SpecialBadge,
  buildTextFooter,
  formatDateHeading,
  formatTime,
} from "./shared";

export type ComicBookedEmailItem = {
  comicName: string;
  comicImg: string | null;
  timestamp: number; // unix seconds
  description: string | null;
  cover: number | null;
  note: string | null;
  special: boolean | null;
  roomName: string | null;
  available: number; // seats remaining (max - totalGuests) as of send time
};

function metaLine(item: ComicBookedEmailItem) {
  const parts: string[] = [];
  if (item.cover) parts.push(`$${item.cover} cover`);
  if (item.note) parts.push(item.note);
  parts.push(
    item.available === 1 ? "1 seat left" : `${item.available} seats left`
  );
  return parts.join(" · ");
}

function groupByComic(items: ComicBookedEmailItem[]) {
  const groups = new Map<string, ComicBookedEmailItem[]>();
  for (const item of items) {
    const group = groups.get(item.comicName) ?? [];
    group.push(item);
    groups.set(item.comicName, group);
  }
  return Array.from(groups.values()).sort(
    (a, b) => a[0].timestamp - b[0].timestamp
  );
}

function ShowRow({
  item,
  isLast,
}: {
  item: ComicBookedEmailItem;
  isLast: boolean;
}) {
  const meta = metaLine(item);

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
            {formatDateHeading(item.timestamp)} &middot; {formatTime(item.timestamp)}
            {item.special ? <SpecialBadge /> : null}
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
            {item.roomName ?? "Comedy Cellar"}
          </Text>
          {item.description ? (
            <Text
              style={{
                margin: 0,
                paddingTop: "6px",
                fontFamily: SANS,
                fontSize: "14px",
                color: COLOR.ink,
              }}
            >
              {item.description}
            </Text>
          ) : null}
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
        </Column>
        <Column
          align="right"
          style={{ paddingLeft: "16px", whiteSpace: "nowrap", verticalAlign: "top" }}
        >
          <ReserveButton timestamp={item.timestamp} />
        </Column>
      </Row>
    </Section>
  );
}

function ComicGroup({ group }: { group: ComicBookedEmailItem[] }) {
  const { comicName, comicImg } = group[0];

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
        <Row>
          {comicImg ? (
            <Column style={{ width: "36px", paddingRight: "10px" }}>
              <Img
                src={comicImg}
                width="28"
                height="28"
                alt=""
                style={{ borderRadius: "50%", border: `2px solid ${COLOR.ink}` }}
              />
            </Column>
          ) : null}
          <Column>
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
              {comicName}
            </Text>
          </Column>
        </Row>
      </Section>
      {group.map((item, index) => (
        <ShowRow key={item.timestamp} item={item} isLast={index === group.length - 1} />
      ))}
    </>
  );
}

export function ComicBookedEmail({
  items,
  preheader,
}: {
  items: ComicBookedEmailItem[];
  preheader: string;
}) {
  const groups = groupByComic(items);
  const comicCount = groups.length;
  const plural = comicCount === 1 ? "" : "s";

  return (
    <Html lang="en">
      <Head />
      <Preview>{preheader}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: COLOR.bg }}>
        <Container style={{ maxWidth: "600px", padding: "32px 16px" }}>
          {/* Masthead */}
          <Masthead tagline="Booked and open for reservations" />
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
              {comicCount} comedian{plural} you follow just got booked
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
              Seats are open now &mdash; the best tables go fast.
            </Text>
          </Section>
          {/* Comics */}
          <Section
            style={{
              backgroundColor: COLOR.surface,
              borderLeft: `2px solid ${COLOR.ink}`,
              borderRight: `2px solid ${COLOR.ink}`,
              padding: 0,
            }}
          >
            {groups.map((group) => (
              <ComicGroup key={group[0].comicName} group={group} />
            ))}
          </Section>
          {/* Card footer */}
          <BrowseCalendarFooter />
          {/* Footer */}
          <EmailFooter
            reason={
              <>
                You&#39;re receiving this because you follow one or more of
                these comedians.
              </>
            }
          />
        </Container>
      </Body>
    </Html>
  );
}

function buildText({
  groups,
  comicCount,
  plural,
}: {
  groups: ComicBookedEmailItem[][];
  comicCount: number;
  plural: string;
}) {
  const textGroups = groups
    .map((group) => {
      const lines = group.map((item) => {
        const meta = metaLine(item);
        return [
          `  ${formatDateHeading(item.timestamp)} · ${formatTime(item.timestamp)} — ${item.roomName ?? "Comedy Cellar"}${item.special ? " (Special)" : ""}`,
          item.description ? `    ${item.description}` : null,
          `    ${meta}`,
          `    Reserve: ${RESERVATION_URL}${item.timestamp}`,
        ]
          .filter(Boolean)
          .join("\n");
      });
      return `${group[0].comicName}\n${lines.join("\n\n")}`;
    })
    .join("\n\n");

  return `COMEDIANS YOU FOLLOW JUST GOT BOOKED

${comicCount} comedian${plural} you follow just got booked. Seats are open now.

${textGroups}

Browse the full calendar: ${SITE_URL}

${buildTextFooter(
  "You're receiving this because you follow one or more of these comedians."
)}`;
}

export async function renderComicBookedEmail({
  items,
}: {
  items: ComicBookedEmailItem[];
}) {
  const sorted = [...items].sort((a, b) => a.timestamp - b.timestamp);
  const groups = groupByComic(sorted);
  const comicCount = groups.length;
  const plural = comicCount === 1 ? "" : "s";

  const comicNames = groups.map((group) => group[0].comicName);
  const namesPreview =
    comicNames.length <= 2
      ? comicNames.join(" & ")
      : `${comicNames.slice(0, 2).join(", ")} & ${comicNames.length - 2} more`;

  const subject = `🎤 ${namesPreview} just got booked at Comedy Cellar`;
  const preheader = `${comicCount} comedian${plural} you follow ${
    comicCount === 1 ? "is" : "are"
  } booked and open for reservations.`;

  const html = await render(
    <ComicBookedEmail items={sorted} preheader={preheader} />
  );
  const text = buildText({ groups, comicCount, plural });

  return { subject, html, text };
}
