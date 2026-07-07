---
name: cellar-diagnostics-toolkit
description: Measure-don't-eyeball diagnostic recipes and runnable probes for comedy-cellar-bot — check-api.sh and freshness-check.sh (read-only health/scraper canary against our own API), plus recipes for token staleness, offline fixture parsing, proving a library behavior with node -e, DB spot checks, log tailing, bundle size, and config-drift greps. Use when you need a NUMBER instead of a guess — "is the scraper still landing shows", "is the API up", "how old is the anti-bot token", "does this show up in prod", "how big is the bundle", "prove this function returns [] not throws" — or before/after any change when you want evidence rather than a hunch.
---

# cellar-diagnostics-toolkit

Runnable probes and copy-paste recipes that turn "I think it's broken" into a measured number. Every recipe is: **purpose -> exact command -> how to read the result**.

## When NOT to use this skill

- You already know the scraper is down and want the step-by-step recovery runbook -> **cellar-scraper-recovery-campaign**.
- You have a symptom and want a triage table pointing at a cause -> **cellar-debugging-playbook**.
- You want to know what a probe's endpoint/cron/log actually *means* -> **cellar-run-and-operate**.
- You want to know what evidence a PR needs to be considered "verified" -> **cellar-validation-and-qa**.

This skill is the measuring tape, not the diagnosis or the fix.

## House rule: probe OUR API, not the club

Every probe of **comedycellar.com itself** is a live hit on a real business's servers — keep those to a **single, polite, serial request** (never loops, never parallel; see cellar-scraping-reference for the politeness doctrine). You almost never need to: our own API (`https://comedycellar-api.mafz.al`, as of 2026-07-07) exposes the same freshness signal for free and with zero anti-bot risk. Reach for `check-api.sh` / `freshness-check.sh` first. Only parse a *saved* fixture offline (recipe 3) when you must inspect scrape shape — that hits nothing.

Two probes here make live network calls and were **syntax-verified in the skill sandbox (`bash -n` clean) but the sandbox blocks outbound network** — run them from an unrestricted machine.

---

## Recipe 1 — How stale is the anti-bot token?

**Purpose:** the scraper's `x-code-localize` header (packages/core/requester.ts:12-13) is a token captured from a real browser in Sep 2024. It is the single most likely thing to silently kill scraping (it caused the 5-month Sep-2024 outage). Measure its age; never print its value.

**Command** (owned by the recovery campaign — do not re-create it):
```bash
.claude/skills/cellar-scraper-recovery-campaign/scripts/token-age.sh
```

**Verified output (2026-07-07):**
```
x-code-localize captured: 2024-09-13 (unix 1726188037)
age: 662 days (~22 months)
STANDING ORDER TRIGGERED: token is older than 12 months.
Raise preventive recapture with the owner (Phase 2A of cellar-scraper-recovery-campaign).
```

**Interpret:** `> 12 months` trips the standing order — raise a **preventive** token recapture with the owner via cellar-scraper-recovery-campaign (Phase 2A). Do NOT recapture unilaterally (secret rotation is owner-only). The current value (~22 months) means the standing order is already live; the token still working is luck, not safety.

---

## Recipe 2 — Is the API up and is the scraper still landing shows?

**Purpose:** one command to confirm (a) the API answers, (b) fresh show data is being persisted, (c) the comic catalog is non-empty. This is the fastest "is anything on fire" check.

**Commands** (new, shipped in this skill; run from an unrestricted machine):
```bash
# full green/red readout of health + freshness + comic count
.claude/skills/cellar-diagnostics-toolkit/scripts/check-api.sh

# just the scraper canary; exits nonzero when stale — cron/CI friendly
.claude/skills/cellar-diagnostics-toolkit/scripts/freshness-check.sh
```
Both default to prod (`https://comedycellar-api.mafz.al`). Override the base URL with `$1` or `CC_API_BASE`; `freshness-check.sh` also takes a day-threshold as `$2` or `CC_FRESH_DAYS` (default 7).

`check-api.sh` prints one verdict line per check, e.g.:
```
health:    OK (ok)
freshness: OK newest show 2026-07-24 (~+17d ahead)
comics:    OK total=1843
```

**Interpretation guide** — anchored to the two crons (verified against infra/cron.ts:13,26 on 2026-07-07):

| Cron | Schedule | Job |
|---|---|---|
| `Cron` (newShowCron) | `cron(0 0/6 * * ? *)` = every 6h | walks the date horizon forward, discovering shows that were just announced |
| `SyncCron` (syncCron) | `cron(0 0/1 * * ? *)` = hourly | refreshes **today's** inventory only |

Because shows are announced **ahead of time** and newShowCron pushes the horizon out every 6h, the newest persisted show should normally sit **days-to-weeks in the FUTURE**. So:

| Observation | Meaning |
|---|---|
| `freshness: OK ... +Nd ahead` (N a week or more) | healthy — both the show-inventory scrape and the lineup scrape are landing (see note below) |
| newest show only **a day or two** ahead | soft warning — horizon has stopped advancing; newShowCron may be erroring. Check logs (recipe 6), then cellar-scraper-recovery-campaign |
| `freshness: STALE ... in the PAST` | **alarm** — no new shows are landing; scraper is down |
| `freshness: EMPTY total=0` or `comics: EMPTY total=0` | **alarm** — either the DB was wiped, or nothing has ever scraped (bootstrap state). See cellar-data-model for seeding |
| `health: UNREACHABLE` | API/domain/Lambda problem, not necessarily the scraper — see cellar-run-and-operate |

Note: `/api/shows/new` is DB-backed (no live scrape) and inner-joins acts, so it only surfaces shows that have **at least one comic**. That makes a fresh future timestamp strong evidence that **both** `handleShowDetails` (show rows) **and** `handleLineUp` (act rows) are succeeding — but it also means actless "special" shows are invisible here and a show with N comics is counted N times in `total` (cellar-data-model §13). Treat `total` as an act-row count, not a distinct-show count.

**When a check goes red:** cellar-scraper-recovery-campaign (recovery runbook) and cellar-debugging-playbook (broader symptom triage).

---

## Recipe 3 — Parse a saved lineup fixture offline (no network)

**Purpose:** decide whether empty/garbage scrape output is the *site* changing or *our parser* breaking — without touching comedycellar.com. Runs the **real** `packages/core/parseLineUp.ts` against a saved response.

**Command** (owned by the recovery campaign — do not re-create it):
```bash
# arg is either the raw JSON body of POST /lineup/api/, or a bare HTML fragment
.claude/skills/cellar-scraper-recovery-campaign/scripts/local-parse-lineup.sh <saved-response.json>
```
It prints parsed shows as JSON on stdout and a one-line summary on stderr:
```
shows=N acts=N named-acts=N with-timestamp=N
```

**Interpret:**

| Summary on a fixture that visibly has shows/acts | Meaning |
|---|---|
| `shows=0` | the fragment matched `.no-shows`, or the `.lineup` CSS class changed — **HTML drift** |
| `shows>0` but `named-acts=0` | the `.set-content` / `.name` selectors drifted — parser can't read names (see the parse contract in cellar-scraping-reference) |
| `with-timestamp` < `shows` | some shows lack a `showid=` reservation link -> their acts get silently skipped downstream (cellar-data-model) |
| numbers match what you see in the fixture | parser is fine; the problem is upstream (fetch/anti-bot) — go to recipe 1 and cellar-scraper-recovery-campaign |

You need a fixture to feed it. There is no committed lineup fixture; capture one during a recovery session (cellar-scraper-recovery-campaign documents how) and keep it under your scratchpad, not in the repo.

---

## Recipe 4 — Prove a library behavior with `node -e` (don't guess)

**Purpose:** when a bug hinges on "what does this library actually do at this version," run it against the repo's own `node_modules` instead of reasoning from memory. This is the template for every "prove it, don't eyeball it" moment.

**Worked example — the `getFutureDatesByDay(undefined)` bug.** `getFutureDatesByDay` (packages/core/getFutureDatesByDay.ts:11-41) does `new Date(fromTimestamp)`; called with no timestamp that is `new Date(undefined)` = **Invalid Date**. The question: does date-fns v4's `eachDayOfInterval` throw, or return `[]`? Measure it:

```bash
cd /home/user/comedy-cellar-bot
node -e '
const { startOfDay, addDays, eachDayOfInterval } = require("date-fns");
const d = new Date(undefined);            // what getFutureDatesByDay(1) with no fromTimestamp builds
const start = startOfDay(d);
const end = addDays(start, 1);
const days = eachDayOfInterval({ start, end });
console.log("start:", start.toString());
console.log("interval days:", JSON.stringify(days), "length =", days.length);
'
```

**Verified output (2026-07-07, node v22, date-fns v4 from repo node_modules):**
```
start: Invalid Date
interval days: [] length = 0
```

**Interpret:** it returns `[]`, it does not throw. That is *why* `GET /api/shows/scan` and the orphaned `functions/list.ts` silently return `[]` — they call the date helper without a timestamp, get zero dates, and iterate nothing. The crons are unaffected because they always pass a real timestamp. The lesson: a one-liner against the actual installed version settled in seconds what could have been an hour of arguing about whether date-fns throws on invalid intervals. Use this pattern (repo `node_modules`, real version, print the result) any time a claim about a dependency is load-bearing.

---

## Recipe 5 — DB row counts / spot checks (needs AWS)

**Purpose:** confirm what is actually in the shared Supabase DB (e.g. is a show row present, are there duplicate comics). Needs AWS credentials **and** resolves a stage's `DbUrl` secret via SST.

**Command shapes** (verified against package.json:12-13 scripts; **not runnable in this sandbox** — no AWS creds, and `sst install` can't fetch pulumi here):
```bash
pnpm db          # = sst shell drizzle-kit         (drizzle-kit CLI with DbUrl injected)
pnpm db:studio   # = sst shell drizzle-kit studio   (Drizzle Studio browser GUI to eyeball rows)
```
`sst shell <cmd>` injects the linked `Resource.DbUrl` into the child process, so any DB tool run under it points at that stage's database.

**Interpret / caution:** the DB is **shared across all stages** (cellar-data-model, cellar-config-and-secrets). Scraped tables (show/comic/act/room) are NOT stage-partitioned — a query or edit here reads/writes the same rows prod uses. Treat any write as prod surgery. For read-only counts, `pnpm db:studio` (visual) is the safe default; raw SQL requires psql against the `DbUrl` secret and is prod-touching. Do not run destructive DB work outside an owner-approved change (cellar-change-control).

---

## Recipe 6 — Tail a deployed Lambda's logs (needs AWS)

**Purpose:** when a probe is red, read the actual Lambda error (e.g. newShowCron throwing, or an axios anti-bot failure).

**Command shape** (needs AWS creds; **unverified here** — no creds, mark before relying on exact flags):
```bash
aws logs tail /aws/lambda/<function-name> --since 1h --follow
# discover the function name (SST-generated, e.g. comedy-cellar-bot-prod-Cron...):
aws lambda list-functions --query "Functions[?contains(FunctionName, 'comedy-cellar')].FunctionName"
```

**Interpret:** for exactly which log groups exist, how SST names the cron/API Lambdas, and how to read the admin self-emails that double as telemetry, see **cellar-run-and-operate** (the operations home for logs). This repo has **no structured logging or monitoring** beyond raw `console.log(error)` and admin-to-self emails, so expect large raw axios error dumps.

---

## Recipe 7 — Measure frontend bundle size

**Purpose:** confirm the build still produces a sane bundle and see what's fat (the Clerk chunk dominates).

**Commands** (run in the frontend workspace):
```bash
cd packages/frontend
pnpm build                    # vite build; prints per-chunk sizes
pnpm exec vite-bundle-visualizer   # treemap of the bundle (opens in a browser)
```
`vite-bundle-visualizer` is a declared frontend devDep (verified packages/frontend/package.json:33; binary present at `packages/frontend/node_modules/.bin/vite-bundle-visualizer`), so no `pnpm dlx` / network fetch is needed — it runs offline against installed deps.

**Interpret:** `pnpm build` emitting a `> 500 kB` warning for the Clerk chunk (~3 MB, as of 2026-07-07) is **NORMAL** and expected — Clerk is intentionally dynamic-imported to keep it out of the main entry (src/utils/clerk.ts). A *new* fat chunk, or the main entry ballooning, is the signal to investigate. The build succeeding (~10s) with only that warning is the green state (cellar-validation-and-qa owns the full frontend gate protocol).

---

## Recipe 8 — Config-drift greps

**Purpose:** cheap greps that catch known-fragile config the moment someone half-renames it.

```bash
cd /home/user/comedy-cellar-bot

# The load-bearing TYPO: the secret object key is misspelled `clertPublishableKey`
# and infra/frontend.ts reads it by that exact misspelling. Both sides must match.
grep -rn "clertPublishableKey" infra/          # expect EXACTLY 2 hits:
                                               #   infra/secrets.ts:11  (definition)
                                               #   infra/frontend.ts:21 (consumer)

# The frozen anti-bot header is still hardcoded in the requester (count only —
# never print the line; it contains the token + an IP).
grep -c "x-code-localize" packages/core/requester.ts   # expect 1
```

**Interpret:**
- `clertPublishableKey` hits `!= 2` -> someone renamed one side of the typo; the frontend `VITE_CLERK_PUBLISHABLE_KEY` will deploy empty and auth breaks. Both sides must be renamed together (cellar-config-and-secrets, cellar-change-control). Verified 2 hits on 2026-07-07.
- `x-code-localize` count `0` -> the hardcoded token was removed/changed; re-run recipe 1's `token-age.sh` (it will error if the format changed) and consult cellar-scraping-reference. Verified count 1 on 2026-07-07.

---

## Provenance and maintenance

**Authored/verified 2026-07-07** against repo at branch `claude/skill-library-continuity-4m3x56` (== main).

Verified by running here (node v22.22.2, pnpm 10.23.0, root deps installed):
- `token-age.sh` -> exact output pasted in recipe 1 (662 days / ~22 months / standing order triggered).
- Recipe 4 `node -e` one-liner -> exact output pasted (`start: Invalid Date` / `[] length = 0`).
- Config-drift greps (recipe 8) -> `clertPublishableKey` = 2 hits (infra/secrets.ts:11, infra/frontend.ts:21); `x-code-localize` = 1.
- Cron schedules read from infra/cron.ts:13,26; API envelope shapes read from packages/functions/shows/index.ts:176-184, comics/index.ts:60-68, health.ts.
- `check-api.sh` / `freshness-check.sh` -> `bash -n` clean; JSON/date logic offline-simulated for future/past/empty cases (all correct). Live network paths **not** exercised (sandbox blocks egress).

Recipes 5 and 6 need AWS credentials and are **not** runnable in a restricted sandbox (also `sst install` can't fetch pulumi here — HTTP 403); their command *shapes* are verified against package.json, but exact `aws logs` flags are unverified.

Re-verify when things drift:

| Fact | Command | Expected (2026-07-07) |
|---|---|---|
| Token age (grows daily) | `.claude/skills/cellar-scraper-recovery-campaign/scripts/token-age.sh` | capture 2024-09-13; age keeps climbing; standing order stays triggered |
| Cron cadence | `grep -n "schedule" infra/cron.ts` | `cron(0 0/6 * * ? *)` and `cron(0 0/1 * * ? *)` |
| bundle-visualizer is a devDep | `grep -n "vite-bundle-visualizer" packages/frontend/package.json` | one hit under devDependencies |
| clert typo intact on both sides | `grep -rn "clertPublishableKey" infra/` | 2 hits (secrets.ts:11, frontend.ts:21) |
| Anti-bot header still hardcoded | `grep -c "x-code-localize" packages/core/requester.ts` | 1 |
| date-fns invalid-interval behavior | recipe 4 one-liner | `[] length = 0` |
| API response envelopes unchanged | read shows/index.ts `listShowsLocal`, comics/index.ts `list` | body `{results, offset, limit, total}`; show results carry `timestamp` (unix seconds) |
| Live API freshness (needs network) | `scripts/check-api.sh` from an unrestricted machine | health OK; newest show days-to-weeks ahead; comics total > 0 |
