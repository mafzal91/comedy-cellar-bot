---
name: cellar-run-and-operate
description: Operations runbook for comedy-cellar-bot - what sst dev / pnpm deploy:prod actually do, the prod topology (comedycellar.mafz.al domains, crons, Supabase), the two cron jobs' real behavior, the admin-email telemetry decoder, log access, DB ops commands, and health checks. Use when running the app locally with sst dev, deploying or removing a stage, interpreting a "New Show Cron" / "Sync Show Cron" / "new reservation!" email, wondering whether a cron actually ran, triggering a manual sync, or looking for logs of a deployed Lambda.
---

# Running and operating comedy-cellar-bot

Imperative runbook for a deployed system you did not build. Everything here was
re-verified against the repo on 2026-07-07 (HEAD 0f277a2).

**When NOT to use this skill:** setting up a fresh machine/sandbox (node, pnpm,
the two-workspace trap) → `cellar-build-and-env`. Diagnosing a live misbehavior
(empty listings, crons silent, 500s) → `cellar-debugging-playbook`. Secrets,
stages, env flags → `cellar-config-and-secrets`. Migrations and DB schema →
`cellar-data-model`. Whether you're *allowed* to do an operation →
`cellar-change-control`. Scraper outage → `cellar-scraper-recovery-campaign`.

Jargon used throughout:
- **SST** — the infrastructure framework (v3, `sst` in root package.json:31, `^3.17.25` as of 2026-07-07). Reads `sst.config.ts`, which dynamically imports every file in `infra/` (sst.config.ts:19-28), and deploys AWS Lambda functions, an API Gateway, crons, and a static site.
- **Stage** — a named copy of the whole infrastructure (SST's environment concept). This repo has two: `prod` and the owner's personal dev stage `mohammadafzal` (infra/config.ts:5-17).
- **Live mode** — `sst dev` runs Lambda code on YOUR machine while real AWS resources proxy requests to it; edits hot-reload without redeploying.
- **Cron** — an AWS EventBridge scheduled Lambda (`sst.aws.Cron`, infra/cron.ts).

## 1. `pnpm dev` (sst dev) anatomy

`pnpm dev` at repo root runs `sst dev` (package.json:9). Requires AWS
credentials + root `.env` with Cloudflare creds (see `.env.template`); it does
NOT work in a credential-less sandbox (`cellar-build-and-env`).

What actually happens:

| Piece | Behavior under `sst dev` |
|---|---|
| Stage | Defaults to your local username. **Must have a key in infra/config.ts** or deploy crashes at infra/config.ts:17 (`config[$app.stage]` undefined → infra/api.ts:22 reads `.clerkFrontendApi` of undefined). Fix per `cellar-config-and-secrets` before first run. |
| API Lambdas | Deployed to your personal stage in Live mode — requests hit a real API Gateway URL, code executes locally. |
| Crons | **Deployed to your stage too** (infra/cron.ts creates them unconditionally) but scheduled runs no-op outside prod: handlers get `IS_ACTIVE = ($app.stage === "prod" ? "1" : "0")` and `IS_CRON = "1"` (infra/cron.ts:8-11,21-24) and return early when `!IS_ACTIVE && IS_CRON` (newShowCron.ts:14-16, syncCron.ts:45-47). |
| Frontend (StaticSite) | NOT deployed. `sst dev` instead runs the site's dev script — `packages/frontend/package.json:5` is `"dev": "sst dev vite"` — starting vite locally with `VITE_API_URL` etc. injected from your stage (infra/frontend.ts:18-24). |
| Output | A terminal multiplexer: panes for function logs (streamed live), the vite dev server, and deploy status. |
| Secrets | Your stage needs its own copies: `sst secret set DbUrl <value>` etc. (six secrets, infra/secrets.ts; list in root `.env.template`). Missing secrets → linked Lambdas fail at `Resource.X.value`. |

To run the frontend WITHOUT SST/AWS at all:
`cd packages/frontend && cp .env.template .env.local` (fill in values, e.g.
prod API URL) then `npx vite` — documented in
packages/frontend/.env.template:1-7. Read-only against whatever API you point
it at.

**Danger even in dev:** your personal stage shares the ONE Supabase database
with prod (scraped tables are not stage-partitioned — `cellar-data-model`),
and `GET /sync-shows` + the reservation route are live in your stage (§4, §5).
Dev-stage reservations return a fixture, not a real booking
(packages/core/createReservation.ts:10-17 gates the real POST on
`process.env.STAGE === "prod"`) — never change that gate; see
`cellar-change-control`.

## 2. Deploy runbook (prod) — OWNER-ONLY

Prod deploys are an owner-only decision (`cellar-change-control`). There is no
CI deploy; the only path is manual, from a machine with AWS credentials and a
filled root `.env`:

```bash
pnpm deploy:prod        # = sst deploy --stage=prod   (package.json:10)
```

What it does, in order:
1. Bundles each `packages/functions/` handler with esbuild into its own Lambda (backend dirs are plain folders, not workspace packages — `cellar-build-and-env`).
2. Builds the frontend: runs `npm run build` in packages/frontend with `VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_REGION` injected (infra/frontend.ts:12-24), output `dist/`, uploaded as the StaticSite.
3. Creates/updates API Gateway routes (infra/api.ts), the two crons (infra/cron.ts), the Clerk JWT authorizer.
4. Syncs Cloudflare DNS for the prod custom domains (zone id in infra/api.ts:10 and infra/frontend.ts:8; creds from root `.env` CLOUDFLARE_API_TOKEN/CLOUDFLARE_EMAIL, sst.config.ts:11-14).

Pre-deploy checklist (gates detail in `cellar-validation-and-qa`):
- [ ] Owner approved the deploy (`cellar-change-control`).
- [ ] Frontend gates pass: `cd packages/frontend && pnpm exec eslint src && pnpm exec tsc --noEmit && pnpm build`.
- [ ] No pending migration you haven't already applied (deploy does NOT run migrations — `cellar-data-model`).
- [ ] You did not touch cron schedules, secrets, or createReservation.ts without owner sign-off.

### `pnpm remove:prod` — DANGEROUS, effectively never run this

`pnpm remove:prod` = `sst remove --stage=prod` (package.json:11): tears down
the prod stack. **Prod is NOT retain-protected**: sst.config.ts:8 sets
`removal: input?.stage === "production" ? "retain" : "remove"`, but the real
prod stage is named `"prod"`, so prod resources carry the "remove" policy —
`sst remove` will actually delete them (verified mismatch; also flagged in
`cellar-architecture-contract`). The Supabase DB lives outside the stack and
survives, but domains, API, crons, and site go down. Owner-only, and only with
a written reason.

## 3. Production topology (as of 2026-07-07)

| Thing | Value | Source |
|---|---|---|
| Site | https://comedycellar.mafz.al | infra/frontend.ts:6 (prod only) |
| API | https://comedycellar-api.mafz.al | infra/api.ts:8 (prod only) |
| Clerk (auth) issuer | https://clerk.comedycellar.mafz.al | infra/config.ts:9 |
| DNS | Cloudflare zone `b94d6748e8554bed2a3eae31cc65c81b` | infra/api.ts:10, infra/frontend.ts:8 |
| Database | Supabase Postgres, connection string in the `DbUrl` SST secret; ONE database shared by all stages | infra/secrets.ts:6; `cellar-data-model` |
| Email | Gmail SMTP, creds in `FromEmail`/`FromEmailPw` secrets; all mail is admin-to-self | packages/core/email.ts:13-26 |
| Compute | One Lambda per API route + two cron Lambdas; API Gateway V2 | infra/api.ts, infra/cron.ts |
| Non-prod stages | Same resources minus custom domains (auto-generated API GW URL), crons no-op'd | infra/api.ts:16, infra/frontend.ts:25 |

Full route table and auth surface live in `cellar-architecture-contract`; do
not duplicate it here.

## 4. The crons, operationally (schedules as of 2026-07-07)

Both defined in infra/cron.ts; both link DbUrl + email secrets. AWS cron
expressions run in **UTC**.

### Cron ("newShowCron") — discovers future shows
- Schedule: `cron(0 0/6 * * ? *)` = every 6 hours at :00 (00/06/12/18 UTC) (infra/cron.ts:13).
- Behavior (packages/functions/cron/newShowCron.ts:17-64): reads the last known show from the DB, then walks forward one day at a time past it; for each day with shows it persists them, emails the admin ("New Show Cron", the day's shows as JSON), fetches the lineup, sleeps 5s, continues; **stops at the first empty day**. Loop has no upper bound.
- Serial + sleeping is deliberate politeness to comedycellar.com — never parallelize (`cellar-scraping-reference`, `cellar-change-control`).
- Crashes if the show table is empty (`getLastShow()` destructured at newShowCron.ts:17) — bootstrap procedure in `cellar-data-model`.

### SyncCron — refreshes TODAY's inventory
- Schedule: `cron(0 0/1 * * ? *)` = hourly at :00 (infra/cron.ts:26).
- Behavior (syncCron.ts:44-99): computes a full today→last-show date range, **then iterates only `[dates[0]]` (syncCron.ts:68) — it syncs TODAY only; the range computation is dead code** (deliberately narrowed in commit adafd66, 2024-11-24). Runs show-details + lineup fetch in parallel `Promise.allSettled`, each wrapped in `withRetry` (3 attempts; the sleep runs only `if (attempt < maxRetries)`, so inter-attempt delays are 5s then 10s and the 3rd attempt throws without sleeping — linear despite the "exponential" comment, syncCron.ts:16-42), sleeps 7.5s.
- Emails admin ONLY on failure ("Sync Show Cron" + message + stack, syncCron.ts:90-97). **Success is silent** — no email and no dashboard; absence of failure emails is the only "healthy" signal.
- Changing either schedule is an owner-only decision (`cellar-change-control`).

### Manual trigger: GET /sync-shows — public, flag as weak point
The syncCron handler is ALSO routed as `GET /sync-shows` (infra/api.ts:37-40),
with no auth and — critically — no `IS_CRON`/`IS_ACTIVE` env on the route, so
the early-return guard never fires: **anyone on the internet can force a sync,
in ANY stage** (a dev-stage hit still scrapes comedycellar.com and writes to
the shared DB). Use it yourself sparingly, serially:

```bash
curl -s https://comedycellar-api.mafz.al/sync-shows
```

Expect `{}` after ~10-30s (fetch + 7.5s sleep). A failure emails the admin the
same "Sync Show Cron" mail as a scheduled failure — so that subject does not
prove the *cron* ran. Locking this route down is a known open item
(`cellar-frontier-and-method`); doing so is a behavior change → gates in
`cellar-change-control`.

## 5. Email-as-telemetry decoder

There is no monitoring stack (Sentry was removed 2024-10-14, commit 56afdca).
Telemetry = self-addressed Gmail: `sendEmail` sends from AND to `FromEmail`
(packages/core/email.ts:21-26). End users have NEVER been emailed — the
notification tables exist but nothing fires them (`cellar-architecture-contract`).

| Subject | Meaning | Body | Caveats |
|---|---|---|---|
| `New Show Cron` | newShowCron found a day (beyond the previous horizon) that has shows | Execution time + that day's shows as pretty-printed JSON (newShowCron.ts:43-54) | One email per newly discovered day, every 6h run. If the DB write silently failed (handleShowDetails.ts:25-28 swallows), the SAME day re-emails every 6 hours — a repeating identical email is a symptom, see `cellar-debugging-playbook`. |
| `Sync Show Cron` | A sync FAILED (all 3 retries exhausted on either fetch) | Error message + stack trace (syncCron.ts:90-96) | Sent on failure only. Could be the hourly cron OR anyone hitting public GET /sync-shows. Silence = success (or the cron is dead — discriminate via logs, §6). |
| `Comedy Cellar: new reservation!` | Someone submitted POST /api/reservation/{ts} successfully | **Full guest PII** (name, email, phone, party size) as JSON (functions/reservation.ts:91-94) | Fires from ANY stage (route deploys everywhere); only prod actually booked a real seat — dev stages returned the fixture. Email failure is swallowed, so no email ≠ no reservation. |

No other emails exist in the codebase (the only `sendEmail` call sites are the
three above, verified by grep on 2026-07-07).

## 6. Logs

- **Local (`sst dev`)**: function logs stream live in the multiplexer pane. This is the best debugging surface — use it before poking prod.
- **Deployed**: each Lambda writes to its own CloudWatch Logs group (`/aws/lambda/<function-name>`). Logging is bare `console.log`/`console.error` — no structure, no request IDs (e.g. newShowCron.ts:40, syncCron.ts:69). newShowCron logs a NY-timezone timestamp + "Cron Data" per day; syncCron logs `fetching <date>`.
- **AWS CLI recipe** (needs AWS credentials; command shape verified against AWS CLI docs, not runnable in this sandbox — resolve the real function names first, SST generates them with random suffixes):

```bash
# Find the log groups (names contain the app + stage + logical id):
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/comedy-cellar-bot-prod \
  --query 'logGroups[].logGroupName'

# Tail one (aws cli v2):
aws logs tail <log-group-name> --since 6h --follow
```

- **"Did the cron actually run?"**: check the newShowCron log group for an invocation every 6h. An invocation that logs nothing after start = the `IS_ACTIVE` guard returned early (wrong stage/env — `cellar-config-and-secrets`). No invocations at all = infra problem. Full triage in `cellar-debugging-playbook`.

## 7. DB ops

`drizzle-kit` (the schema/migration CLI) runs under `sst shell`, which injects
the linked `DbUrl` secret for the chosen stage (drizzle.config.ts:8-10 reads
`Resource.DbUrl.value`):

```bash
pnpm db generate     # = sst shell drizzle-kit generate  (package.json:12)
pnpm db migrate      # apply committed migrations
pnpm db:studio       # = sst shell drizzle-kit studio — browser DB UI (package.json:13)
```

- Stage: `pnpm db ...` uses the default stage (your username). To be explicit: `sst shell --stage=prod drizzle-kit migrate` — but remember `DbUrl` has historically pointed at the SAME Supabase database for every stage, so **any migrate/studio session is effectively prod surgery** regardless of stage flag. Discipline, workflow, and the migration-reset history live in `cellar-data-model`; approval rules in `cellar-change-control`.
- These commands need AWS creds (to read the secret) — they fail in a credential-less sandbox (`cellar-build-and-env`).

## 8. Health checks

```bash
curl -s https://comedycellar-api.mafz.al/            # -> {"message":"ok"}                    (functions/index.ts)
curl -s https://comedycellar-api.mafz.al/api/health   # -> {"message":"ok","timestamp":<ms>}  (functions/health.ts)
```

Both public, no DB access — they prove API Gateway + Lambda are alive, NOT
that scraping or the DB works. For a deeper probe use
`GET /api/shows/new?limit=1` (DB-backed) — interpretation in
`cellar-diagnostics-toolkit`.

## 9. Artifact conventions

| Path | Status | Notes |
|---|---|---|
| `.sst/` | Generated, gitignored (.gitignore:5) | Platform types + state; created by any sst command; cannot be generated in sandboxes that block the pulumi download (`cellar-build-and-env`) |
| `packages/frontend/dist/` | Generated, gitignored (packages/frontend/.gitignore) | vite build output; what StaticSite uploads |
| `migrations/` | **Committed** (0000-0002 as of 2026-07-07) | Never hand-edit; workflow in `cellar-data-model` |
| Root `.env` | Local-only, never committed | Cloudflare creds only; template committed as `.env.template` |
| `packages/frontend/src/sst-env.d.ts` | Generated by SST, committed, eslint-ignored | Types the 5 injected VITE_/CLERK_ env keys |

## 10. Cost surface (UNVERIFIED estimates — no billing access from this repo)

Traffic is tiny (one hourly + one 6-hourly cron, a personal-project site).
Expectation, unverified: Lambda, API Gateway, EventBridge, and CloudWatch all
sit inside or near AWS free tiers; Supabase on its free tier; Cloudflare DNS
free; Gmail free; the paid-ish items would be Route-less custom-domain
certs (free via ACM) and S3/CloudFront pennies. If a bill spikes, first
suspects: someone hammering the public `GET /sync-shows` or
`GET /api/frontier` routes (both unauthenticated and expensive per hit) —
check CloudWatch invocation counts before anything else.

## Anything that changes behavior

Deploys, cron-schedule edits, secret rotation, removing stages, locking down
public routes, touching the reservation gate — all classified and gated in
`cellar-change-control`. This skill tells you HOW operations work; that one
tells you WHETHER and WITH WHOSE approval.

## Provenance and maintenance

Verified 2026-07-07 against HEAD `0f277a2` (branch claude/skill-library-continuity-4m3x56)
by reading: package.json, sst.config.ts, infra/{api,config,cron,frontend,secrets}.ts,
packages/functions/cron/{newShowCron,syncCron}.ts, packages/functions/{index,health,reservation}.ts,
packages/core/{email,createReservation,handleShowDetails}.ts, drizzle.config.ts,
.env.template, packages/frontend/{package.json,.env.template,.gitignore}, .gitignore,
migrations/ listing. `sst dev`/`sst deploy` and `aws logs` behavior could not be
executed in this sandbox (no AWS creds; pulumi download blocked); those flows are
labeled by source above. Discovery-report claims were independently re-read in the
files cited.

| Volatile fact | Re-verify with |
|---|---|
| Root scripts (dev/deploy/remove/db) | `grep -A8 '"scripts"' package.json` |
| Cron schedules | `grep schedule: infra/cron.ts` |
| IS_ACTIVE/IS_CRON wiring | `grep -n 'IS_' infra/cron.ts packages/functions/cron/*.ts` |
| Prod domains + Cloudflare zone | `grep -rn 'mafz.al\|zone:' infra/` |
| Removal-policy mismatch | `grep -n removal sst.config.ts` (fixed when it checks `"prod"`) |
| /sync-shows still public/env-less | `grep -n -A3 'sync-shows' infra/api.ts` |
| Email subjects + recipient | `grep -rn 'subject:' packages/functions/ packages/core/` and `grep -n 'to:' packages/core/email.ts` |
| syncCron still today-only | `grep -n 'dates\[0\]' packages/functions/cron/syncCron.ts` |
| SST version | `grep '"sst"' package.json` |
| Migration count | `ls migrations/*.sql` |
