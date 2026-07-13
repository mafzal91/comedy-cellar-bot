---
name: cellar-architecture-contract
description: Entry-point system map for comedy-cellar-bot - monorepo layout, SST resource graph, data flow, load-bearing design decisions with rationale, invariants whose violation is an incident, and known weak points with file:line. Use when new to this repo, when planning any change that spans packages/ or infra/, when asking "why is it built this way", or before touching scraping, stages, the shared database, crons, or the reservation path. Also the index to the 14 sibling cellar-* skills.
---

# Cellar Architecture Contract

comedy-cellar-bot scrapes comedycellar.com (the NYC comedy club) on a schedule, stores shows/comics/lineups in a shared Supabase Postgres, serves them via an AWS API, lets signed-in users mark comics for notification and opt into new-show announcements (show-announcement emails now ship to opted-in users as of 2026-07-13, #62 - shipped but unproven; comic-follow notifications are still never sent - open ambition), and can submit REAL seat reservations to the club's booking API. Solo-owner project (mafzal91), deployed with SST v3.

**When NOT to use this skill:** for step-by-step procedures go to the sibling that owns them - environment setup → `cellar-build-and-env`; running/deploying/logs → `cellar-run-and-operate`; scraper endpoint/parse details → `cellar-scraping-reference`; schema and migrations → `cellar-data-model`; debugging a live symptom → `cellar-debugging-playbook`; anything that changes behavior → `cellar-change-control` first.

## Map of the library (15 skills)

| Skill | Load when |
|---|---|
| cellar-architecture-contract | (this) system map, decisions, invariants, weak points |
| cellar-change-control | before ANY behavior-changing edit: change classes, gates, owner-approval list |
| cellar-debugging-playbook | live symptom → triage tables, traps, discriminating experiments |
| cellar-failure-archaeology | past investigations, dead ends, reverts (symptom→cause→evidence) |
| cellar-scraping-reference | comedycellar.com endpoints, parse contracts, anti-bot history, token anatomy |
| cellar-data-model | schema, id/upsert conventions, migrations, shared-DB discipline |
| cellar-config-and-secrets | SST secrets, stages, env flags, VITE_ chain, add-one checklists |
| cellar-build-and-env | from-scratch setup, the two-workspace trap, sandbox limitations |
| cellar-run-and-operate | sst dev/deploy anatomy, crons, logs, domains, ops runbook |
| cellar-frontend-design-system | vintage-marquee tokens, CONTRACT.md rules, Tailwind v4/Preact quirks |
| cellar-validation-and-qa | what counts as evidence, gates per change class, fixtures, adding tests |
| cellar-diagnostics-toolkit | measure-don't-eyeball recipes and probe scripts |
| cellar-scraper-recovery-campaign | decision-gated runbook for scraper outages (the flagship *risk*) |
| cellar-data-quality-campaign | decision-gated runbook for the known data-quality defects (the hardest *live* problem, owner-designated 2026-07-07) |
| cellar-frontier-and-method | ranked open problems, first steps, research discipline |

## 1. System map

### 1.1 Repo layout (pnpm monorepo, root `packageManager: pnpm@10.23.0`)

| Path | What it is | Workspace package? |
|---|---|---|
| `packages/core/` | All business logic: scraping, models, Drizzle SQL schema (`sql/*.sql.ts`), email | NO - plain directory |
| `packages/functions/` | Lambda handlers (API routes, crons, webhooks) | NO - plain directory |
| `packages/types/` | Shared TS types for the comedycellar.com API | NO - plain directory |
| `packages/__fixtures__/` | Captured real payloads (notably `createReservation.ts`, a real success response) | NO - plain directory |
| `packages/frontend/` | Preact 10 + Vite 7 + Tailwind v4 SPA | YES - and it is its OWN pnpm workspace root |
| `infra/` | SST v3 resource definitions (6 files: api, config, cron, email, frontend, secrets) | n/a |
| `migrations/` | Drizzle migrations 0000-0003 (0003 appended 2026-07-13 for the show-notification outbox; history re-baselined 2025-02-05, commit 8b3b837) | n/a |
| `plan/` | Historical design-handoff scaffolding for the 2026 re-skin (checked in, not live code) | n/a |

Two structural facts that trip everyone:

1. **Backend dirs are NOT packages.** `packages/core|functions|types|__fixtures__` have no `package.json` (verified: `ls packages/core/package.json` → No such file). SST/esbuild bundles each Lambda from source using root `tsconfig.json` path aliases `@core/* → ./packages/core/*` and `@customTypes/* → ./packages/types/*` (tsconfig.json:3-6). All backend deps live in root `package.json`.
2. **`packages/frontend` is a second, independent pnpm workspace root** (own `pnpm-workspace.yaml` + own `pnpm-lock.yaml`). The canonical explanation is the comment at `.github/workflows/frontend-ci.yml:40-43`: install from `packages/frontend`, "the repo root, whose lockfile is stale for frontend deps". Details and traps: `cellar-build-and-env`.

### 1.2 SST resource graph (as of 2026-07-13, HEAD 5ceaf98; unchanged since 2026-07-07/c8d9918 except the third cron)

SST is an infrastructure-as-code framework; `sst.config.ts` declares AWS resources in TypeScript. Its `run()` dynamically imports **every** file in `./infra/` (sst.config.ts:23-26) - drop a file in `infra/`, it deploys. Providers: home `aws`, plus `cloudflare` (DNS, creds from root `.env`) and `supabase` (sst.config.ts:9-16).

| Resource | Defined | Notes |
|---|---|---|
| `sst.aws.ApiGatewayV2 "Api"` | infra/api.ts:16 | prod domain `comedycellar-api.mafz.al` (Cloudflare zone b94d6748e8554bed2a3eae31cc65c81b) only when `$app.stage === "prod"` |
| JWT authorizer `myClerkAuthorizer` | infra/api.ts:20-26 | Clerk (hosted auth provider); issuer from infra/config.ts per stage. **Applied ONLY to GET+POST `/api/settings`** (api.ts:104-124); every other route is public |
| `sst.aws.Cron "Cron"` | infra/cron.ts:5-15 | `newShowCron.handler`, `cron(0 0/6 * * ? *)` = every 6h; discovers shows beyond the last known one |
| `sst.aws.Cron "SyncCron"` | infra/cron.ts:18-28 | `syncCron.handler`, `cron(0 0/1 * * ? *)` = hourly; refreshes TODAY only (syncCron.ts:68 iterates `[dates[0]]`) |
| `sst.aws.Cron "ShowNotificationCron"` | infra/cron.ts:31-41 | `showNotificationCron.handler`, `cron(0/15 * * * ? *)` = every 15 min; drains the `new_show_queue` outbox and emails show-announcement subscribers via `sendHtmlEmail` (added 2026-07-13, #62) |
| `sst.aws.StaticSite "Frontend"` | infra/frontend.ts:12-26 | prod domain `comedycellar.mafz.al`; build injects `VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY` |
| `sst.aws.Email "Email"` | infra/email.ts:3-8 | non-secret domain identity `mail.comedycellar.mafz.al`; the SES sender for all mail. Linked into all three crons + the `/sync-shows` and reservation routes (grants each Lambda SES IAM) |
| 5 × `sst.Secret` | infra/secrets.ts | AlertEmail, DbUrl, ClerkSigningSecret, ClerkSecretKey, ClerkPublishableKey (stored in AWS SSM; see `cellar-config-and-secrets`) |

Stages (an SST "stage" = a named deployment copy): `prod` and the owner's personal dev stage `mohammadafzal` - the ONLY keys in infra/config.ts:12-15. Any other stage name crashes at deploy (weak point 6 below).

```bash
# See the whole infra surface in one minute (read-only):
ls infra/ && grep -n "schedule" infra/cron.ts && grep -n "route(" infra/api.ts | head -20
```

### 1.3 Data flow in words

```
comedycellar.com  ──(scrape: 2 endpoints, serial + sleeps)──>  packages/core handlers
   │  POST /reservations/api/getShows   (JSON: show inventory per date)
   │  POST /lineup/api/                 (HTML fragment inside JSON: who performs)
   ▼
handleShowDetails / handleLineUp  ──(Drizzle upserts)──>  Supabase Postgres (ONE db, all stages)
   ▼                                                        tables: show, room, comic, act,
public API (API Gateway v2)                                 user, *_notification, comic_to_user,
                                                            new_show_queue (outbox, added #62)
   ├─ DB-backed:   GET /api/shows/new, GET /api/comics, GET /api/comics/{id}
   ├─ live-scrape: GET /api/shows?date=, GET /api/line-up?date=, GET /api/shows/{timestamp}
   │               (these also persist in the background, errors swallowed)
   ├─ auth'd:      GET+POST /api/settings (Clerk JWT) - notification preferences
   └─ booking:     POST /api/reservation/{timestamp} → validates → re-scrapes →
                   REAL booking on prod / fixture elsewhere → ops alert email to owner
   ▼
frontend SPA (Preact) fetches via VITE_API_URL; Clerk handles sign-in
```

Crons feed the DB; the DB feeds `/api/shows/new` and `/api/comics`; several routes still scrape live per request. A third cron (`ShowNotificationCron`, every 15 min) drains the `new_show_queue` outbox and emails show-announcement subscribers via `sendHtmlEmail` - the first outbound path to real end users (as of 2026-07-13, #62; unproven). Full route table and handler line numbers: `cellar-run-and-operate`; endpoint/parse contracts: `cellar-scraping-reference`.

## 2. Load-bearing design decisions (decision / why / consequence)

Do not "fix" any of these without reading its consequence and `cellar-change-control`.

1. **Comedy Cellar's numeric show id is the local primary key, and `show.timestamp` (unix seconds) is the public show identity.**
   Why: scraped show objects are inserted raw (`handleShowDetails.ts:13,22` passes `showsData?.shows` straight to `createShows`; conflict target is `show.id`, models/show.ts:169-179), and the club's own reservation URLs key on the epoch timestamp (`showid=` in URLs, show.ts:24-25, parseLineUp).
   Consequence: Postgres serial sequence never advances normally (ids come from upstream); lineup→show matching requires exactly one row per timestamp (`handleLineUp.ts:34`) even though there is NO unique index on timestamp (show.sql.ts:39 - plain `integer`). See invariant 4.

2. **`externalId = "<prefix>_" + cuid2` is the public API id convention** (common/createExternalId.ts:3-9; prefixes in common/constants.ts: user_, comic_, show_, room_, act_, show_notif_, comic_notif_).
   Why: never expose serial PKs or upstream ids in URLs.
   Consequence: routes type-check ids by prefix - but with unanchored substring regexes (weak point 8). Conventions live in `cellar-data-model`.

3. **One shared Supabase Postgres across ALL stages; only the `user` table is stage-partitioned.**
   Why: commit 741ca414 (2024-10-14) "Added stage field to users since db is shared across envs" - one club, one scraped dataset; running per-stage scrapes would double load on comedycellar.com.
   Consequence: show/comic/act/room rows written by a dev stage are read by prod. Every user query appends `eq(user.stage, SST_STAGE)` via `applyWhere` (models/user.ts:9-11). Any destructive DB work is prod surgery - see `cellar-data-model` and `cellar-change-control`.

4. **Serial scraping with sleeps is the anti-bot posture.** newShowCron sleeps 5s between days (newShowCron.ts:62); syncCron sleeps 7.5s and syncs one date per hourly run (syncCron.ts:68,88); retry is 3 attempts with growing delay (syncCron.ts:16-42).
   Why: comedycellar.com deployed an anti-bot check around Sep 2024 that silently broke the scraper for ~5 months (Dormancy #1 in git history; recovery commit 122ccf5 "fixed request headers", 2024-09-13 - recovered via GitHub API, local clone is shallow to 2024-10-11). Being slow and polite is the survival strategy.
   Consequence: never parallelize across dates, never remove sleeps. History and etiquette: `cellar-scraping-reference`; outage response: `cellar-scraper-recovery-campaign`.

5. **A captured browser header token keeps scraping alive.** `packages/core/requester.ts:12-13` hardcodes an `x-code-localize` header value copied from a real browser session (its base64 tail encodes a Sep-2024 timestamp and the owner's residential IP - do NOT reproduce the value anywhere).
   Why: this is what ended the 5-month outage.
   Consequence: single point of failure for ALL scraping AND real bookings (same axios instance). Treat any edit to requester.ts as a high-risk change; token anatomy in `cellar-scraping-reference`.

6. **An email to the owner's inbox is the telemetry channel; a second, user-facing email channel shipped 2026-07-13.** `sendEmail` (core/email.ts:8-29) sends FROM the bot's SES sender `notifications@mail.comedycellar.mafz.al` (FromAddress, email.ts:5) TO the owner's `AlertEmail` address (AlertRecipient, email.ts:6, used at email.ts:18) - the ops/telemetry channel (New/Sync Show Cron, `new reservation!`, Show Notification Cron failures). The `sendHtmlEmail` (core/email.ts:31-59) sends from the same `"Comedy Cellar Bot"` sender TO a recipient user - the first real user-facing channel (#62, as of 2026-07-13). Both coexist. Sentry init was removed 2024-10-14 (commit 56afdca) and remains commented out at packages/frontend/src/index.tsx:20-26 (@sentry/browser still a dep).
   Why: solo project; the owner's inbox is the dashboard.
   Consequence: telemetry still means an alert email to the owner's inbox, but "notifications" no longer means an owner-only email. Show-announcement subscribers ARE now emailed as of 2026-07-13: `ShowNotificationCron` reads `show_notification` via `getShowNotificationRecipients` (models/showNotification.ts:35-42) and sends via `sendHtmlEmail` - shipped but UNPROVEN (zero tests, no track record). `comic_notification` is still read by no code, so comic-follow notifications remain the flagship open ambition (`cellar-frontier-and-method`).

7. **Auth uses headless @clerk/clerk-js, not React bindings.** Lazy singleton dynamic-imports the SDK (frontend/src/utils/clerk.ts:6-9).
   Why: keeps the ~3MB Clerk chunk out of the main bundle.
   Consequence: no reactive auth state (useAuth resolves once on mount); Clerk widgets are mounted imperatively. Quirks: `cellar-frontend-design-system`.

8. **Nested pnpm workspace for the frontend** (decision 1.1.2 above). The CI comment at `.github/workflows/frontend-ci.yml:40-43` is the canonical statement - defer to it.
   Consequence: `pnpm install` must run at root AND inside packages/frontend; root lockfile's frontend entries are stale by design. `cellar-build-and-env` owns the checklist.

9. **Real booking is stage-gated in exactly one place.** `packages/core/createReservation.ts:10` - `if (process.env.STAGE === "prod")` POSTs to the club's live `addReservation` API; every other stage returns the captured fixture (`packages/__fixtures__/createReservation.ts`). `STAGE` is set ONLY on the reservation route (infra/api.ts:85-87); no other Lambda has it.
   Why: a dev-stage bug must never book real seats at a real club.
   Consequence: invariant 1. Never add `STAGE` to other resources casually; never bypass the gate "to test for real".

10. **Infra is auto-discovered.** Any file added to `infra/` is imported and deployed on next `sst deploy` (sst.config.ts:23-26).
    Consequence: there is no registration step to forget - and no review step either. New infra files ARE infra changes; gate them via `cellar-change-control`.

## 3. Invariants - violating any of these is an incident

| # | Invariant | Enforced at | Check command |
|---|---|---|---|
| 1 | Real reservations are created ONLY when `STAGE === "prod"`; all other stages return the fixture | packages/core/createReservation.ts:10-17; STAGE env only at infra/api.ts:85-87 | `grep -n 'STAGE === "prod"' packages/core/createReservation.ts` → line 10 |
| 2 | Scheduled crons no-op outside prod: infra sets `IS_ACTIVE = (stage==="prod")` and `IS_CRON="1"` on all three crons (infra/cron.ts:9-12,22-25,35-38); handlers early-return on `!IS_ACTIVE && IS_CRON` (newShowCron.ts:14-16, syncCron.ts:45-47, showNotificationCron.ts:21-22). Note the same syncCron handler on `GET /sync-shows` has NO env vars, so HTTP invocation always runs | infra/cron.ts + all three cron handlers | `grep -n "IS_ACTIVE" infra/cron.ts packages/functions/cron/*.ts` |
| 3 | Every `user`-table query goes through `applyWhere`, which appends `eq(user.stage, SST_STAGE)` | packages/core/models/user.ts:9-11 (all exported fns use it) | `grep -n "applyWhere" packages/core/models/user.ts` |
| 4 | `show.timestamp` is treated as a unique show identity (lookup: show.ts:254-256; act creation requires exactly 1 match: handleLineUp.ts:34) even though the DB has no unique index on it (show.sql.ts:39). Shows must only ever be written through `createShows`' upsert-on-id (show.ts:165-180) | convention, not schema | `grep -n "timestamp: integer" packages/core/sql/show.sql.ts` |
| 5 | Frontend colors come from theme tokens, never raw hex or stock Tailwind grays - "hardcoded colors won't flip in dark mode" | packages/frontend/src/components/ui/CONTRACT.md:17-18 (that file rules; defer to it) | read CONTRACT.md; enforcement recipes in `cellar-frontend-design-system` |
| 6 | Requests to comedycellar.com stay serial with sleeps between dates; never parallel-scrape, never hammer | newShowCron.ts:62 (5000ms), syncCron.ts:88 (7500ms), syncCron.ts:68 (one date/run) | `grep -n "sleep(" packages/functions/cron/*.ts` |

House rules layered on top (owner-set, non-negotiable; the incident evidence lives in `cellar-change-control`): prod deploys, secret rotation, and cron-schedule changes are owner-only decisions.

## 4. Known weak points (as of 2026-07-07)

Stated plainly so nobody rediscovers them the hard way. "Open" = known, unfixed, fix needs change-control. None of these may be fixed drive-by; each fix is a change class in `cellar-change-control`.

| # | Weak point | Evidence | Status |
|---|---|---|---|
| 1 | `GET /api/frontier` is an unauthenticated Frontier AIRLINES fare scraper (unrelated side project) exposed on the prod API domain - effectively an open proxy | infra/api.ts:47-49; packages/functions/frontier.ts | open |
| 2 | `GET /sync-shows` is public and unauthenticated; anyone can trigger a live scrape + DB write in any stage (no IS_CRON guard on the HTTP path) | infra/api.ts:38-41 | open |
| 3 | `/api/shows/new` returns N rows per show with N comics: `getShows`/`getShowsCount` inner-join act×comic with no GROUP BY/DISTINCT; shows with no acts (specials) are invisible; `total` counts act-rows | packages/core/models/show.ts:186-246 | open (fix runbook: `cellar-data-quality-campaign`) |
| 4 | `GET /api/shows/scan` always returns `[]`: `handleShowList({days})` calls `getFutureDatesByDay(days)` with no `fromTimestamp` → `new Date(undefined)` = Invalid Date → date-fns v4 `eachDayOfInterval` yields `[]` | core/handleShowList.ts:11; core/getFutureDatesByDay.ts:13,21,28 | open; fix runbook `cellar-data-quality-campaign` (crons unaffected - they always pass a timestamp) |
| 5 | Removal-policy stage mismatch: `sst.config.ts:8` checks `stage === "production"` but the real prod stage is `"prod"` → prod resources carry the "remove" policy | sst.config.ts:8 vs. package.json `deploy:prod` (`--stage=prod`) | open, latent |
| 6 | `infra/config.ts:17` exports `config[$app.stage]`; any stage other than `mohammadafzal`/`prod` gets `undefined` → deploy crashes at infra/api.ts:23. New dev stages need a config entry first | infra/config.ts:12-17 | open (see `cellar-config-and-secrets`) |
| 7 | `packages/core/database.ts:5` imports ITSELF as the Drizzle schema (`import * as schema from "./database"`), so all `relations()` declarations are inert and `db.query.*` relational queries would not work. Harmless today (only the query-builder is used) - a trap for anyone reaching for `db.query` | core/database.ts:5,9 | open trap |
| 8 | externalId type guards are unanchored substring regexes - `"show_comic_x"` passes the comic check; worse, models/user.ts:13-14 defines a function NAMED `isRoomExternalId` that checks USER_PREFIX | models/comic.ts:33, room.ts:8, show.ts:162, sql/user.sql.ts:56, models/user.ts:13-14 | open |
| 9 | Load-bearing typo: the secret object key is `clertPublishableKey` (infra/secrets.ts:10) and infra/frontend.ts:21 references it by that spelling. Renaming one side breaks deploy | infra/secrets.ts:10; infra/frontend.ts:21 | open - rename only as a coordinated change |
| 10 | A live Slack webhook URL sits in committed dead code (leftover from a removed side-project cron). Do not copy it anywhere; rotation is an owner decision | packages/core/slack.ts:3-9 (reference only - never reproduce the value) | open, secret-hygiene |
| 11 | Zero tests exist (`pnpm test` = failing placeholder, package.json:8); the ONLY CI is frontend lint/typecheck/build (.github/workflows/frontend-ci.yml, now GREEN since #63 declared @clerk/types, 2026-07-12 - there is still NO backend CI). Root `tsc --noEmit` fails without generated `.sst/` platform types, so there is no working backend typecheck gate in sandboxes | package.json:8; frontend-ci.yml | open, narrowed (see `cellar-validation-and-qa`) |
| 12 | Scraper responses are never runtime-validated (blind casts); a comedycellar.com redesign means TypeErrors or silently empty data, not alarms | e.g. fetchShows.ts, fetchLineUp.ts | open - the flagship live risk; see `cellar-scraper-recovery-campaign` |

## 5. Before you change anything

Any edit that changes behavior - code, infra, schema, schedules, secrets - must be classified and gated through **`cellar-change-control`**. In particular: prod deploys, secret rotation, cron-schedule changes, and anything touching `requester.ts`, `createReservation.ts`, or the shared DB are owner-approval territory. This skill tells you WHY the system is shaped this way; it never authorizes changing it.

## Provenance and maintenance

Verified 2026-07-07 against HEAD `c8d9918` (branch mirrors main) by reading: sst.config.ts, tsconfig.json, package.json, pnpm-workspace.yaml, all 5 infra/*.ts, packages/core/{createReservation,database,requester,email,handleShowDetails,handleLineUp,handleShowList,getFutureDatesByDay}.ts, packages/core/models/{show,user}.ts, packages/core/sql/{show,user}.sql.ts, packages/core/common/{constants,createExternalId}.ts, packages/functions/cron/{newShowCron,syncCron}.ts, packages/functions/{shows/index,reservation}.ts, packages/frontend/src/utils/clerk.ts, packages/frontend/src/index.tsx, packages/frontend/pnpm-workspace.yaml, .github/workflows/frontend-ci.yml, packages/frontend/src/components/ui/CONTRACT.md, .env.template; and running `git show 741ca41` / `git show 56afdca` / the grep commands quoted above. Commit 122ccf5 (Sep-2024 recovery) predates the shallow clone and is carried from git-archaeology (GitHub API) - labeled as such.

Reconciled 2026-07-13 against commit `5ceaf98` for two changes since c8d9918: (1) PR #63 made frontend CI GREEN by declaring `@clerk/types` in packages/frontend/package.json (weak point 11 narrowed); (2) PR #62 shipped show-announcement notifications end-to-end - migration 0003, the `new_show_queue` outbox (packages/core/{sql/newShowQueue.sql.ts,models/newShowQueue.ts}), a third cron `ShowNotificationCron`, `sendHtmlEmail`, and a react-email template (packages/core/emails/newShowsEmail.tsx). Re-read for this pass: infra/cron.ts, packages/core/email.ts, packages/core/models/{show,newShowQueue,showNotification}.ts, packages/core/handleShowDetails.ts, packages/functions/cron/showNotificationCron.ts, packages/frontend/package.json, migrations/. Comic-follow notifications remain unshipped (nothing reads `comic_notification`); show notifications are shipped but UNPROVEN (zero tests). Migration 0003 was a clean APPEND (not a re-baseline), which upholds the append-only rule in `cellar-data-model`.

Re-verification one-liners for facts most likely to drift:

| Fact | Command | Expected today |
|---|---|---|
| Booking gate intact | `grep -n 'STAGE === "prod"' packages/core/createReservation.ts` | line 10 |
| Cron schedules (now three) | `grep -n "schedule" infra/cron.ts` | `0 0/6 * * ? *` (line 14), `0 0/1 * * ? *` (line 27), `0/15 * * * ? *` (line 40) |
| Cron guards | `grep -n "IS_ACTIVE" infra/cron.ts packages/functions/cron/*.ts` | infra sets all three, all three handlers check |
| Migration count | `ls migrations/*.sql` | four: 0000-0003 (0003 appended 2026-07-13) |
| @clerk/types declared (CI-green fix #63) | `grep -n "@clerk/types" packages/frontend/package.json` | present, line 11 |
| User stage filter | `grep -n "applyWhere" packages/core/models/user.ts` | defined line 9, used in every query fn |
| Auth only on settings | `grep -n -A2 "auth:" infra/api.ts` | only the two `/api/settings` routes |
| Stage list | `grep -n "clerkFrontendApi" infra/config.ts` | mohammadafzal + prod only |
| Removal-policy mismatch still present | `grep -n "production" sst.config.ts` | line 8 |
| Secret inventory | `grep -n "sst.Secret" infra/secrets.ts` | 5 secrets, `clert` typo at line 10 |
| No timestamp unique index | `grep -n "timestamp: integer" packages/core/sql/show.sql.ts` | line 39, no `.unique()` |
| Still zero tests | `grep -n '"test"' package.json` | failing echo placeholder |
| Backend dirs still not packages | `ls packages/core/package.json` | No such file |
| Domains (volatile) | `grep -rn "mafz.al" infra/` | comedycellar-api.mafz.al (api.ts), comedycellar.mafz.al (frontend.ts) |
