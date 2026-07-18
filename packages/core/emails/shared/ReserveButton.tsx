// Explicit React import keeps this file working under both the classic and
// automatic JSX transforms, whichever the bundler is configured for
import * as React from "react";

import { Button } from "@react-email/components";

import { COLOR, RESERVATION_URL, SANS } from "./constants";

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
