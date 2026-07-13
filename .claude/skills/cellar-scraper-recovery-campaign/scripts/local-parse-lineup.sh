#!/usr/bin/env bash
# local-parse-lineup.sh — run the repo's REAL parser (packages/core/parseLineUp.ts)
# against a saved comedycellar.com lineup response, with zero network access.
#
# Usage:
#   ./local-parse-lineup.sh <file>
#
# <file> may be either:
#   - the raw JSON body of POST /lineup/api/ (the script extracts .show.html), or
#   - a bare HTML fragment (the stuff inside .show.html).
#
# Output: parsed shows as JSON on stdout; a one-line summary on stderr:
#   shows=N acts=N named-acts=N with-timestamp=N
#
# Requires: node + the repo's root node_modules (pnpm install at repo root).
# Bundles the parser with the repo-local esbuild so tsconfig path aliases resolve.
set -euo pipefail

if [ $# -ne 1 ] || [ ! -f "$1" ]; then
  echo "usage: $0 <lineup-response.json | fragment.html>" >&2
  exit 2
fi

REPO="$(cd "$(dirname "$0")/../../../.." && pwd)"
FRAG_ABS="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

"$REPO/node_modules/.bin/esbuild" --bundle --platform=node --format=esm \
  --log-level=warning \
  --outfile="$OUT/parseLineUp.mjs" \
  "$REPO/packages/core/parseLineUp.ts" \
  "--tsconfig=$REPO/tsconfig.json"

BUNDLE="$OUT/parseLineUp.mjs" FRAG="$FRAG_ABS" node -e '
const { readFileSync } = require("fs");
import(process.env.BUNDLE).then((m) => {
  const raw = readFileSync(process.env.FRAG, "utf8");
  let html = raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.show && typeof parsed.show.html === "string") {
      html = parsed.show.html; // full /lineup/api/ JSON body
    }
  } catch (_) {
    /* not JSON: treat as bare HTML fragment */
  }
  const shows = m.parseLineUp({ html });
  console.log(JSON.stringify(shows, null, 2));
  const acts = shows.flatMap((s) => s.acts);
  console.error(
    `shows=${shows.length} acts=${acts.length} ` +
      `named-acts=${acts.filter((a) => a.name).length} ` +
      `with-timestamp=${shows.filter((s) => s.timestamp).length}`
  );
});
'
