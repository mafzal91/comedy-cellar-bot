// Explicit React import keeps this file working under both the classic and
// automatic JSX transforms, whichever the bundler is configured for
import * as React from "react";

import { Button, Section } from "@react-email/components";

import { COLOR, SANS, SITE_URL } from "./constants";

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
