#!/usr/bin/env bash
# token-age.sh — gauge the age of the hardcoded x-code-localize anti-bot token
# in packages/core/requester.ts WITHOUT printing the token (or the IP baked
# into its base64 tail). Prints capture date + age, and flags the >12-month
# standing order from cellar-scraper-recovery-campaign.
#
# Usage: ./token-age.sh        (needs GNU date; on macOS use `date -u -r "$TS"`)
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../../../.." && pwd)"

# The token is `<64-hex>.<base64 of "unixTs-IPv4">` (see cellar-scraping-reference §4.2).
# Extract only the unix timestamp from the decoded tail; never echo the token itself.
TS="$(awk -F'"' '/[a-f0-9]{64}\./ {print $2}' "$REPO/packages/core/requester.ts" \
  | cut -d. -f2 | base64 -d | cut -d- -f1)"

if ! [[ "$TS" =~ ^[0-9]{10}$ ]]; then
  echo "Could not extract a unix timestamp from requester.ts token — token format may have changed." >&2
  exit 1
fi

NOW="$(date +%s)"
AGE_DAYS=$(((NOW - TS) / 86400))
echo "x-code-localize captured: $(date -u -d "@$TS" +%F) (unix $TS)"
echo "age: ${AGE_DAYS} days (~$((AGE_DAYS / 30)) months)"

if [ "$AGE_DAYS" -gt 365 ]; then
  echo "STANDING ORDER TRIGGERED: token is older than 12 months."
  echo "Raise preventive recapture with the owner (Phase 2A of cellar-scraper-recovery-campaign)."
fi
