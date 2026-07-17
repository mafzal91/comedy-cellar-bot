// Explicit React import keeps this file working under both the classic and
// automatic JSX transforms, whichever the bundler is configured for
import * as React from "react";

import { Button, Link, Section, Text } from "@react-email/components";
import { formatInTimeZone } from "date-fns-tz";

// Shared building blocks for the react-email templates in this directory.
// Pure module: no db/sst imports, so it can be rendered and previewed
// offline just like the templates that use it.

export const TIME_ZONE = "America/New_York";
export const SITE_URL = "https://comedycellar.mafz.al";
export const RESERVATION_URL = `${SITE_URL}/reservations/`;
export const MANAGE_URL = `${SITE_URL}/profile`;

// Brand tokens borrowed from packages/frontend/src/theme.css
export const COLOR = {
  bg: "#FBF6EC",
  surface: "#FFFFFF",
  ink: "#1A1714",
  muted: "#857B6D",
  faint: "#A99F8E",
  track: "#EDE7DA",
  yellow: "#F3C44C",
};

export const SERIF = "Georgia, 'Times New Roman', serif";
export const SANS = "Arial, Helvetica, sans-serif";

export function formatTime(timestamp: number) {
  return formatInTimeZone(timestamp * 1000, TIME_ZONE, "h:mm a");
}

export function formatDateHeading(timestamp: number) {
  return formatInTimeZone(timestamp * 1000, TIME_ZONE, "EEEE, MMMM d");
}

export function formatDateShort(timestamp: number) {
  return formatInTimeZone(timestamp * 1000, TIME_ZONE, "MMM d");
}

export function SpecialBadge() {
  return (
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
  );
}

export function ReserveButton({ timestamp }: { timestamp: number }) {
  return (
    <Button
      href={`${RESERVATION_URL}${timestamp}`}
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
  );
}

export function Masthead({ tagline }: { tagline: string }) {
  return (
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
        {tagline}
      </Text>
    </Section>
  );
}

export function BrowseCalendarFooter() {
  return (
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
  );
}

export function EmailFooter({ reason }: { reason: React.ReactNode }) {
  return (
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
        {reason}
        <br />
        <Link
          href={MANAGE_URL}
          style={{ color: COLOR.muted, textDecoration: "underline" }}
        >
          Manage notification settings
        </Link>
      </Text>
    </Section>
  );
}

export function buildTextFooter(reason: string) {
  return `---
${reason}
Manage notification settings: ${MANAGE_URL}`;
}
