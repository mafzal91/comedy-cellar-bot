// Explicit React import keeps this file working under both the classic and
// automatic JSX transforms, whichever the bundler is configured for
import * as React from "react";

import { COLOR, SANS } from "./constants";

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
