---
name: cellar-change-control
description: Change classification, required gates, and approval rules for comedy-cellar-bot. Use BEFORE making any change to decide its class (frontend/backend/scraping/DB-schema/infra), which gates it must pass, and whether it needs owner approval. Also use when asked "can I deploy this", "can I change the cron schedule", "who approves X", when touching packages/core/createReservation.ts, packages/core/requester.ts, infra/cron.ts, migrations/, or secrets, or when coordinating parallel agents on shared files.
---

# Change control — comedy-cellar-bot

Every change to this repo belongs to exactly one class below, and every class has
gates (checks that must pass) and an approver. This skill is the terminus: any
procedure in any sibling skill that changes behavior ends by passing through the
gates here. When in doubt, classify UP (to the stricter class).

**The owner** is mafzal91 (Mohammad Afzal), the solo author of all 81+ commits and
the only person with AWS credentials, prod secrets, and the Supabase account.
"Owner-only" means: do not do it yourself, prepare the change and hand it to him.

**When NOT to use this skill:** how to *produce* the evidence a gate demands →
`cellar-validation-and-qa`. How to actually run a deploy or read logs →
`cellar-run-and-operate`. How to write/run a migration → `cellar-data-model`.
Diagnosing a failure (no change yet) → `cellar-debugging-playbook`. Scraper-outage
response → `cellar-scraper-recovery-campaign`.

Jargon used below:
- **Stage** — an SST deployment environment. Two exist (as of 2026-07-07): `prod`
  (live site) and `mohammadafzal` (owner's personal dev stage), keyed in
  `infra/config.ts:12-15`. A new stage name crashes deploy until added there.
- **SST** — the infra-as-code framework (`sst.config.ts`, `infra/*.ts`) that
  deploys Lambdas, crons, and the static site to AWS.
- **CI trio** — the only automation in the repo: eslint + tsc + vite build for the
  frontend (`.github/workflows/frontend-ci.yml:47-54`). Nothing else is automated.

## 1. Change classification

| Class | Examples | Required gates | Approver |
|---|---|---|---|
| docs / changelog | README, `plan/`, skill files, `Updates/data.ts` copy | Read it back; no build gate | any maintainer |
| frontend-visual | restyle a component, spacing, tokens | CI trio + light/dark toggle check + mobile-width check + token rule (§2e) | any maintainer |
| frontend-logic | query wiring, routing, hooks, forms | CI trio + manual flow verification per `cellar-validation-and-qa` + light/dark + mobile | any maintainer |
| backend-logic | handlers in `packages/functions/`, models in `packages/core/` | **No automated gate exists** (see below). Manual verification protocol in `cellar-validation-and-qa` | any maintainer, but escalates to scraping-behavior or DB-schema if it touches those |
| scraping-behavior | `requester.ts`, fetch/parse files, sleeps, retries, anything that changes what/how-often we ask comedycellar.com | Owner sign-off BEFORE writing code + `cellar-scraping-reference` etiquette + manual verification | **OWNER** |
| DB-schema | `packages/core/sql/*.sql.ts`, `migrations/` | Migration workflow in `cellar-data-model`; treat as prod surgery (shared DB, §2c) | **OWNER** |
| infra / cron / secrets / prod deploy | `infra/*.ts`, `sst.config.ts`, cron schedules, `sst secret set`, `pnpm deploy:prod` | Owner performs or explicitly approves each one | **OWNER only** |

Multi-class changes take the union of gates and the strictest approver.

### The frontend gate (the only automated gate in the repo)

CI (`.github/workflows/frontend-ci.yml`) runs only on `packages/frontend/**`
changes, on node 24, installing **inside** `packages/frontend` (it is its own pnpm
workspace root — see `cellar-build-and-env` for the two-workspace trap). Reproduce
locally before pushing:

```bash
cd packages/frontend
pnpm install --frozen-lockfile
pnpm exec eslint src        # must print nothing
pnpm exec tsc --noEmit      # must print nothing
pnpm build                  # vite build; a ~3MB clerk-chunk size warning is normal
```

These four commands pass **locally**, but a local pass is **not** CI-faithful, and
**CI is currently RED on main** (verified 2026-07-07). The tsc step fails: `useAuth.ts:2`
imports `@clerk/types`, which is **not** declared in `packages/frontend/package.json`
(only `@clerk/clerk-js` is), so a frontend-only frozen install — exactly what CI does —
cannot resolve it and tsc exits with `TS2307: Cannot find module '@clerk/types'`. It
resolves locally only because a prior repo-root `pnpm install` hoists the phantom dep.
So a green local tsc does **not** mean your frontend PR will pass CI — it won't until
that dep is declared. `cellar-validation-and-qa` §1–§2 is the canonical home for the
current CI state, the run evidence, the candidate fix, and both local traps; treat CI as
red until it says otherwise. Then, because CI runs no
browser: toggle the theme (bottom-right sun/moon) on every screen you touched, and
check a ~375px-wide viewport — mobile overflow is this repo's most recurrent bug
class (6+ fix commits from b697c94 2024-10-11 through c8d9918 2026-07-03).

### Backend honestly has no automated gate (as of 2026-07-07)

- Zero tests exist. Root `pnpm test` is the npm placeholder: `echo "Error: no test
  specified" && exit 1` (`package.json:8`).
- No backend CI. `frontend-ci.yml` is the only workflow in `.github/workflows/`.
- Root `pnpm exec tsc --noEmit` fails without the generated `.sst/` platform types
  (`sst install` needs network), so it is not a usable gate in sandboxes and is not
  run in CI anywhere.

Therefore the backend gate is entirely manual: the verification protocol in
`cellar-validation-and-qa` (exercise the changed handler against a dev stage or
fixtures, show request/response evidence). Do not claim "tests pass" for backend
work — there are none to pass. Adding the first real test gate is a ranked open
problem in `cellar-frontier-and-method`.

## 2. Non-negotiables

Each rule below was paid for with an incident. Violating one is never a judgment
call — stop and get the owner.

### (a) Never create real reservations outside prod

`POST /reservations/api/addReservation` on comedycellar.com **books real seats at a
real club**. The only thing preventing a dev-stage test from doing that is one line:

- `packages/core/createReservation.ts:10` — `if (process.env.STAGE === "prod")`
  hits the live endpoint; every other stage returns the canned fixture
  `packages/__fixtures__/createReservation.ts` (a captured real success payload).
- `STAGE` is injected only on the reservation route (`infra/api.ts:85`).

History: real submission was initially commented out, enabled in PR #6 (ca85460,
2024-02-22), and stage-gated one day later (348682e, 2024-02-23) — both pre-graft
commits recovered via GitHub API (the local clone is shallow, grafted at
2024-10-11). The mock fixture came in 391196d (2025-01-02, verified locally). The
owner spent a day exposed and never went back.

Never: weaken/remove the STAGE check; set `STAGE=prod` on a non-prod stage; call
`addReservation` from scripts, tests, or diagnostics. If you need the response
shape, use the fixture. Any change to this file is class scraping-behavior + owner.

### (b) Politeness to comedycellar.com

Incident: in Sep 2024 the site deployed a header-based anti-bot check; the scraper
had already been broken for the whole 5-month dormancy (2024-04-13 → 2024-09-13)
and was revived only by 122ccf5 "fixed request headers" (2024-09-13, pre-graft),
which added the captured-browser `x-code-localize` token still hardcoded at
`packages/core/requester.ts:12-13` (never copy its value anywhere; see
`cellar-scraping-reference` for token anatomy). A 5-month outage is the price of
getting noticed.

Current politeness posture (verified 2026-07-07): newShowCron every 6h, syncCron
hourly (`infra/cron.ts:13,26`), syncCron syncs only today's date; 5s sleep between
dates (`newShowCron.ts:62`), 7.5s between operations (`syncCron.ts:88`); serial
fetching with 3-attempt retry at `5000 * attempt` ms (`syncCron.ts:13-42` — the
comment says "Exponential backoff" but it is linear; keep it).

Never, without owner sign-off: increase cron frequency; scrape multiple dates in
parallel; remove or shorten sleeps; add bulk backfill loops; change `requester.ts`
headers. Also note `GET /sync-shows` is a public unauthenticated route that
triggers a live scrape — do not script against it in loops.

### (c) Shared-DB discipline

One Supabase Postgres serves ALL stages. This is by design, not accident: 741ca41
(2024-10-14, verified locally) is literally titled "Added stage field to users
since db is shared across envs". Only the `user` table is stage-partitioned;
show/comic/act/room are shared — dev writes land in tables prod reads. So **every
destructive DB operation is prod surgery**, no matter which stage you think you
are in.

Incident: the Feb-2025 migration squash — 8b3b837 (PR #40, 2025-02-05, verified
locally) deleted all 18 accumulated migrations and re-baselined to the 3 that
exist today (`migrations/0000_closed_mattie_franklin.sql` … `0002_light_miss_america.sql`),
which required manually reconciling the prod database's migration state. It
worked, once, for the person who held all the context. Never repeat it casually;
a history reset is owner-only and needs a written reconciliation plan first.

All schema changes go through the migration workflow in `cellar-data-model`
(`pnpm db` = `sst shell drizzle-kit`, `package.json:12`). No `DROP`, `TRUNCATE`,
`DELETE` without owner approval and a stated rollback.

### (d) Deploys, secrets, and cron schedules are owner-only

- Prod deploy is manual and deliberate: `pnpm deploy:prod` = `sst deploy
  --stage=prod` (`package.json:10`), run from a machine with AWS creds + root
  `.env` (Cloudflare token). There is **deliberately no deploy automation** — the
  only workflow is frontend CI. Do not add deploy automation; that decision is the
  owner's.
- Secrets live in AWS SSM and rotate via `sst secret set <Name> <value> --stage
  prod` (documented in `.env.template:11-19`; the six names are in
  `infra/secrets.ts`). Never run `sst secret set`, never echo secret values, never
  commit them. Full axis map: `cellar-config-and-secrets`.
- Cron schedules (`infra/cron.ts:13,26`) are a politeness control (§2b), so
  changing them is doubly owner-gated.
- `pnpm remove:prod` exists (`package.json:11`). Never run it. Note also the
  latent removal-policy bug (`sst.config.ts:8` checks stage `"production"` but the
  real stage is `"prod"`) documented in `cellar-architecture-contract` — one more
  reason prod infra commands are owner-only.

### (e) Frontend token discipline

`packages/frontend/src/components/ui/CONTRACT.md` rules (it is the authority;
defer to it): "Use tokens, never raw hex or stock Tailwind grays — hardcoded
colors won't flip in dark mode" (CONTRACT.md:17-18), and prop signatures of shared
primitives are "stable; restyle changes are internal-only and additive to props"
(CONTRACT.md:3-5). Any frontend change with a raw hex color or stock gray fails
review unless CONTRACT.md itself sanctions it (a few sanctioned literals exist,
e.g. the brand focus shadow). Details and token catalog:
`cellar-frontend-design-system`.

### (f) User-visible changes ship WITH a changelog entry

`packages/frontend/src/pages/Updates/data.ts` is the project's changelog of record
— an array of `{date, title, text}` rendered at `/updates`. If users can see your
change, add an entry in the same PR.

Write entries about what **shipped**, not what is coming: the existing entries
promising notifications ("You'll soon be able to receive notifications…",
`data.ts:31`; similar at `data.ts:46,51`, dated Nov 2024/Feb 2025) were never
fulfilled — user notifications have NEVER been sent (no code even reads the
notification tables to send anything). Those entries are now archaeology of an
unshipped ambition. Do not add more like them.

## 3. Parallel-agent file ownership (standing rule)

The July-2026 redesign was planned as ~47 parallel agents in barrier-separated
waves (`plan/IMPLEMENTATION_PLAN.md:222-229`) and landed as stacked PRs #50–#61.
The rule that made that safe, from `plan/IMPLEMENTATION_PLAN.md:15-17`:

> **Ownership rule:** an agent may **edit only the files in its assigned set**; it
> may **import (read) any other file freely**. Imports never collide. Two agents
> never share an editable file.

This is the standing rule for ANY parallel-agent work in this repo, not just the
redesign: partition by file, put a single owner on shared/wiring files, and make
cross-agent dependencies flow through published contracts (the redesign used
`ui/CONTRACT.md`), never through another agent's in-flight code. For frontend work
the frozen do-not-edit set still applies (CONTRACT.md:7-11): `src/index.tsx`,
`src/style.css`, `src/theme.css`, `index.html`, `src/utils/api.ts`,
`src/utils/clerk.ts`, `src/types.ts` — those are integration-owner files; new
shared primitives get flagged, not created inside a screen folder.

## 4. PR etiquette (observed from history, 2026-07-07)

- **Default: branch + PR to main, descriptive title.** All substantial features
  landed as PRs (#1–#61), e.g. `75029b8 "Vintage marquee frontend redesign
  (Phases 0–2) (#59)"`. Recent era uses squash-merge (title carries `(#NN)`);
  earlier era used merge commits (`Merge pull request #NN from mafzal91/...`).
  Branch names are `feature/<thing>` or `fix/<thing>`.
- **Direct-to-main exists but is owner privilege**, used only for small
  fixes/polish (first-parent history: `c8d9918` mobile overflow fix, `6192496`
  auth-card polish, `6c3da50` "fixed infinite loading", etc.). Contributors and
  agents do not push to main directly — open a PR even for one-liners; frontend
  PRs get the CI trio for free.
- One topic per PR. The multi-class rule (§1) is easiest to honor when a PR
  doesn't mix, say, a schema change into a restyle.
- There is no CODEOWNERS or CONTRIBUTING file (verified 2026-07-07); this skill is
  the closest thing to one.

## 5. Requires-explicit-owner-approval checklist

Before doing any of the following, stop and get an explicit yes from the owner:

- [ ] Deploying to prod (`pnpm deploy:prod`) or removing any stage (`pnpm remove:prod`)
- [ ] Setting or rotating any secret (`sst secret set …`, any stage)
- [ ] Changing either cron schedule or adding a new cron (`infra/cron.ts`)
- [ ] Any edit to `packages/core/requester.ts` (headers, UA, token)
- [ ] Changing scrape pacing: sleeps, retries, dates-per-run, parallelism
- [ ] Any edit to `packages/core/createReservation.ts` or the STAGE gate
- [ ] Any DB migration; ANY destructive DB statement; any migration-history reset
- [ ] Adding a new public (unauthenticated) API route or making a private one public
- [ ] Adding deploy automation, changing CI to deploy, or granting CI credentials
- [ ] Creating a new SST stage (also needs an `infra/config.ts` entry or deploy crashes)
- [ ] Anything that sends email/Slack/notifications to anyone other than the owner

If a task seems to require one of these, the deliverable is a written proposal
(what, why, rollback), not the change itself.

## 6. How every other skill terminates here

| Skill | What it hands to change control |
|---|---|
| cellar-architecture-contract | invariants referenced by §2; weak points that make classes strict |
| cellar-validation-and-qa | defines the evidence each gate in §1 demands |
| cellar-data-model | the migration workflow that DB-schema class requires |
| cellar-scraping-reference | etiquette + token anatomy behind §2a/2b |
| cellar-config-and-secrets | the secret/stage axes behind §2d |
| cellar-run-and-operate | executes deploys/ops AFTER §5 approval |
| cellar-build-and-env | reproduces the §1 gates locally (two-workspace trap) |
| cellar-frontend-design-system | the token/contract rules behind §2e |
| cellar-debugging-playbook / cellar-failure-archaeology | diagnosis; any resulting fix re-enters §1 |
| cellar-diagnostics-toolkit | read-only probes are gate-exempt UNLESS they hit comedycellar.com (then §2b) or write the DB (then §2c) |
| cellar-scraper-recovery-campaign | its decision gates are owner checkpoints; every recovery change is class scraping-behavior |
| cellar-frontier-and-method | open problems become proposals that enter §1/§5, never bypass them |

## Provenance and maintenance

Verified 2026-07-07 against local checkout at HEAD `c8d9918f0f919d8126022d0f3757558dd55ce647`
(branch identical to main). Verified by reading: `package.json`,
`.github/workflows/frontend-ci.yml`, `packages/core/createReservation.ts`,
`packages/core/requester.ts` (line positions only), `infra/cron.ts`,
`infra/secrets.ts`, `infra/config.ts`, `.env.template`, `drizzle.config.ts`,
`migrations/` listing, `packages/frontend/src/components/ui/CONTRACT.md`,
`plan/IMPLEMENTATION_PLAN.md`, `packages/frontend/src/pages/Updates/data.ts`,
`sst.config.ts:8`. Verified by running: the frontend CI trio locally (all pass locally
only via the hoisted `@clerk/types` phantom dep — CI is RED on main at the tsc step; see
`cellar-validation-and-qa`);
`git show 391196d 8b3b837`, `git log --first-parent` (PR-vs-direct pattern),
grep for sleeps/retries/IS_ACTIVE in cron handlers. Pre-graft SHAs ca85460,
348682e, 122ccf5 are NOT in the local shallow clone; they are carried from the
2026-07-07 git-archaeology discovery (recovered via GitHub API) and labeled as
such above.

Re-verify before trusting, when time has passed:

| Volatile fact | One-line check |
|---|---|
| CI trio still the whole gate | `ls .github/workflows/ && grep -n "run:" .github/workflows/frontend-ci.yml` |
| Still zero tests | `grep -n '"test"' package.json` (placeholder) and `find . -name "*.test.ts" -not -path "*/node_modules/*"` (empty) |
| STAGE gate intact | `grep -n 'STAGE === "prod"' packages/core/createReservation.ts` |
| Cron schedules unchanged | `grep -n "schedule" infra/cron.ts` |
| Sleeps intact | `grep -n "sleep(" packages/functions/cron/*.ts` |
| Migrations still 3 | `ls migrations/*.sql \| wc -l` |
| Stage list | `grep -n "const config" -A4 infra/config.ts` |
| Changelog current | `head -15 packages/frontend/src/pages/Updates/data.ts` |
| Deploy still manual | `grep -rn "sst deploy" .github/ package.json` (only package.json should hit) |
