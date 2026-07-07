---
name: cellar-scraper-recovery-campaign
description: >-
  Decision-gated recovery runbook for a live scraper outage: show data in comedy-cellar-bot has
  gone stale, crons are erroring, comedycellar.com returns 403/challenge/garbage, or the site's
  HTML/JSON changed shape. Use when "the scraper broke", when "Sync Show Cron" failure emails
  arrive, when the freshness probes show no new shows landing, or when planning/executing an
  x-code-localize token recapture. Contains numbered phases with exact commands, expected
  observations, branch playbooks (token recapture, HTML drift, JSON drift, hard blocking),
  fenced wrong paths, and a numeric definition of "recovered".
---

# cellar-scraper-recovery-campaign

**Why this campaign exists.** In September 2024, comedycellar.com deployed a header-based
anti-bot check while this project was dormant. The scraper broke silently and the project was
dark for ~5 months (2024-04-13 → 2024-09-13), until commit `122ccf5` "fixed request headers"
added a captured browser token — the `x-code-localize` header hardcoded at
`packages/core/requester.ts:12-13` — and revived it. (SHA recovered from GitHub history; it
predates the local shallow clone, so `git show 122ccf5` fails here. The token itself is local,
checkable evidence: its base64 tail decodes to a Unix timestamp of 2024-09-13.) That token is
still load-bearing today and is ~22 months old (as of 2026-07-07). The next outage is a
question of *when*, not *if*. This skill is the campaign you run when it happens.

**When NOT to use this skill:** for endpoint/parse contracts, token anatomy, and anti-bot
history → **cellar-scraping-reference**. For general symptom triage not scraper-shaped
(frontend blank, auth failures, CI) → **cellar-debugging-playbook**. For cron/log/deploy
mechanics → **cellar-run-and-operate**. For "who approves this change" → **cellar-change-control**.

**Definitions** (first use): *the scraper* = the Lambda code in `packages/core/` that fetches
comedycellar.com (`fetchShows.ts`, `fetchLineUp.ts`, `parseLineUp.ts`, via the shared axios
client `requester.ts`). *SST* = the infra-as-code framework; a *stage* is a named deployment
(`prod` = live; a personal dev stage deploys the same resources under your name). *Cron* = a
scheduled Lambda (`infra/cron.ts`). *The token* = the hardcoded `x-code-localize` header value
(a captured anti-bot credential — never copy it anywhere except `requester.ts`). *Fixture* = a
captured real response stored in the repo. *Admin email telemetry* = the project's only
alerting: the crons email the owner's own Gmail (`core/email.ts:23` sends to-self).

## Campaign ground rules (hold for every phase)

| Rule | Why / evidence |
|---|---|
| Single polite requests only. Never loop, never parallel. ≥5s between probes, a handful per day. | Rapid repeats are what anti-bot checks detect; this failure class already cost 5 months. Pacing in code: `sleep(5000)` newShowCron.ts:62, `sleep(7500)` syncCron.ts:88, one date per sync run syncCron.ts:68. |
| Direct probes to comedycellar.com must come from a residential-ish network (home/hotspot), NOT this sandbox (proxy blocks external hosts) and not an obvious datacenter egress. | You are testing whether the site accepts an ordinary visitor; probing from a blocked/datacenter IP contaminates the experiment. |
| Never touch `POST /reservations/api/addReservation` in any experiment. It books REAL seats. | `createReservation.ts:10-17` gates it to `STAGE === "prod"`; dev returns the fixture `packages/__fixtures__/createReservation.ts`. Absolute rule (cellar-change-control §2a). |
| Every behavior-changing fix ships as class **scraping-behavior** through **cellar-change-control** (owner sign-off). Prod deploy is owner-only. | cellar-change-control §1, §2d. |
| Never write the token (or its decoded tail) into commits, PRs, logs, or skills. | It is a credential with the capturer's IP embedded. |

## Campaign map

```
PHASE 0  Confirm & scope (our prod API, any machine)
   ├─ our API down ................→ ops problem → cellar-run-and-operate / debugging-playbook
   ├─ DB entirely empty ...........→ bootstrap   → cellar-data-model
   ├─ data healthy ................→ not a scraper outage; re-triage symptom
   └─ data stale / today empty ....→ PHASE 1
PHASE 1  Classify (direct polite probes to comedycellar.com, residential network)
   ├─ 200 + valid JSON both endpoints → parser/DB side → 2B or 2C (or debugging-playbook)
   ├─ 200 + ".no-shows" on a show day → soft rejection → 2A (token)
   ├─ JSON shape changed              → 2C
   ├─ HTML classes changed            → 2B
   ├─ 403/429/challenge               → 2D (STOP gate)
   └─ timeout/DNS                     → site down or moved → check in browser, then 2D or wait
PHASE 2  Branch playbooks A–D (each ends at change control)
PHASE 3  Validate on dev stage → promote via change control → watch 24h → declare recovered
```

---

## PHASE 0 — Confirm and scope (from any machine)

The prod API is `https://comedycellar-api.mafz.al` (infra/api.ts:8, as of 2026-07-07).
These probes hit OUR infrastructure only — safe to run from anywhere, any number of times.
(cellar-diagnostics-toolkit carries the fuller probe kit and interpretation guides; the
minimum campaign gates are inlined here so this runbook is standalone.)

```bash
API=https://comedycellar-api.mafz.al

# 0.1 — Is our API alive?
curl -sS -m 15 "$API/api/health"
# EXPECTED: {"message":"ok","timestamp":<ms>}            (functions/health.ts:7)

# 0.2 — Freshness: newest act-bearing show in the DB
NEWEST=$(curl -sS "$API/api/shows/new?sort=-timestamp&limit=1" | jq '.results[0].timestamp')
echo "newest: $(date -u -d @"$NEWEST" +%F)  days ahead: $(( (NEWEST - $(date +%s)) / 86400 ))"

# 0.3 — Today's shows in the DB (NY day; API date filters take MILLISECONDS,
#        common/schema.ts:3-20; -g lets curl pass literal brackets)
START=$(( $(TZ=America/New_York date -d 'today 00:00' +%s) * 1000 ))
END=$((   $(TZ=America/New_York date -d 'today 23:59:59' +%s) * 1000 ))
curl -sSg "$API/api/shows/new?date[start]=$START&date[end]=$END&limit=100" \
  | jq '[.results[].id] | unique | length'
```

**Expected-healthy numbers** (estimates, as of 2026-07-07 — the club publishes rolling weeks
ahead and runs shows nightly; the "~12 shows across 3 rooms" figure comes from the design copy
at plan/README.md:65, not a measured contract):

| Probe | Healthy | Outage smell |
|---|---|---|
| 0.1 health | `{"message":"ok",...}` | timeout/5xx → **ops, not scraping** → cellar-run-and-operate |
| 0.2 days-ahead | roughly 2–6 weeks, stable day over day | shrinking toward 0 day-by-day = newShowCron has stopped landing new shows |
| 0.3 today-count | > 0 on most nights, ~12 typical | 0 on a night the site clearly lists shows |

**Interpretation traps** (both from `getShows`'s inner joins, models/show.ts:207-216):
`/api/shows/new` (a) repeats each show once per comic — hence the `unique` dedupe — and
(b) cannot see shows whose lineup never scraped (no `act` rows). So 0.3 = 0 can mean "show
details landed but lineups didn't"; discriminate in Phase 1 by probing both CC endpoints.

**Check the built-in alarm — admin email.** The owner's inbox is the only alerting:

| Subject | Sent when | Meaning during triage |
|---|---|---|
| `Sync Show Cron` | hourly sync FAILED after retries (syncCron.ts:90-97) | loud failure — the scraper is throwing |
| `New Show Cron` | newShowCron found new shows (newShowCron.ts:42-55) | absence for many days + shrinking days-ahead = discovery stalled |
| *(nothing)* | sync succeeded — success is silent | **silent staleness is possible**: a 200 that parses to empty (e.g. `.no-shows` misfire, selector drift) raises no email at all |

**Decide the scope:**

- 0.1 fails → API/ops problem, not the scraper. → **cellar-run-and-operate**, **cellar-debugging-playbook**.
- All queries return `total: 0` (DB empty) → bootstrap problem; note both crons crash on an
  empty show table (`getLastShow` destructure, newShowCron.ts:17-20, syncCron.ts:52-56). Seed
  first → **cellar-data-model**.
- 0.2 and 0.3 healthy → not a scraper outage. Re-triage the original symptom → **cellar-debugging-playbook**.
- Data stale / today empty / failure mails → scraper outage confirmed. Also remember crons
  only run in prod (`IS_ACTIVE` gate, infra/cron.ts:9,22; guards newShowCron.ts:14-16,
  syncCron.ts:45-47). → **PHASE 1**.

---

## PHASE 1 — Classify the failure (direct probes, residential network)

Single requests, ≥5s apart, from a machine with normal internet. Build the request exactly as
`requester.ts` + `fetchShows.ts`/`fetchLineUp.ts` do. The token is extracted from the repo at
runtime — do not paste it into your shell history or notes.

```bash
cd /home/user/comedy-cellar-bot   # or wherever the repo is checked out
TODAY=$(TZ=America/New_York date +%F)
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
TOKEN=$(awk -F'"' '/[a-f0-9]{64}\./ {print $2}' packages/core/requester.ts)   # never echo it

# P1 — getShows WITHOUT the token (contract: fetchShows.ts:7-14)
curl -sS -m 30 -X POST 'https://www.comedycellar.com/reservations/api/getShows' \
  -H 'content-type: application/json' -H "user-agent: $UA" \
  --data "{\"date\":\"$TODAY\"}" \
  -o /tmp/getshows-notoken.json -w 'P1: HTTP %{http_code} in %{time_total}s\n'
sleep 5

# P2 — getShows WITH token + x-page-creation (contract: requester.ts:9-15)
curl -sS -m 30 -X POST 'https://www.comedycellar.com/reservations/api/getShows' \
  -H 'content-type: application/json' -H "user-agent: $UA" \
  -H "x-code-localize: $TOKEN" -H "x-page-creation: $(date +%s%3N)" \
  --data "{\"date\":\"$TODAY\"}" \
  -o /tmp/getshows-token.json -w 'P2: HTTP %{http_code} in %{time_total}s\n'
jq '.data.showInfo.shows | length' /tmp/getshows-token.json   # healthy: > 0 on a show night
sleep 5

# P3 — lineup endpoint WITH token (contract: fetchLineUp.ts:8-28)
curl -sS -m 30 -X POST 'https://www.comedycellar.com/lineup/api/' \
  -H 'content-type: application/x-www-form-urlencoded; charset=UTF-8' -H "user-agent: $UA" \
  -H "x-code-localize: $TOKEN" -H "x-page-creation: $(date +%s%3N)" \
  --data-urlencode 'action=cc_get_shows' \
  --data-urlencode "json={\"date\":\"$TODAY\",\"venue\":\"newyork\",\"type\":\"lineup\"}" \
  -o /tmp/lineup.json -w 'P3: HTTP %{http_code}\n'
jq -r '.show.html' /tmp/lineup.json | head -c 400
```

Expected-healthy shapes (from `packages/types/api.ts:12-57` — this sandbox cannot verify them
live): P2 → `{message, data:{showInfo:{shows:[{id,time,timestamp,roomId,max,totalGuests,...}]}}}`;
P3 → JSON whose `.show.html` is an HTML fragment containing `.lineup` / `.set-content` /
`.make-reservation` elements (or a `.no-shows` element on genuinely empty days).

**Decision matrix — take the FIRST row that matches:**

| Observation | Diagnosis | Next |
|---|---|---|
| P2 HTTP 200, `shows` array valid & non-empty, AND P3 `.show.html` has healthy classes | Site side fine → fault is in our parse/persist/cron path | Run the local parser on P3's output (Phase 2B step 2). Parser output healthy too? → DB/cron side → **cellar-debugging-playbook** + **cellar-data-model** |
| P2 200 + valid, but P3's `.show.html` contains `class="no-shows"` on a date the site visibly lists shows | Soft rejection: request accepted but served the empty-day page — token/params rejected quietly. Token is prime suspect (it's ~22 months old) | **PHASE 2A** |
| P2 200 but JSON shape differs from `types/api.ts` (no `.data.showInfo`, renamed fields) | JSON contract drift | **PHASE 2C** |
| P3 200 but the fragment's classes changed (no `.lineup`/`.set-content`/`showid=`) | HTML/CSS drift (site redesign) | **PHASE 2B** |
| HTTP 403 / 429 / 503, or HTML challenge page ("just a moment", captcha, "access denied") on P2/P3 — with or without token | Hard blocking | **PHASE 2D — stop first, read the gate** |
| P1 (no token) blocked but P2 (token) fine | Anti-bot working as known; token still valid. Not the fault — go back to Phase 0 conclusions | **cellar-debugging-playbook** |
| Timeout / DNS failure / TLS error | Site down, moved, or fronted by something new | Open the site in a normal browser. Browser works but curl doesn't → fingerprint problem → **2D**. Browser fails too → genuine site outage: wait, re-probe in hours. Site redesigned/moved → **2B/2C** after mapping the new endpoints (**cellar-scraping-reference**) |

Record every probe's HTTP code + one-line observation before moving on — Phase 3 and the
post-incident entry (**cellar-failure-archaeology**) need them.

---

## PHASE 2 — Branch playbooks (ranked by historical likelihood)

### 2A — Token expired/invalidated → recapture (most likely; it fixed the 2024 outage)

A human with a real browser must do steps 1–4; there is no automated path.

1. In a normal browser on a residential network, open `https://www.comedycellar.com` and
   navigate to the page that lists nightly lineups (historically `/line-up/` — live URL
   unverified from this sandbox).
2. DevTools → Network tab → filter Fetch/XHR → reload the page.
3. Find the `POST` to `lineup/api/` (form field `action=cc_get_shows`) or to
   `reservations/api/getShows`.
4. In its **Request Headers**, copy the `x-code-localize` value.
5. Edit `packages/core/requester.ts:12-13`, replacing only that string. **Single-change
   diff** — nothing else in the commit. Never paste the token anywhere else (it embeds a
   capture timestamp + your IP; see cellar-scraping-reference §4.2).
6. Verify on your personal stage (needs AWS creds + a stage entry in `infra/config.ts` — see
   **cellar-build-and-env** / **cellar-run-and-operate**):

   ```bash
   pnpm dev          # sst dev; note the ApiGatewayV2 URL it prints
   DEVAPI=<that url>
   curl -sS "$DEVAPI/api/line-up?date=$(TZ=America/New_York date +%F)" \
     | jq '{date, shows: (.lineUps|length), actsPerShow: [.lineUps[].acts|length]}'
   ```

   EXPECTED: `shows > 0` on a night with shows and non-empty `actsPerShow` (response shape =
   `handleLineUp` return, handleLineUp.ts:47-50). Record the numbers next to a manual count of
   the same date on the site. Note: this call persists comics/acts into the SHARED database
   (additive upserts — acceptable, but know it; **cellar-data-model**).
7. Obligations to ship: single-change diff + recorded dev verification numbers in the PR;
   class **scraping-behavior**, owner sign-off (**cellar-change-control**). Then **PHASE 3**.

### 2B — HTML/CSS drift → fix the parser against a captured fixture

1. You already captured the live response at `/tmp/lineup.json` (Phase 1 P3).
2. Run the repo's REAL parser on it, offline (script verified working 2026-07-07 against a
   synthetic fragment and the `.no-shows` sentinel):

   ```bash
   .claude/skills/cellar-scraper-recovery-campaign/scripts/local-parse-lineup.sh /tmp/lineup.json
   # stdout: parsed shows JSON;  stderr: shows=N acts=M named-acts=K with-timestamp=T
   ```

   Drift symptom: `shows=0` (or acts empty/nameless) while `jq -r '.show.html' /tmp/lineup.json`
   clearly contains lineup content.
3. Diff the fragment's class names against the parse contract — `.no-shows` (parseLineUp.ts:60),
   `.lineup` (:66), `.make-reservation > a` + `showid=` (:68-72), `.set-content` (:38),
   `.name` (:17). Contract detail lives in **cellar-scraping-reference §3**.
4. Adjust selectors in `packages/core/parseLineUp.ts`; re-run the script until
   `shows=` / `named-acts=` match your manual count of that date on the site. **Do not touch
   the `.no-shows` sentinel logic** (see wrong paths).
5. Pin `/tmp/lineup.json` (or its `.show.html`) as a regression fixture in the repo — the
   existing captured-response home is `packages/__fixtures__/`; evidence rules per
   **cellar-validation-and-qa**. The repo has zero automated tests (as of 2026-07-07), so this
   fixture + a recorded script run IS the regression evidence in the PR.
6. Ship: class **scraping-behavior** → **cellar-change-control** → **PHASE 3**.

### 2C — JSON contract drift → update types + every blind-cast site

1. Diff the live response against the declared contract:

   ```bash
   jq '.data.showInfo.shows[0] | keys' /tmp/getshows-token.json
   # compare against ApiResponse.Show fields, packages/types/api.ts:12-30
   # and the envelope {message, data:{showInfo}}, api.ts:52-57
   ```
2. There is NO runtime validation — updates must cover every blind-trust site:
   `fetchShows.ts:13` (`res.data as ApiResponse.GetShowsResponse`), `fetchLineUp.ts:31`
   (unvalidated `res.data.show.html`), `createReservation.ts:15` (response cast).
3. Chase downstream consumers: the `Show` model + upsert columns (models/show.ts:165-180) and
   the hardcoded `roomDictionary` (models/show.ts:27-32 — an unknown new `roomId` yields an
   undefined room name → NOT NULL violation silently swallowed; see **cellar-data-model**).
4. Candidate improvement (open, NOT shipped): zod-parse CC responses at ingestion so drift
   fails loudly instead of TypeErrors/silent empties — design per **cellar-validation-and-qa**.
5. Ship: class **scraping-behavior** → **cellar-change-control** → **PHASE 3**.

### 2D — Hard blocking (403 / captcha / challenge) — STOP-AND-THINK gate

**Do NOT retry-loop.** Every extra blocked request confirms to the site that this IP/fingerprint
is a bot. First, a politeness self-audit: cron schedules unchanged (`infra/cron.ts:13,26` —
every-6h + hourly)? Sleeps intact (newShowCron.ts:62, syncCron.ts:88)? Sync still one date per
run (syncCron.ts:68)? Nothing new hammering (a rogue script, a loop someone added)? Fix any
regression there FIRST — it may be the whole cause.

Then work the menu **in order**; each step needs the previous one to have failed:

| Rank | Option | Cost/obligations |
|---|---|---|
| 1 | **Wait and observe 24–48h.** Soft blocks can be transient; the project's history favors patience (two dormancies ended with a fix, not a war). | Cheapest. Re-run Phase 1 once per day, single probes only. |
| 2 | **Refresh the full header fingerprint** from a real browser — 2A's procedure, but copy ALL request headers of the real `getShows` XHR, not just the token; keep serial fetching + sleeps unchanged. | Class scraping-behavior, owner sign-off, dev verification as in 2A. |
| 3 | **Headless-browser rendering** (puppeteer/playwright in Lambda) — LAST resort. New heavy dependency, Lambda size/cost, and an ethics line: actively defeating anti-bot vs. blending in. The project has deliberately never done this (**cellar-scraping-reference §5**). | REQUIRES explicit owner approval via **cellar-change-control** BEFORE any code is written. |
| 4 | **Commercial/residential proxies** — historically never used; out of character for an unofficial fan site. Treat as "probably no". | Owner decision only. |

---

## WRONG PATHS — fenced. Do not do these.

| Wrong path | Why it is fenced |
|---|---|
| Hammering the site "to test", or scripting retry loops against a 403 | Rapid repeats are exactly what anti-bot detects; this failure class caused the 5-month outage the `122ccf5` token ended. Single probes, ≥5s apart. |
| Increasing cron frequency to "catch up" after recovery | Cron schedules are owner-only config (**cellar-change-control §2d**); the horizon refills naturally — newShowCron walks one day forward per 6h cycle and `GET /sync-shows` (infra/api.ts:37-40) can be invoked manually, politely. |
| Pointing any dev experiment at `POST addReservation` | It books REAL seats at a REAL club. `createReservation.ts:10-17` returns the fixture outside `prod` — never remove or widen that gate. Absolute rule. |
| Parallel-scraping many dates to rebuild data fast | Violates the politeness invariant that keeps us unblocked (serial + sleeps: newShowCron.ts:62, syncCron.ts:88; one-date sync syncCron.ts:68). |
| "Fixing" empty results by deleting/weakening the `.no-shows` sentinel (parseLineUp.ts:60-62) | The sentinel is what distinguishes "genuinely no shows tonight" from a parse failure (added for exactly that, f8b6976 2024-10-25). Removing it hides the drift signal and turns real empty days into garbage. |
| Echoing/committing the token anywhere outside `requester.ts:12-13` | Captured credential with embedded capture-IP. Reference by path only. |

---

## PHASE 3 — Validate, promote, watch

**Validation gates (dev stage; every gate is a number, never an eyeball):**

```bash
# with the fix running on your personal stage (pnpm dev)
DEVAPI=<sst dev ApiGatewayV2 URL>
TODAY=$(TZ=America/New_York date +%F)

# V1 — live show fetch for a date the site visibly lists shows
curl -sS "$DEVAPI/api/shows?date=$TODAY" | jq '.shows | length'
#   EXPECTED: exactly the number of shows you count by hand on comedycellar.com for $TODAY
#   (listShows = live fetch + persist, functions/shows/index.ts:18-41 — deprecated but the
#    most direct live-scrape probe we expose)

# V2 — lineups for a night with an announced lineup
curl -sS "$DEVAPI/api/line-up?date=$TODAY" \
  | jq '{shows: (.lineUps|length), namedActs: [.lineUps[].acts[].name] | map(select(.)) | length}'
#   EXPECTED: shows > 0, namedActs matches your manual count of names on the site

# V3 — the data actually landed (shared DB, so prod API works too)
# re-run Phase 0 probe 0.3 → EXPECTED: unique show ids ≥ 1 for today
```

Also re-run `scripts/token-age.sh` and note the (new) token age in the PR.

**Promote:** open the PR with the recorded Phase 1 observations + V1/V2/V3 numbers; class
**scraping-behavior**; owner approves and the owner deploys prod (`pnpm deploy:prod` is
owner-only — **cellar-change-control**, **cellar-run-and-operate**).

**Watch (the 24h after prod deploy):**

- syncCron runs hourly, newShowCron every 6h (infra/cron.ts:26,13). Success is silent;
  failure emails "Sync Show Cron". Watch **at least the next 2 sync cycles**: the inbox must
  stay free of new "Sync Show Cron" failure mails.
- Re-run Phase 0 probes 0.2/0.3 at +2h and +24h.
- CloudWatch logs for the cron Lambdas if anything looks off → **cellar-run-and-operate**.

**RECOVERED means all of (numeric, no judgment calls):**

1. Probe 0.1 healthy.
2. Probe 0.3 today-count ≥ 1 and consistent with the manual site count (join-dedup caveat
   applies) on **two consecutive evenings**.
3. Probe 0.2 days-ahead ≥ 7 and stable or growing (threshold is an estimate of CC's rolling
   publication horizon — recalibrate if the club changes how far out it publishes).
4. Zero "Sync Show Cron" failure emails in the 24h after deploy.
5. The numbers are recorded in the PR, and a post-incident entry
   (symptom → cause → evidence → status) is added to **cellar-failure-archaeology**.

---

## Standing order — token staleness gauge

During ANY scraper work (not just outages), run:

```bash
.claude/skills/cellar-scraper-recovery-campaign/scripts/token-age.sh
```

It prints the token's capture date + age without printing the token, and flags ages > 12
months. If flagged, raise **preventive recapture** (Phase 2A) with the owner as a maintenance
candidate — do not just do it, rotation of a captured credential is owner territory
(**cellar-change-control §2d/§5**).

Status (as of 2026-07-07): capture date 2024-09-13, age 662 days (~22 months) — the standing
order is ALREADY triggered. Preventive recapture is an **open candidate**, not scheduled.

---

## Provenance and maintenance

Verified against the repo at commit `0f277a2` (branch `claude/skill-library-continuity-4m3x56`,
== main) on 2026-07-07, by reading: `packages/core/requester.ts`, `fetchLineUp.ts`,
`fetchShows.ts`, `parseLineUp.ts`, `handleLineUp.ts`, `handleShowDetails.ts`,
`createReservation.ts`, `email.ts`, `models/show.ts`, `common/schema.ts`,
`packages/functions/cron/{syncCron,newShowCron}.ts`, `packages/functions/{lineUp,health,reservation}.ts`,
`packages/functions/shows/index.ts`, `packages/types/api.ts`, `infra/{api,cron,frontend}.ts`,
`plan/README.md:65`. Commands run here: both `scripts/` helpers end-to-end (local-parse-lineup
against a synthetic fragment, a JSON envelope, and a `.no-shows` fragment; token-age full run),
and the token-tail decode (timestamp only). NOT verifiable from this sandbox: anything live —
comedycellar.com responses, prod API output, pre-2024-10-11 SHAs (`122ccf5`, `f8b6976` is
local; `122ccf5` recovered from GitHub history), and the live lineup page URL.

| May drift | Re-verify with |
|---|---|
| Prod API domain | `grep -n 'comedycellar-api' infra/api.ts` |
| Cron schedules (owner-only to change) | `grep -n 'cron(' infra/cron.ts` → `0 0/6` and `0 0/1` |
| Token age / presence | `.claude/skills/cellar-scraper-recovery-campaign/scripts/token-age.sh` |
| Parse selectors | `grep -n 'no-shows\|\.lineup\|set-content\|make-reservation\|showid' packages/core/parseLineUp.ts` |
| STAGE gate on real bookings | `grep -n 'STAGE' packages/core/createReservation.ts` → `=== "prod"` at line 10 |
| Politeness sleeps / one-date sync | `grep -n 'sleep(' packages/functions/cron/*.ts`; `grep -n 'dates\[0\]' packages/functions/cron/syncCron.ts` |
| Email alarm subjects | `grep -rn 'subject:' packages/functions/cron packages/functions/reservation.ts` |
| Local parser harness still works | `scripts/local-parse-lineup.sh` on any saved fragment — expect JSON + `shows=… acts=…` summary |
| `/api/shows/new` join caveat | `sed -n '204,216p' packages/core/models/show.ts` (innerJoin act/comic/room) |
