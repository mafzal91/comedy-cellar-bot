// Explicit React import keeps this file working under both the classic and
// automatic JSX transforms, whichever the bundler is configured for
import * as React from "react";

import { Link, Section, Text } from "@react-email/components";

import { COLOR, MANAGE_URL, SANS } from "./constants";

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
