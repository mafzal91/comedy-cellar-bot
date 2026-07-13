#!/usr/bin/env bash
# check-api.sh — polite, READ-ONLY probe of OUR OWN prod API.
#
# Hits only free, side-effect-free GET endpoints on our API Gateway. It NEVER
# touches comedycellar.com and NEVER touches the two dangerous/expensive routes:
#   - POST /api/reservation/{ts}  books a REAL seat at the real club when the
#     prod Lambda runs (STAGE=prod) — see cellar-scraping-reference.
#   - GET  /sync-shows            forces a live scrape of comedycellar.com plus
#     DB writes; public + unauthenticated in every stage — costs a scrape.
# Prefer probing THIS API: it is free and safe. A source probe would be a hit
# on comedycellar.com; keep those single and polite (see the SKILL body).
#
# What each line means: cellar-run-and-operate. What to DO when one goes red:
# cellar-scraper-recovery-campaign.
#
# Usage:
#   ./check-api.sh                       # prod default: https://comedycellar-api.mafz.al
#   ./check-api.sh https://other-base    # override base URL via $1
#   CC_API_BASE=https://other-base ./check-api.sh
#
# Exit: 0 = all three checks green; 1 = at least one red/unreachable; >1 = tooling.
#
# NETWORK: makes live HTTPS GETs. Syntax-verified in the skill sandbox
# (bash -n clean); the sandbox blocks outbound network, so RUN THIS FROM AN
# UNRESTRICTED MACHINE.
set -euo pipefail

BASE="${1:-${CC_API_BASE:-https://comedycellar-api.mafz.al}}"
BASE="${BASE%/}"          # strip any trailing slash
MAX_TIME=10               # per-request seconds

command -v jq   >/dev/null || { echo "need jq (brew install jq / apt-get install jq)" >&2; exit 3; }
command -v curl >/dev/null || { echo "need curl" >&2; exit 3; }

# GNU `date -d @TS` vs BSD/macOS `date -r TS`.
fmt_day() { date -u -d "@$1" +%F 2>/dev/null || date -u -r "$1" +%F; }

rc=0
echo "probing $BASE"

# 1) liveness — GET /api/health -> {"message":"ok","timestamp":<ms>}
if body="$(curl -fsS --max-time "$MAX_TIME" "$BASE/api/health")"; then
  echo "health:    OK ($(printf '%s' "$body" | jq -r '.message // "?"'))"
else
  echo "health:    UNREACHABLE ($BASE/api/health)"
  rc=1
fi

# 2) scrape freshness — newest PERSISTED show timestamp (unix SECONDS).
#    /api/shows/new is DB-backed (no scrape) and only surfaces shows that have
#    at least one act, so a fresh future value proves BOTH the show-inventory
#    scrape AND the lineup scrape are landing (see cellar-data-model).
if body="$(curl -fsS --max-time "$MAX_TIME" "$BASE/api/shows/new?limit=1&sort=-timestamp")"; then
  ts="$(printf '%s' "$body" | jq -r '.results[0].timestamp // empty')"
  total="$(printf '%s' "$body" | jq -r '.total // 0')"
  if [ -z "$ts" ]; then
    echo "freshness: EMPTY no shows persisted (total act-rows=$total) <-- ALARM"
    rc=1
  else
    now="$(date +%s)"; when="$(fmt_day "$ts")"
    if [ "$ts" -ge "$now" ]; then
      echo "freshness: OK newest show $when (~+$(( (ts - now) / 86400 ))d ahead)"
    else
      echo "freshness: STALE newest show $when (~$(( (now - ts) / 86400 ))d in the PAST) <-- ALARM"
      rc=1
    fi
  fi
else
  echo "freshness: UNREACHABLE ($BASE/api/shows/new)"
  rc=1
fi

# 3) comic catalog size — total from the {results,offset,limit,total} envelope.
if body="$(curl -fsS --max-time "$MAX_TIME" "$BASE/api/comics?limit=1")"; then
  total="$(printf '%s' "$body" | jq -r '.total // 0')"
  if [ "$total" -gt 0 ]; then
    echo "comics:    OK total=$total"
  else
    echo "comics:    EMPTY total=0 <-- ALARM"
    rc=1
  fi
else
  echo "comics:    UNREACHABLE ($BASE/api/comics)"
  rc=1
fi

exit "$rc"
