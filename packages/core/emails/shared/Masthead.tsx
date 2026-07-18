// Explicit React import keeps this file working under both the classic and
// automatic JSX transforms, whichever the bundler is configured for
import * as React from "react";

import { Section, Text } from "@react-email/components";

import { COLOR, SANS, SERIF } from "./constants";

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
