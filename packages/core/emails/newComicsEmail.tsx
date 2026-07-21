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
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";

// Pure template module: takes plain data in, returns subject/html/text.
// Keep it free of db/sst imports so it can be rendered and previewed offline.

import { BrowseCalendarFooter } from "./shared/BrowseCalendarFooter";
import { buildTextFooter } from "./shared/buildTextFooter";
import { COLOR, SANS, SERIF, SITE_URL } from "./shared/constants";
import { EmailFooter } from "./shared/EmailFooter";
import { Masthead } from "./shared/Masthead";

export type NewComicEmailItem = {
  name: string;
  img: string | null;
  website: string | null;
  description: string | null;
};

function isHttpUrl(value: string | null): value is string {
  return !!value && /^https?:\/\//i.test(value);
}

function ComicRow({
  comic,
  isLast,
}: {
  comic: NewComicEmailItem;
  isLast: boolean;
}) {
  return (
    <Section
      style={{
        padding: "18px 28px",
        borderBottom: isLast ? undefined : `1px dashed ${COLOR.track}`,
      }}
    >
      <Row>
        {isHttpUrl(comic.img) ? (
          <Column
            style={{
              width: "64px",
              paddingRight: "16px",
              verticalAlign: "top",
            }}
          >
            <Img
              src={comic.img}
              width="64"
              height="64"
              alt={comic.name}
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "8px",
                objectFit: "cover",
                border: `1px solid ${COLOR.track}`,
              }}
            />
          </Column>
        ) : null}
        <Column style={{ verticalAlign: "top" }}>
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
            {comic.name}
          </Text>
          {comic.description ? (
            <Text
              style={{
                margin: 0,
                paddingTop: "6px",
                fontFamily: SANS,
                fontSize: "14px",
                color: COLOR.ink,
              }}
            >
              {comic.description}
            </Text>
          ) : null}
          {isHttpUrl(comic.website) ? (
            <Text
              style={{
                margin: 0,
                paddingTop: "6px",
                fontFamily: SANS,
                fontSize: "12px",
              }}
            >
              <Link
                href={comic.website}
                style={{ color: COLOR.muted, textDecoration: "underline" }}
              >
                Visit website
              </Link>
            </Text>
          ) : null}
        </Column>
      </Row>
    </Section>
  );
}

export function NewComicsEmail({
  comics,
  preheader,
}: {
  comics: NewComicEmailItem[];
  preheader: string;
}) {
  const count = comics.length;
  const plural = count === 1 ? "" : "s";

  return (
    <Html lang="en">
      <Head />
      <Preview>{preheader}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: COLOR.bg }}>
        <Container style={{ maxWidth: "600px", padding: "32px 16px" }}>
          {/* Masthead */}
          <Masthead tagline="Fresh faces on the mic" />
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
              {count} new comic{plural} on the scene
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
              Just added to the Comedy Cellar lineup for the first time.
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
            {comics.map((comic, index) => (
              <ComicRow
                key={`${comic.name}-${index}`}
                comic={comic}
                isLast={index === comics.length - 1}
              />
            ))}
          </Section>
          {/* Card footer */}
          <BrowseCalendarFooter />
          {/* Footer */}
          <EmailFooter
            reason={
              <>
                You&#39;re receiving this because new-comic notifications are
                turned on for your account.
              </>
            }
          />
        </Container>
      </Body>
    </Html>
  );
}

function buildText({ comics }: { comics: NewComicEmailItem[] }) {
  const count = comics.length;
  const plural = count === 1 ? "" : "s";

  const lines = comics
    .map((comic) =>
      [
        `  • ${comic.name}`,
        comic.description ? `    ${comic.description}` : null,
        isHttpUrl(comic.website) ? `    ${comic.website}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n");

  return `NEW COMICS AT THE COMEDY CELLAR

${count} new comic${plural} just joined the lineup for the first time.

${lines}

Browse the full calendar: ${SITE_URL}

${buildTextFooter(
  "You're receiving this because new-comic notifications are turned on for your account."
)}`;
}

export async function renderNewComicsEmail({
  comics,
}: {
  comics: NewComicEmailItem[];
}) {
  const count = comics.length;
  const plural = count === 1 ? "" : "s";

  const subject = `🎤 ${count} new comic${plural} on the Comedy Cellar scene`;
  const preheader = `${count} comic${plural} just joined the lineup for the first time.`;

  const html = await render(
    <NewComicsEmail comics={comics} preheader={preheader} />
  );
  const text = buildText({ comics });

  return { subject, html, text };
}
