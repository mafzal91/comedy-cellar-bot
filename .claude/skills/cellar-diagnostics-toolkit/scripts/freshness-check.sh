#!/usr/bin/env bash
# freshness-check.sh — scraper-health CANARY for cron/CI.
#
# Fetches the newest PERSISTED show timestamp from OUR API and exits NONZERO if
# that show is older than a threshold (default 7 days in the PAST). One check,
# one dependency (jq), safe to run on a schedule.
#
# Why this works: shows are announced AHEAD of time, and newShowCron walks the
# horizon every 6h (infra/cron.ts), so the newest persisted show normally sits
# DAYS-TO-WEEKS in the FUTURE. If it slips into the past — or the API returns
# none — the scraper has stopped landing new data. What to DO: escalate via
# cellar-scraper-recovery-campaign.
#
# Usage:
#   ./freshness-check.sh                          # prod, 7-day threshold
#   ./freshness-check.sh https://api-base         # override base URL ($1)
#   ./freshness-check.sh https://api-base 3       # ...and threshold in days ($2)
#   CC_API_BASE=... CC_FRESH_DAYS=3 ./freshness-check.sh
#
# Exit: 0 = fresh; 1 = stale / empty / unreachable (the alarm); >1 = tooling.
#
# NETWORK: makes one live HTTPS GET. Syntax-verified in the skill sandbox
# (bash -n clean); RUN FROM AN UNRESTRICTED MACHINE (sandbox blocks network).
set -euo pipefail

BASE="${1:-${CC_API_BASE:-https://comedycellar-api.mafz.al}}"
BASE="${BASE%/}"
THRESHOLD_DAYS="${2:-${CC_FRESH_DAYS:-7}}"
MAX_TIME=10

command -v jq >/dev/null || { echo "need jq (brew install jq / apt-get install jq)" >&2; exit 3; }

body="$(curl -fsS --max-time "$MAX_TIME" "$BASE/api/shows/new?limit=1&sort=-timestamp")" || {
  echo "FAIL: API unreachable ($BASE/api/shows/new)" >&2
  exit 1
}

ts="$(printf '%s' "$body" | jq -r '.results[0].timestamp // empty')"
if [ -z "$ts" ]; then
  echo "FAIL: no shows persisted (empty results)" >&2
  exit 1
fi

now="$(date +%s)"
when="$(date -u -d "@$ts" +%F 2>/dev/null || date -u -r "$ts" +%F)"
# newest-vs-now, in days: positive = show is in the PAST; negative = ahead of now.
age_days=$(( (now - ts) / 86400 ))

if [ "$age_days" -gt "$THRESHOLD_DAYS" ]; then
  echo "STALE: newest show $when is ${age_days}d in the past (> ${THRESHOLD_DAYS}d threshold)"
  exit 1
fi

echo "FRESH: newest show $when (newest-vs-now=${age_days}d; negative = ahead; threshold ${THRESHOLD_DAYS}d)"
exit 0
