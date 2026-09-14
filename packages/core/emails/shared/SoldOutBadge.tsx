// Explicit React import keeps this file working under both the classic and
// automatic JSX transforms, whichever the bundler is configured for
import * as React from "react";

import { COLOR, SANS } from "./constants";

// Stands in for the Reserve button on a show nobody can book. Deliberately
// flat (no border, no link affordance) so it never reads as a CTA.
export function SoldOutBadge() {
  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: COLOR.track,
        color: COLOR.muted,
        fontFamily: SANS,
        fontSize: "13px",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "1px",
        padding: "10px 18px",
        border: `2px solid ${COLOR.track}`,
        borderRadius: "8px",
      }}
    >
      Sold out
    </span>
  );
}
