---
name: cellar-validation-and-qa
description: What counts as evidence before claiming a change to comedy-cellar-bot works - the honest state of testing (zero automated tests, no backend CI, frontend CI green since PR #63), the frontend gate runbook with its two known traps, manual backend verification protocols per change class, the fixture inventory, quantified acceptance criteria, and a CANDIDATE plan for adding a test harness. Use when about to claim "this works" or "tests pass", when asked to verify or QA a change, when deciding what proof a PR needs, when CI fails on tsc/@clerk/types or dist/assets errors, or when someone proposes adding tests.
---

# Validation and QA: what counts as evidence here

This repo has **no automated test suite**. "It works" claims must be backed by the
manual protocols in this file. Jargon used below: a **gate** is a check a change must
pass before merging/deploying; a **stage** is an SST deployment environment (SST is the
infrastructure-as-code tool this repo deploys with; `prod` is live, personal stages like
`mohammadafzal` are dev); a **fixture** is a captured real payload replayed instead of a
live call.

**When NOT to use this skill:** diagnosing a live misbehavior → `cellar-debugging-playbook`.
Deciding a change's class, gates, and who approves → `cellar-change-control`.
Measurement/probe recipes → `cellar-diagnostics-toolkit`. Environment setup, pnpm
workspace traps, and why root tsc fails → `cellar-build-and-env`. Scrape endpoint
contracts and politeness rules → `cellar-scraping-reference`.

## 1. The brutal truth table (as of 2026-07-07)

| Claim you might be tempted to make | Reality | Evidence |
|---|---|---|
| "Tests pass" | **Zero automated tests exist anywhere.** Root `pnpm test` is a failing placeholder: `echo "Error: no test specified" && exit 1` | `package.json:8`; `find` for `*.test.*`/`*.spec.*`/vitest/jest configs returns nothing |
| "CI is green" | **Now TRUE for the frontend workflow (as of 2026-07-13).** It was red on all 15 runs from when the workflow was added (2026-07-02) through `c8d9918`; PR #63 (commit `1fea669`, merged 2026-07-12) declared `@clerk/types` and the next run went GREEN. Still NO backend CI at all — this covers `packages/frontend/**` only. | First green: Actions run for head `1fea6697` = success. Prior red baseline: run 28639348858 (main @ `c8d9918`, 2026-07-03): Lint ok, Typecheck failure, Build skipped |
| "CI covers the backend" | The only workflow is frontend lint/typecheck/build, path-filtered to `packages/frontend/**` | `.github/workflows/frontend-ci.yml:6-8,47-54` |
| "Backend typechecks" | Root `pnpm exec tsc --noEmit` exits 2 with `Cannot find name 'sst'/'$app'/'aws'` in `infra/*.ts` unless `.sst/` platform types were generated (`sst install` needs network; blocked in sandboxes). **There is no working backend typecheck gate.** | Verified 2026-07-07; see `cellar-build-and-env` |
| "Deploys are gated" | Deploys are manual `pnpm deploy:prod` from the owner's machine. No deploy automation exists | `package.json:10`; owner-only per `cellar-change-control` |

The CI failure root cause (historical — fixed by #63, see below): `packages/frontend/src/hooks/useAuth.ts:2`
imported `@clerk/types`, which **was not declared** in `packages/frontend/package.json`
(only `@clerk/clerk-js` was). Locally it resolved by walking up to the repo-root
`node_modules`, where `.npmrc`'s `shamefully-hoist=true` exposes it as a transitive dep
of root's `@clerk/backend`. CI installs only inside `packages/frontend` (its own pnpm
workspace), so resolution failed:

```
src/hooks/useAuth.ts(2,30): error TS2307: Cannot find module '@clerk/types' or its corresponding type declarations.
```

**Fix applied (as of 2026-07-13):** PR #63 (commit `1fea669`, merged 2026-07-12) added
`@clerk/types` to `packages/frontend` — it is now declared under `dependencies` at
`packages/frontend/package.json:11` (`"@clerk/types": "^4.101.25"`; verify with `grep
'@clerk/types' packages/frontend/package.json`), and CI went green on the next run. A
frontend dependency change like this classifies and gates via `cellar-change-control`.

Check current CI status before repeating any claim above (needs network + gh auth;
blocked in restricted sandboxes):

```bash
gh run list --workflow=frontend-ci.yml --limit 5
```

## 2. Frontend gate runbook

The three gates, in this exact order, from `packages/frontend/` (matches CI order,
`.github/workflows/frontend-ci.yml:47-54`):

```bash
cd packages/frontend
pnpm exec eslint src        # expect: no output, exit 0
pnpm exec tsc --noEmit      # expect: no output, exit 0  (see traps below)
pnpm build                  # expect: vite build succeeds in ~10s
```

Expected `pnpm build` output: a chunk-size warning that the Clerk chunk (~3MB) exceeds
500 kB. **That warning is NORMAL** — do not "fix" it or treat it as a failure. The build
must end with the vite success summary and exit 0.

### Two traps that produce false failures/passes (dist trap live, verified 2026-07-07; the `@clerk/types` phantom-dep trap was RESOLVED by #63 on 2026-07-13)

1. **Stale `dist/` breaks tsc.** `tsconfig.json:21` includes `**/*` with
   `allowJs`/`checkJs`, so a `dist/` left by a previous build gets typechecked and
   produces ~1500+ errors in `dist/assets/*.js`. Always typecheck BEFORE building, or
   `rm -rf dist` first. CI never hits this (fresh checkout). **This trap is still live.**
2. **The `@clerk/types` phantom dependency — RESOLVED as of 2026-07-13.** This used to
   make a local tsc pass non-predictive: `@clerk/types` was undeclared and resolved only
   via the repo-root `node_modules` (section 1). PR #63 declared it in
   `packages/frontend/package.json`, so a local `tsc --noEmit` on a dist-free tree is now
   CI-faithful for that import. The general caution still holds — a local pass only
   mirrors CI when only `packages/frontend` deps are on the resolution path — but this
   specific phantom no longer bites.

### Manual verification matrix (no automated coverage exists for any of this)

| Check | How | Why it is on the list |
|---|---|---|
| Light AND dark theme | Click the ThemeToggle (fixed bottom-right, mounted in `src/index.tsx:97`; persists to `localStorage["cc-theme"]`) on every screen you touched | Hardcoded colors do not flip; tokens-only rule in `packages/frontend/src/components/ui/CONTRACT.md` (defer to it) |
| Mobile viewport (~375px wide) | Browser devtools device mode on every screen you touched; look for horizontal overflow and clipped/wrapped badges | Recurring bug class: 6 mobile-overflow fixes across project life, two within 24h of the 2026-07 redesign (`2fd6b30`, `c8d9918`) |
| `/gallery` visual pass | Load `/gallery` (the kitchen-sink page rendering every ui/ primitive, routed in `src/index.tsx:71`) in light and dark | Catches primitive-level regressions in one screen |
| Both view modes on Home | Toggle relaxed/compact (persists to `localStorage["cc-view-mode"]`, `src/pages/Home/index.tsx:23`) | Two distinct render paths for the same data |
| Visual fidelity vs baselines | Compare against `plan/screenshots/*.png` (8 files: home, comics, comic-detail, reserve, sign-in, profile, updates) | The redesign's accepted look; see `cellar-frontend-design-system` |

## 3. Backend verification protocol, per change class

There is no backend CI and no backend typecheck. Confidence comes from these protocols.
Record the actual commands and outputs in the PR — that transcript IS the evidence.

| Change class | Protocol | Needs |
|---|---|---|
| Pure logic (date math, mappers, parsers-of-strings) | `node -e` or a scratch script against repo `node_modules` (3a) | Nothing |
| Scrape parsing (`parseLineUp.ts` and friends) | Saved HTML fixture + esbuild scratch runner (3b) | Nothing (fixture capture needs one polite network call) |
| Handler / API route | Deploy to your personal stage, curl the dev API (3c) | AWS credentials; a stage entry in `infra/config.ts` |
| Reservation path | Fixture-path assertions ONLY outside prod (3d) | Read 3d before touching anything |
| DB writes / schema | See `cellar-data-model` — the DB is shared across ALL stages; treat destructive work as prod surgery | Owner awareness |

### 3a. Pure-logic changes: prove it with `node -e`

Run tiny probes against the exact library versions in root `node_modules`. Worked
example — proving the known `getFutureDatesByDay` bug (calling it without
`fromTimestamp` builds `new Date(undefined)` = Invalid Date, and date-fns v4
`eachDayOfInterval` returns `[]` on an invalid interval; this is why
`GET /api/shows/scan` always returns `[]`):

```bash
cd /path/to/comedy-cellar-bot
node -e "
const { eachDayOfInterval, startOfDay, addDays } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');
// Replicates packages/core/getFutureDatesByDay.ts:21-31 with fromTimestamp omitted:
const currentDate = toZonedTime(new Date(undefined), 'America/New_York');
console.log('currentDate:', currentDate.toString());          // Invalid Date
const start = startOfDay(currentDate);
console.log(JSON.stringify(eachDayOfInterval({ start, end: addDays(start, 1) })));  // []
"
```

Verified output (2026-07-07): `currentDate: Invalid Date` then `[]`. The same probe with
a valid ms timestamp returns n+1 formatted dates — always show the passing counterpart
so the probe discriminates.

### 3b. Scrape-parsing changes: fixture + scratch runner

The parser (`packages/core/parseLineUp.ts`) is pure — HTML string in, JSON out — so it
is testable with zero mocking. cheerio (the HTML parser it uses) is in root
`node_modules`. TypeScript + the `@core/*` path aliases (defined in root
`tsconfig.json:3-6`) are handled by esbuild (the bundler SST already ships; reads
tsconfig `paths` natively).

Step 1 — capture a real HTML fragment as a fixture. ONE request, using the repo's own
`requester` (it carries the required anti-bot headers — see `cellar-scraping-reference`;
never copy header values into scripts). This mirrors `packages/core/fetchLineUp.ts:8-31`:

```ts
// scratch/capture.ts  (put scratch files OUTSIDE the repo or gitignored; needs network)
import { requester } from "@core/requester";
import { writeFileSync } from "fs";
const date = process.argv[2]; // yyyy-mm-dd
const body = new URLSearchParams({
  action: "cc_get_shows",
  json: JSON.stringify({ date, venue: "newyork", type: "lineup" }),
});
requester
  .post("/lineup/api/", body, {
    headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
  })
  .then((res) => writeFileSync(`lineup-${date}.html`, res.data.show.html));
```

Step 2 — run the REAL parser against the fixture (verified end-to-end 2026-07-07 with a
synthetic fixture):

```ts
// scratch/check.ts
import { parseLineUp } from "@core/parseLineUp";
import { readFileSync } from "fs";
const result = parseLineUp({ html: readFileSync(process.argv[2], "utf8") });
console.log(JSON.stringify(result, null, 2));
console.log("shows parsed:", result.length);
```

```bash
cd /path/to/comedy-cellar-bot
pnpm exec esbuild scratch/check.ts --bundle --platform=node \
  --tsconfig=tsconfig.json --outfile=scratch/check.cjs
node scratch/check.cjs lineup-2026-07-08.html
```

Expected: each parsed show has a numeric `timestamp` (unix seconds — the site's public
show id) and `acts` with non-empty `name` and `img`. An empty-day fixture (the site's
`.no-shows` fragment) must parse to `[]`. Compare the parse of the SAME fixture before
and after your change; the diff is your evidence.

### 3c. Handler changes: personal stage + curl (needs AWS)

Deploy to your personal stage and exercise the route over HTTP. Requires AWS
credentials, root `.env` Cloudflare vars, and a `infra/config.ts` entry for your stage
(deploy crashes without one — see `cellar-config-and-secrets`). Mechanics of `sst dev`,
finding the dev API URL, and logs: `cellar-run-and-operate`. Marked as not runnable in
restricted sandboxes.

```bash
pnpm dev                 # sst dev: deploys personal stage, Lambdas in live mode
curl -s "$DEV_API_URL/api/health"
curl -s "$DEV_API_URL/api/shows/new?limit=5" | jq '.total, (.results | length)'
```

Remember: crons deployed to your stage no-op on schedule (`IS_ACTIVE` guard) but their
HTTP twins (`GET /sync-shows`) run in ANY stage and write to the SHARED database. Do not
spam them.

### 3d. Reservation changes: never validate against prod

`POST /api/reservation/{timestamp}` books REAL seats at a REAL club when it reaches the
site. The stage gate is in `packages/core/createReservation.ts:10-17`:

```ts
if (process.env.STAGE === "prod") {
  const res = await requester.post("/reservations/api/addReservation", data);
  return res.data as ApiResponse.CreateReservationResponse;
}
return createReservationSuccessResponse;
```

Non-prod stages return the canned fixture. **That fixture path IS the correct dev
behavior by design** — do not "fix" dev to hit the real endpoint, and do not test
reservation changes by POSTing to the prod API. Everything upstream of the gate
(validation in `packages/core/models/reservation.ts`, cross-checks in
`packages/functions/reservation.ts`) is fully exercisable on a dev stage or via 3a-style
probes. Any change to this file or the gate itself is owner-approval territory:
`cellar-change-control`.

## 4. Golden data: the fixture inventory (as of 2026-07-07)

| Asset | Path | What it is the oracle for |
|---|---|---|
| Reservation success fixture | `packages/__fixtures__/createReservation.ts` | The ONLY captured real `addReservation` success response. Shape oracle for the booking path: `data.created`, `data.responseCode === 200` (checked in `packages/core/handleReservation.ts`), `data.reservationId`, `data.content.message` (HTML confirmation blurb that gets sanitized), `data.content.conversionInfo` | 
| Redesign screenshots | `plan/screenshots/*.png` (8 files) | Accepted visual baselines for the vintage-marquee redesign; use in the section-2 manual matrix |

That is the complete inventory — there are no HTML lineup fixtures, no getShows JSON
fixtures. When you capture one for a change (3b), consider adding it under
`packages/__fixtures__/` so the next person has it; that addition is a normal
code-change PR.

## 5. Adding real tests — CANDIDATE plan (not established practice)

Nothing below exists yet. It is the agreed-shape proposal, not a description of the
repo. Do not present it as current behavior.

- **Framework:** vitest is the natural fit (Vite is already the frontend toolchain;
  esbuild-speed TS execution; zero-config TS). Backend tests would live at the ROOT
  workspace (the frontend is a separate pnpm workspace — see `cellar-build-and-env`'s
  two-workspace trap; a root vitest cannot resolve frontend deps and vice versa).
- **Wiring:** add `vitest` to root devDependencies; replace the failing placeholder at
  `package.json:8` with `"test": "vitest run"`; minimal `vitest.config.ts` at root —
  vitest does not read tsconfig `paths`, so mirror the aliases:

```ts
// vitest.config.ts (CANDIDATE — does not exist)
import { defineConfig } from "vitest/config";
import path from "path";
export default defineConfig({
  test: { include: ["packages/**/*.test.ts"], exclude: ["packages/frontend/**"] },
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "packages/core"),
      "@customTypes": path.resolve(__dirname, "packages/types"),
    },
  },
});
```

- **First tests — pure functions needing zero mocks, highest value first:**

| Target | File | What to pin |
|---|---|---|
| `parseLineUp` | `packages/core/parseLineUp.ts` | Saved HTML fixtures → expected show/act JSON; `.no-shows` fragment → `[]`; lineup missing a reservation link → `timestamp: undefined` (current behavior, document it) |
| `getFutureDatesByDay` | `packages/core/getFutureDatesByDay.ts` | Happy path (valid ms timestamp → n+1 dates, NY-zoned); **the no-`fromTimestamp` → `[]` bug pinned as a regression test documenting current behavior** — fixing the bug is a behavior change (`/api/shows/scan` starts returning data) and routes through `cellar-change-control` |
| `mapSortString` | `packages/core/common/mapSortString.ts` | `"-timestamp"` → `{timestamp:-1}`; `""` → `{"":1}` (quirk that `mapOrderToDrizzle` compensates for by filtering the empty field) |
| `mapOrderToDrizzle` | `packages/core/common/mapOrderToDrizzle.ts` | 1/-1 → asc/desc; empty-string field dropped |
| `createExternalId` + id guards | `packages/core/common/createExternalId.ts`, `packages/core/models/comic.ts:32-34` | Prefix formatting; **the unanchored-regex trap**: `isComicExternalId("show_comic_x")` is truthy because the guard is a substring `match(new RegExp(COMIC_PREFIX))`, not `^comic_` — pin current behavior before anyone "fixes" it silently |
| `Reservation` schema | `packages/core/models/reservation.ts:5-47,49-105` | phone exactly 10 chars; `howHeard` 26-value enum; boolean `smsOk` → `"Yes"/"No"`; `timestamp` argument overriding `date`/`settime` via NY-zone parsing |

- **Gate implications:** adding the harness plus a backend CI job is a NEW gate for
  every future contributor — that is an owner decision. Route the whole proposal through
  `cellar-change-control` before wiring anything into `.github/workflows/`.

## 6. Acceptance-threshold discipline: quantify "it worked"

Never accept "looks right". Define the number before you run the check. Standard
criteria for common tasks (prod API base `https://comedycellar-api.mafz.al` — public,
non-secret; substitute your dev URL; needs network):

| Task | Pass criterion | Measurement |
|---|---|---|
| "Sync ran for date D" | Live site show-count for D equals the deduplicated DB-backed count for D (for shows that have lineups; see caveat) | Live: `curl -s "$API/api/shows?date=D" \| jq '.shows \| length'`. DB: `curl -sG "$API/api/shows/new" --data-urlencode "date[start]=<D 00:00 ms>" --data-urlencode "date[end]=<D 23:59 ms>" --data-urlencode "limit=100" \| jq '[.results[].id] \| unique \| length'` |
| "Parse change works" | Parsed show count equals the fixture's `.lineup` block count; 100% of acts have non-empty `name` | Section 3b runner + `grep -c 'class="lineup"' fixture.html` |
| "Frontend change works" | All three gates exit 0 IN ORDER on a dist-free tree, plus every applicable manual-matrix row checked | Section 2 |
| "newShowCron change works" | On the dev stage, a forced run discovers the next empty day correctly and the admin email `"New Show Cron"` (subject at `packages/functions/cron/newShowCron.ts:44`) contains the new shows' JSON | `cellar-run-and-operate` for triggering and email decoding |
| "syncCron change works" | `GET /sync-shows` on the dev stage returns 200 AND no `"Sync Show Cron"` failure email (`packages/functions/cron/syncCron.ts:94`) arrives — success is silent by design | Same |
| "Reservation upstream change works" | Dev-stage POST returns the fixture-derived success for valid input, and 400 with `fieldErrors` for each invalid field you touched | Section 3d; assert against `packages/__fixtures__/createReservation.ts` shape |

Caveat that invalidates naive counting: `GET /api/shows/new` inner-joins shows to acts
and comics with no DISTINCT (`packages/core/models/show.ts:213-219`), so a show with N
comics appears N times and `total` counts act-rows, while shows with no parsed lineup
(specials) are invisible. Always dedup by `.id` and expect live-count ≥ DB-count when
specials exist. If your acceptance check needs exact parity, compare id SETS, not
lengths.

## 7. Definition-of-done checklists per change class

Gates, approvals, and change classes are owned by `cellar-change-control` — these
checklists are the evidence-collection half. A PR is done when its class's boxes are all
checked and the transcript is in the PR description.

**Frontend change**
- [ ] `eslint` / `tsc --noEmit` (dist-free) / `pnpm build` all exit 0, in that order
- [ ] Manual matrix rows for touched screens: light+dark, ~375px mobile, `/gallery` if a ui/ primitive changed
- [ ] No raw hex / stock grays — tokens only (`packages/frontend/src/components/ui/CONTRACT.md` rules; it wins over this file)
- [ ] Classified and gated per `cellar-change-control`

**Backend pure-logic change**
- [ ] `node -e` or scratch-script probe showing before AND after behavior, output pasted in PR
- [ ] Callers of the changed function enumerated (grep) and considered

**Scrape-parsing change**
- [ ] Real fixture captured (one polite request) and parse-diffed before/after
- [ ] Empty-day (`.no-shows`) fixture still parses to `[]`
- [ ] No politeness regressions: serial fetching and sleeps untouched (`cellar-scraping-reference`)

**Handler/API change**
- [ ] Deployed to personal stage; curl transcript of happy path + each error branch
- [ ] Shared-DB side effects inspected (dev writes hit the same scraped tables prod reads — `cellar-data-model`)

**Reservation-path change**
- [ ] Zero real bookings made outside prod; fixture path verified intact (`createReservation.ts:10-17` quoted or diffed in PR)
- [ ] Owner approval obtained per `cellar-change-control`

**Test-harness addition (CANDIDATE)**
- [ ] Proposal (framework, config, first tests, CI job) written up
- [ ] Owner approved the new gate before any workflow file changed

## 8. Provenance and maintenance

Verified against repo HEAD `0f277a2` (branch `claude/skill-library-continuity-4m3x56`,
== main) on 2026-07-07. Facts were established by running commands, not by trusting
notes: `find` for test files (empty); root `pnpm exec tsc --noEmit` (exit 2, `Cannot
find name 'sst'`); `pnpm exec eslint src` in `packages/frontend` (exit 0); `pnpm exec
tsc --noEmit` there with a stale `dist/` (exit 2, ~1500 dist errors) and on a dist-free
mirror (fails only on `@clerk/types`, reproducing CI); the date-fns Invalid-Date probe
(section 3a, output `[]`); the esbuild parse runner (section 3b, ran end-to-end);
GitHub Actions API for workflow `frontend-ci.yml` (15/15 runs failed; job 84932116244
log shows the TS2307 error verbatim). `pnpm build` success + clerk-chunk warning was
verified by the lead session on 2026-07-07 (build writes `dist/`, so it was not re-run
here). File:line citations were read directly.

Reconciled against main commit `5ceaf98` on 2026-07-13. One CI fact inverted since the
2026-07-07 baseline: PR #63 (commit `1fea669`, merged 2026-07-12) declared `@clerk/types`
in `packages/frontend/package.json:11`, so the frontend workflow is now GREEN (first green
run: head `1fea6697` = success) and the dist-free local tsc mirror no longer fails on that
import. Everything else in this skill re-verified unchanged: still zero automated tests,
still no backend CI, root `tsc` still needs `.sst` types, and the stale-`dist/` tsc trap is
still live. (Note: #62 shipped a third cron `ShowNotificationCron` and user-facing show
emails via a new `sendHtmlEmail` channel — those belong to `cellar-frontier-and-method` /
`cellar-run-and-operate`; the show-notification path has zero tests and no CI, so it is
"shipped, unproven," and nothing here validates it.)

Volatile facts and how to re-check them:

| Fact | Re-verification command |
|---|---|
| Zero tests exist | `find packages infra -name "*.test.*" -o -name "*.spec.*" \| grep -v node_modules` (expect empty) |
| Root test script still a placeholder | `grep '"test"' package.json` |
| Frontend CI still green (since #63) | `gh run list --workflow=frontend-ci.yml --limit 5` (needs network; expect the recent runs = success) |
| `@clerk/types` declared in frontend (fix #63) | `grep '@clerk/types' packages/frontend/package.json` (expect present: `"@clerk/types": "^4.101.25"`) |
| Frontend gate order in CI unchanged | `sed -n '44,55p' .github/workflows/frontend-ci.yml` |
| Reservation stage gate intact | `sed -n '10,17p' packages/core/createReservation.ts` (expect the `STAGE === "prod"` branch + fixture return) |
| Fixture inventory unchanged | `ls packages/__fixtures__/ plan/screenshots/` |
| tsc dist trap still live | `grep '"include"' packages/frontend/tsconfig.json` (expect `**/*`) |
| Cron email subjects | `grep -rn 'subject:' packages/functions/cron/` |
