---
name: cellar-debugging-playbook
description: Symptom-to-triage tables, time-costing traps, and discriminating experiments for comedy-cellar-bot. Use when diagnosing a live misbehavior - empty show listings, crons that seem dead, off-by-one dates, duplicate rows from /api/shows/new, /api/shows/scan returning [], 500s from /api/settings, Clerk auth failures, frontend infinite loading, CI/build breakage, "Cannot find name 'sst'" type errors, broken mobile layout, or admin-email floods/silence.
---

# Cellar Debugging Playbook

Runbook for diagnosing comedy-cellar-bot failures. This project scrapes comedycellar.com (a real NYC comedy club), stores shows/comics in a shared Supabase Postgres, and serves a Preact frontend — all deployed with SST (an infrastructure-as-code framework that compiles each Lambda from `packages/functions/`).

**When NOT to use this skill:** for a full scraper outage (site changed, anti-bot triggered) go to **cellar-scraper-recovery-campaign** (decision-gated runbook) and **cellar-scraping-reference** (endpoint/parse contracts). For "how do I read logs / what is a stage / how do crons deploy" go to **cellar-run-and-operate**. For environment/build setup failures beyond the two named here, **cellar-build-and-env**. For the full chronicle of past investigations, **cellar-failure-archaeology**. Any fix you derive here that changes behavior must go through **cellar-change-control** before it ships.

## Ground rules while debugging (non-negotiable)

| Rule | Why | Reference |
|---|---|---|
| Never POST `/api/reservation/*` against prod as a "test" | `process.env.STAGE === "prod"` books a REAL seat at a real club (packages/core/createReservation.ts:10-17); non-prod stages return a canned fixture | cellar-change-control |
| One polite probe, never loops, against comedycellar.com | Sep-2024 anti-bot breakage caused a 5-month outage; the recovery token in packages/core/requester.ts:12-13 is still load-bearing. Do not hammer. | cellar-scraping-reference |
| Never copy the `x-code-localize` header value or Slack webhook (packages/core/slack.ts:3-9) into notes/issues/PRs | Committed secrets; treat as radioactive | cellar-config-and-secrets |
| All stages share ONE Supabase DB (only `user` rows are stage-partitioned) | A "dev" DELETE/UPDATE is prod surgery | cellar-data-model |
| Manually invoking `GET /sync-shows` writes to the shared DB and hits comedycellar.com | It is public and unauthenticated (infra/api.ts:37-40) — one invocation is a legitimate diagnostic, repeated invocations are not | below, Symptom 2 |

## Symptom → triage table

| # | Symptom | First check | Discriminator | Likely cause |
|---|---|---|---|---|
| 1 | Site shows no shows / empty lineups | Is the day genuinely empty? (club calendar) | `.no-shows` sentinel vs. scrape/anti-bot failure | Legit empty day, OR scraper broken |
| 2 | Cron "didn't run" / no new shows for days | Which stage? Is the `show` table empty or all-past? | CloudWatch invocation logs + `SELECT max(timestamp) FROM show` | `IS_ACTIVE` no-op outside prod, or bootstrap crash on empty table |
| 3 | Times/dates off by one | What time of day (UTC) does it happen? | Reproduce between 00:00–05:00 UTC | UTC-vs-NY window; historic DST/fixed-offset bug class |
| 4 | Duplicate shows from `/api/shows/new` | Do dup rows share `id`? | `jq` count of repeated ids | Missing GROUP BY on act/comic joins |
| 5 | `/api/shows/scan` returns `[]` | Always, or only sometimes? | `node -e` Invalid Date proof (below) | `new Date(undefined)` in getFutureDatesByDay |
| 6 | 500 from `/api/settings` | Valid JWT? Which verb? | Does the Clerk user have a `user` row for THIS stage? | Missing user row, or unknown comicId NOT NULL violation |
| 7 | Clerk auth failures | Deploy-time or request-time? | Deploy crash vs 401 vs 500 | Stage missing from infra/config.ts map; webhook not configured |
| 8 | Frontend infinite loading / runaway pagination | Comics page? | Network tab: repeating `/api/comics?offset=…` | `getNextPageParam` regression |
| 9 | Frontend CI/build fails | Where was `pnpm install` run? | Root vs `packages/frontend` lockfile | Nested-workspace trap |
| 10 | `Cannot find name 'sst'` / `$app` type errors | Does `.sst/platform` exist? | `ls .sst/platform 2>/dev/null` | Generated types missing; EXPECTED in sandboxes |
| 11 | Mobile layout broken/clipped | Which viewport width? | Narrow-viewport screenshot | Recurring CSS-overflow class |
| 12 | Admin email flood or total silence | Which subject line? | "New Show Cron" repeats vs no "Sync Show Cron" ever | Email IS the telemetry — read it as such |

## Symptom details

### 1. Site shows no shows / empty lineups
Three distinct causes; do not fix before discriminating:
- **Legit empty day**: the lineup endpoint returns an HTML fragment containing a `.no-shows` element; the parser correctly maps it to `[]` (packages/core/parseLineUp.ts:60-62, hardened in f8b6976, 2024-10-25).
- **Parse failure**: comedycellar.com redesigned; the parser depends entirely on CSS classes `.lineup`, `.set-content`, `.name`, `.make-reservation`, `.no-shows` (parseLineUp.ts:17,38,60,66,69) — a redesign yields silent `[]` or garbage, not errors.
- **Anti-bot**: request-level rejection (the Sep-2024 mode). Note the frontend also masks lineup failures: `fetchLineUp` swallows all errors into `{date:"", lineUps:[]}` (packages/frontend/src/utils/api.ts:66-77), so "no lineup on the site" can be a 500 underneath — check the API directly before blaming the scraper.
First check: `curl -s https://comedycellar-api.mafz.al/api/line-up?date=YYYY-MM-DD` for a date the club definitely has shows. Empty `lineUps` for a known-busy Friday = scraper problem. Then STOP and load **cellar-scraper-recovery-campaign** — it owns the full decision tree, including safe live probes.

### 2. Cron didn't run / no new shows for days
Two crons exist (infra/cron.ts): `Cron` → newShowCron every 6h (`cron(0 0/6 * * ? *)`, line 13), `SyncCron` → syncCron hourly (line 26). Both deploy in ALL stages but set `IS_ACTIVE = ($app.stage === "prod" ? "1" : "0")` (infra/cron.ts:9,22); handlers no-op via `if (!IS_ACTIVE && IS_CRON) return;` (newShowCron.ts:14-16, syncCron.ts:45-47). **So on a dev stage, scheduled crons silently do nothing — by design** (added 70baa86, 2024-10-28, after a new cron initially ran in all stages). The same syncCron code IS runnable in any stage via `GET /sync-shows` because the HTTP route sets no env vars (infra/api.ts:37-40) — IS_CRON is unset, guard passes.
- **Bootstrap/stale-DB crash**: both crons destructure `const [lastKnownShow] = await getLastShow();` then read `.timestamp` (newShowCron.ts:17-20, syncCron.ts:52-56). Empty `show` table → `lastKnownShow` is `undefined` → TypeError every run, forever. Seed by fetching once: `GET /api/shows?date=YYYY-MM-DD` (persists in background). Related: `getComics` destructures BOTH `getLastShow()` and `getUpcomingShow()` (packages/core/models/comic.ts:53-59); `getUpcomingShow` returns `[]` when no FUTURE shows exist (show.ts:262-269) — so after a long outage `/api/comics` 500s even with a non-empty table.
- **Silent write failure**: cron "ran" but nothing landed — see Trap 1.
Verification: CloudWatch logs (see **cellar-run-and-operate**) plus `SELECT max(to_timestamp(timestamp)) FROM show;` in Drizzle Studio (`pnpm db:studio`; needs AWS creds + secrets — see **cellar-config-and-secrets**).

### 3. Times/dates off by one (the recurring timezone class)
Three documented incidents; assume any date bug is this class until proven otherwise:
- **Fixed-offset DST bug**: default TZ was `Etc/GMT+5`, wrong by an hour once US DST started; fixed to `America/New_York` in commit 6886326 (2024-04-13; recovered from GitHub history — predates the local shallow clone, so `git show 6886326` fails here). Rule: only ever `America/New_York` (defaults at packages/core/utils.ts:6, getFutureDatesByDay.ts:14).
- **UTC-vs-NY window (still live, as of 2026-07-07)**: syncCron computes "today" with `startOfDay(new Date())` in the Lambda's UTC clock (syncCron.ts:49-51). Between 00:00 and ~05:00 UTC — i.e. NY evening, exactly when shows run — "today" is already tomorrow. Also `isToday()` in getFutureDatesByDay.ts:34 uses the system clock while everything around it is NY-zoned. If a report says "evening data is wrong", reproduce in that UTC window before touching code.
- **Calendar year bug**: frontend calendar grid ignored the selected year; fixed 64b3ee2 (2026-07-02, PR #61).
Fix pointer: timezone changes alter scrape targeting and stored identity (show id = unix seconds) — **cellar-change-control** gates apply; data-model implications in **cellar-data-model**.

### 4. Duplicate shows from `/api/shows/new`
`getShows` inner-joins `act` and `comic` with **no GROUP BY or DISTINCT** (packages/core/models/show.ts:207-216): a show with N comics appears N times. `getShowsCount` counts act-rows, not shows (show.ts:235-241). Corollary: shows with zero acts (specials) are invisible to this endpoint. Contrast with `getComics`, which does `.groupBy(comic.id, comic.name)` (comic.ts:74) — the fix shape exists in-repo. Behavior change (payload + totals) → **cellar-change-control**; pagination totals feed the frontend (Symptom 8).

### 5. `/api/shows/scan` returns `[]` always
Handler passes only `days` (packages/functions/shows/index.ts:94-105) → `handleShowList({days})` calls `getFutureDatesByDay(days, fromTimestamp)` with `fromTimestamp` undefined (packages/core/handleShowList.ts:11) → `new Date(undefined)` at getFutureDatesByDay.ts:21 is `Invalid Date` → date-fns v4 `eachDayOfInterval` on an invalid interval returns `[]` → zero dates iterated → `[]` out, HTTP 200. Crons are unaffected (they always pass a timestamp: newShowCron.ts:37). Proof against this repo's own node_modules (run from repo root; verified 2026-07-07):

```bash
node -e "
const { eachDayOfInterval, startOfDay, addDays } = require('date-fns');
const d = new Date(undefined);
console.log('new Date(undefined):', d.toString());
const out = eachDayOfInterval({ start: startOfDay(d), end: addDays(startOfDay(d), 3) });
console.log('eachDayOfInterval length:', out.length);
"
# prints: new Date(undefined): Invalid Date / eachDayOfInterval length: 0
```

`getFutureDatesByWeek.ts` has the same flaw (unused). Known-broken, low-priority — status tracked in **cellar-failure-archaeology**; fixing changes a public endpoint → **cellar-change-control**.

### 6. 500 from `/api/settings`
Both handlers 400 cleanly on a MISSING token (settings/index.ts:23-28,100-105 — note: 400, not 401). The 500s come after auth passes:
- **Valid JWT, no user row**: `const [user] = await getUserByAuthId(authId)` then `user.id` with no guard (settings/index.ts:30→51-52 for GET; 106→131,144 for POST). User exists in Clerk but not in this stage's `user` rows (rows are stage-partitioned) → TypeError → 500. Root causes: webhook misconfig (Symptom 7) or a user created on another stage.
- **Unknown comicId on POST**: `upsertComicNotification` maps external→internal ids via a lookup dict; an unknown-but-well-formed `comic_…` id yields `comicId: undefined` (packages/core/models/comicNotification.ts:41) → NOT NULL violation on insert (:45-54) → 500. The zod refinement (settings/index.ts:84) only checks the string contains `comic` — it is an unanchored substring regex (comic.ts:32-34), not an existence check.

### 7. Clerk auth failures
Clerk is the hosted-auth provider; API Gateway validates its JWTs only on the two `/api/settings` routes (infra/api.ts:103-123); everything else is public.
- **Deploy-time crash**: `config[$app.stage]` (infra/config.ts:17) is `undefined` for any stage other than `mohammadafzal` or `prod` → infra/api.ts:22 throws during deploy. New personal stage ⇒ add a config entry first (**cellar-config-and-secrets**).
- **Request-time 401**: API GW rejects before the Lambda — wrong issuer for the stage (prod issuer is the custom Clerk domain, dev is a `*.clerk.accounts.dev` host; infra/config.ts:5-10) or missing `ClerkJwtAuthorizer` audience (infra/api.ts:23).
- **User signed in but has no data / settings 500**: webhook path. `POST /webhook/clerk` verifies signatures with svix (the webhook-signing library Clerk uses); verification failure → 400 (packages/functions/webhooks/clerk.ts:100-134). Incident: prod webhook config was missing at Clerk-cutover (PR #30 "fix/prod-webhook", merge 6bf5945, commits dee1ae7/f95f295, 2024-10-14) — sign-ins worked, user rows were never created. The `session.created` backfill handler (clerk.ts:118-121,25-51) exists as the safety net for exactly this. If a Clerk user has no `user` row, check the Clerk dashboard webhook endpoint + `ClerkSigningSecret` for that stage.

### 8. Frontend infinite loading / runaway pagination
History (all commits verifiable locally): ebc8f5a (2024-11-24, wip) → a9a902b (2025-01-04, lazy loading) → 42ab4ac (same day, loader fix) → **6c3da50 (2025-03-13, the real fix)**. The bug: `getNextPageParam` returned `lastPage.offset + lastPage.limit` unconditionally, so TanStack Query's `hasNextPage` was always true and the IntersectionObserver sentinel fetched forever. The lesson: **TanStack `useInfiniteQuery` stops paginating ONLY when `getNextPageParam` returns `undefined`** — a bound check against `total/limit` plus a `hasNextPage` guard on the observer effect (current code: packages/frontend/src/pages/Comics/index.tsx:33-38 and :63-67). Two compounding hazards when touching this: `total` over-counts (Symptom 4), and 4xx responses throw the RAW body from `customFetch` (utils/api.ts:46-48) — a page that doesn't handle that shape shows a confusing failure.

### 9. Frontend CI/build failures
`packages/frontend` is its OWN pnpm workspace root with its own lockfile; the root lockfile is stale for frontend deps — CI installs INSIDE `packages/frontend` and says so in a comment (.github/workflows/frontend-ci.yml:40-45). Symptoms: `ERR_PNPM_OUTDATED_LOCKFILE` in CI after editing frontend deps from the root, or phantom dep drift after a root `pnpm install`. Correct local reproduction of CI (verified passing 2026-07-07):

```bash
cd packages/frontend
pnpm install --frozen-lockfile
pnpm exec eslint src && pnpm exec tsc --noEmit && pnpm build
```

Full explanation of the two-workspace trap: **cellar-build-and-env** (its home — do not re-derive it here).

### 10. `Cannot find name 'sst'` / `$app` / `aws` type errors at root
Root `pnpm exec tsc --noEmit` needs generated types in `.sst/platform`, created by `sst install` / `sst dev`. In restricted sandboxes the pulumi binary download is blocked (HTTP 403 from the proxy) so `.sst/` can never be generated there — **these type errors are expected sandbox behavior, not a project bug** (as of 2026-07-07 there is no working backend typecheck gate anywhere; only frontend CI exists). Do not "fix" infra typing to appease a sandbox. Details and workarounds: **cellar-build-and-env**.

### 11. Mobile layout broken / clipped / overflowing
The single most recurring frontend bug class — six incidents across the project's life: b697c94 (2024-10-11, comic list/header), 7ea6a4b (2024-10-26, footer), 9ce39a1 (2024-11-03, spacing), 2fd6b30 (2026-07-02, PR #60, show cards + auth/header), 6192496 (2026-07-03, badge wrapping "Selling Fast"), c8d9918 (2026-07-03, comic-page identity row pulled −66px over the banner). The 2026 redesign needed three mobile-fix rounds within 24h of landing. Triage: reproduce at a narrow viewport (~375px) FIRST; suspect flex rows with fixed negative margins and long unwrappable text. Token/styling rules live in **cellar-frontend-design-system** (defer to packages/frontend/src/components/ui/CONTRACT.md); evidence standards for layout fixes in **cellar-validation-and-qa**.

### 12. Admin email flood or silence (email IS the telemetry)
There is no monitoring stack (Sentry was removed in 56afdca, 2024-10-14); the only production telemetry is Gmail self-email — `sendEmail` hardcodes `to: FromEmail` (packages/core/email.ts:23). **No end user has ever received a notification; the notification tables are written but nothing reads them to send** (open ambition — see cellar-frontier-and-method). Read the inbox as a log stream:

| Signal | Meaning |
|---|---|
| "New Show Cron" with show JSON | newShowCron found shows on a new day (newShowCron.ts:42-55) — normal, up to 4x/day |
| Same "New Show Cron" content repeating every 6h | DB writes are silently failing: the swallow in handleShowDetails (Trap 1) keeps `getLastShow` stale, so the same day is "discovered" every run |
| "Sync Show Cron" | syncCron FAILURE with message+stack (syncCron.ts:90-97); success is silent |
| "Comedy Cellar: new reservation!" | Real reservation attempt (contains guest PII — handle accordingly) |
| Total silence | Ambiguous: healthy, or crons dead (Symptom 2), or Gmail creds rotated (`FromEmail`/`FromEmailPw` secrets — cellar-config-and-secrets) |

Story: even the telemetry had a bug — until 953e0ef (2024-10-29) the syncCron failure email carried the WRONG subject ("New Show Cron") and a static message with no error detail, so failures were misattributed. Verify: `git show 953e0ef`.

## Traps that cost real time

### Trap 1 — Swallow-and-continue hides all DB failures
`handleShowDetails` wraps its persistence in try/catch that only `console.error`s (packages/core/handleShowDetails.ts:25-28, comment: "just for background caching"), AND the writes inside are `Promise.allSettled` (:20-23) — a double swallow. `handleLineUp` same pattern (handleLineUp.ts:42-45). Consequence: **an HTTP 200 from `/api/shows`, `/api/line-up`, or a "successful" cron run proves nothing about the database.** Story: d020632 (2024-10-22) — a Lambda shipped without its DB binding and the failure was invisible until a9e371c's "Debugging undefined lineups" session the same day. Always verify writes with row counts, never with response codes (recipes: **cellar-diagnostics-toolkit**).

### Trap 2 — UA and `x-page-creation` are frozen per Lambda container
The axios instance is module-scoped: one random User-Agent and one `x-page-creation: +new Date()` are computed at cold start and reused for the container's whole life (packages/core/requester.ts:11,14) — hours, potentially. If comedycellar.com starts validating header freshness, failures will look random (per-container), succeed after redeploys (new containers), and defy local reproduction (every local run is a fresh "container"). The adjacent `x-code-localize` header (requester.ts:12-13) is the captured anti-bot token from the Sep-2024 recovery — never quote its value; anatomy and history in **cellar-scraping-reference**.

### Trap 3 — Unknown room ⇒ shows silently never persist
Room names come from a hardcoded dict `{1: MacDougal St, 2: Village Underground, 3: Fat Black Pussycat, 5: Unknown}` (packages/core/models/show.ts:27-32). If the club adds roomId 4 or 6: `roomName` is `undefined` → `room.name` NOT NULL violation (room.sql.ts) → room insert rejects; then every show insert for that room fails the `roomId → room.id` FK (show.sql.ts, `.references(() => room.id).notNull()`) — all inside Trap 1's double swallow. Symptom: API scrape responses show the shows, the DB (and `/api/shows/new`) never does, for one room only. Check: `SELECT DISTINCT "roomId" FROM show;` vs what the scrape returns.

### Trap 4 — Acts are dropped unless EXACTLY one show matches the timestamp
`handleLineUp` attaches comics to a show only `if (show.length === 1 && show[0].id)` (packages/core/handleLineUp.ts:34) — zero matches (show row not written yet; note syncCron runs handleShowDetails and handleLineUp in PARALLEL via allSettled, syncCron.ts:71-78, so the race is real) or duplicate timestamps (`show.timestamp` has NO unique index — cellar-data-model) both mean the lineup is silently skipped. Additionally, a lineup missing its reservation link yields `timestamp: undefined` (parseLineUp.ts:72,80) and `eq(show.timestamp, undefined)` throws inside the swallowed try. Symptom: shows exist but have no comics; those shows are then invisible in `/api/shows/new` (Symptom 4's inner join).

## Discriminating experiments

Safe, read-only probes that split hypotheses. Anything that writes or scrapes repeatedly is out of scope here — see the ground-rules table.

| Question | Experiment | Interpretation |
|---|---|---|
| Is `/api/shows/scan` broken by Invalid Date? | The `node -e` block in Symptom 5 (verified) | length 0 ⇒ confirmed at the date-fns layer |
| Are `/api/shows/new` duplicates the GROUP BY bug? | `curl -s 'https://comedycellar-api.mafz.al/api/shows/new?limit=100' \| jq '[.results[].id] \| group_by(.) \| map(select(length>1)) \| length'` (expected: >0 whenever shows have multiple comics) | >0 ⇒ Symptom 4; also compare `.total` vs distinct-id count |
| Is the API itself alive? | `curl -s https://comedycellar-api.mafz.al/api/health` | ok+timestamp ⇒ API GW + Lambda fine; look downstream |
| Empty day vs broken scrape? | Compare `/api/line-up?date=` for a known-busy date vs a known-dark date | Both empty ⇒ scraper; only dark date empty ⇒ legit `.no-shows` |
| Did crons actually write? | `pnpm db:studio` (root script; runs drizzle-kit under `sst shell` — needs AWS creds): `SELECT max(to_timestamp(timestamp)) FROM show;` and row counts before/after a cron window | Stale max after 6h+ on prod ⇒ Symptom 2 / Trap 1 |
| Missing-room silent failure? | `SELECT DISTINCT "roomId" FROM show;` vs roomIds in a live scrape response | roomId present upstream, absent in DB ⇒ Trap 3 |
| Which container am I seeing? | Compare `x-page-creation` values across failures in CloudWatch logs (axios errors log full request headers) | Same value across failures ⇒ one warm container ⇒ Trap 2 territory |
| Is a regression in git? | `git log --oneline -- <file>` then `git show <sha>` — note: local clone is SHALLOW, grafted at ~2024-10-11 (81 commits); older SHAs need GitHub | Pre-graft SHA fails locally — that is clone shape, not a bad reference |

Deeper measurement recipes (scripted probes with interpretation guides) belong to **cellar-diagnostics-toolkit**. Once a cause is confirmed, classify the fix and run the gates in **cellar-change-control** — no diagnostic finding, however confident, authorizes a direct prod change.

## Provenance and maintenance

Verified 2026-07-07 against the working tree at commit c8d9918 (branch claude/skill-library-continuity-4m3x56 == main) by reading: packages/core/{requester,parseLineUp,fetchLineUp,handleLineUp,handleShowDetails,handleShowList,getFutureDatesByDay,utils,email,createReservation}.ts, packages/core/models/{show,comic,room,act,comicNotification}.ts, packages/core/sql/{show,room,comic}.sql.ts, packages/functions/cron/{newShowCron,syncCron}.ts, packages/functions/{shows,settings}/index.ts, packages/functions/webhooks/clerk.ts, infra/{cron,api,config}.ts, packages/frontend/src/utils/api.ts, packages/frontend/src/pages/Comics/index.tsx, .github/workflows/frontend-ci.yml, package.json. Commands run: the Symptom-5 `node -e` proof (output as shown); `git show` on 953e0ef, 6c3da50, 64b3ee2 and existence checks on ebc8f5a a9a902b 42ab4ac b697c94 7ea6a4b 9ce39a1 2fd6b30 6192496 c8d9918 adafd66 70baa86 f8b6976 a9e371c d020632 6bf5945 dee1ae7 f95f295 741ca41; the Symptom-9 frontend gate sequence (all passed). Not locally verifiable (pre-graft, recovered from GitHub history by the discovery pass): 6886326 (Etc/GMT+5 DST fix), 122ccf5 (Sep-2024 header recovery).

| Volatile fact | Re-verify with |
|---|---|
| Cron schedules (6h / hourly) and IS_ACTIVE gating | `sed -n '1,28p' infra/cron.ts` |
| Guard lines in cron handlers | `grep -n "IS_ACTIVE" packages/functions/cron/*.ts` |
| `/api/shows/scan` still broken | Symptom-5 `node -e` block + `grep -n "fromTimestamp" packages/core/handleShowList.ts` |
| GROUP BY still missing in getShows | `sed -n '186,246p' packages/core/models/show.ts` (look for `groupBy`) |
| getNextPageParam guard intact | `grep -n -A5 getNextPageParam packages/frontend/src/pages/Comics/index.tsx` |
| roomDictionary contents | `sed -n '27,32p' packages/core/models/show.ts` |
| settings user-row guard still absent | `sed -n '30,52p' packages/functions/settings/index.ts` |
| Stage→Clerk issuer map entries | `cat infra/config.ts` |
| Email still admin-to-self only | `grep -n "to:" packages/core/email.ts` |
| CI still installs inside packages/frontend | `sed -n '40,45p' .github/workflows/frontend-ci.yml` |
| Prod API domain | `sed -n '6,13p' infra/api.ts` |
