---
name: cellar-config-and-secrets
description: Catalog of every configuration axis in comedy-cellar-bot - the five SST secrets (and the load-bearing clertPublishableKey typo), the SES Email identity resource, root .env, the Lambda env flags IS_ACTIVE/IS_CRON/STAGE, the per-stage map in infra/config.ts, the frontend VITE_ env chain and generated sst-env.d.ts files, localStorage flags, and cron schedules as config. Use when adding or rotating a secret, adding an env var or a new stage, wiring config into a Lambda or the frontend, or when a deploy crashes at infra/api.ts:23, a cron runs (or refuses to run) in the wrong stage, or import.meta.env comes back undefined.
---

# Config and secrets — comedy-cellar-bot

Every knob in this system, axis by axis: what it is, where it is set, its prod-vs-dev
value, who may change it, and a one-line re-verification command. There are seven
axes; if a value influences behavior and is not plain source code, it lives in
exactly one of them.

**When NOT to use this skill:** deciding whether you are *allowed* to change a value
→ `cellar-change-control` (this skill only records who the approver is). Setting up
a working machine / the two-workspace pnpm trap → `cellar-build-and-env`. What
`sst dev`/`sst deploy` actually do with these values → `cellar-run-and-operate`.
Database URL discipline and migrations → `cellar-data-model`. The anti-bot header
token's anatomy and history → `cellar-scraping-reference`.

Jargon (defined once, used throughout):

| Term | Meaning here |
|---|---|
| SST | The infra-as-code framework (`sst.config.ts` + `infra/*.ts`) deploying Lambdas, crons, and the static site to AWS. |
| Stage | An SST deployment environment, named on the CLI (`--stage prod`). Two exist (as of 2026-07-07): `prod` (live) and `mohammadafzal` (owner's personal dev stage). `sst dev` defaults the stage to your username. |
| SST secret | A `new sst.Secret("Name")` in `infra/secrets.ts`, stored per-stage in AWS SSM (documented `.env.template:11`), set via the SST CLI, never in files. |
| Linking | `link: [secret]` on a Lambda/route grants it that resource; code reads it as `Resource.Name.value` from the `sst` package. An unlinked Lambda cannot read the secret (incident: d020632, 2024-10-22, Lambda shipped without its DB binding). |
| `Resource` | `import { Resource } from "sst"` — typed accessor for linked resources; types come from generated `sst-env.d.ts` files. |
| StaticSite | `sst.aws.StaticSite` (`infra/frontend.ts:12`) — builds the frontend with an injected `environment:` block; those values are baked into the JS bundle at build time. |
| `VITE_` prefix | Vite (the frontend bundler) exposes only env vars starting with `VITE_` to browser code via `import.meta.env` (default `envPrefix`; `vite.config.ts` does not override it). |

## 0. Master map of all config axes

| # | Axis | Set where | Read where | Approver (per cellar-change-control) |
|---|---|---|---|---|
| 1 | 5 SST secrets | `sst secret set` (SSM, per stage) | `Resource.X.value` in `packages/core/*`, `infra/frontend.ts:21`, `drizzle.config.ts:9` | **Owner only** |
| 1b | SES Email identity (non-secret resource) | `infra/email.ts` — `new sst.aws.Email` in stage `mohammadafzal` ONLY; every other stage adopts via `sst.aws.Email.get` (domain `mail.comedycellar.mafz.al`) | `Resource.Email.sender` in `packages/core/email.ts:5` | **Owner only** (infra class) |
| 2 | Root `.env` | file at repo root (untracked) | `sst.config.ts:12-13` (Cloudflare provider) | **Owner only** (it holds his Cloudflare creds) |
| 3 | Lambda env flags `IS_ACTIVE` / `IS_CRON` / `STAGE` | `environment:` blocks in `infra/cron.ts:9-12,22-25,35-38` and `infra/api.ts:85-87` | `packages/functions/cron/*.ts:10-12`, `packages/core/createReservation.ts:10` | **Owner only** (infra class) |
| 4 | Per-stage map | `infra/config.ts` | `infra/api.ts:23` (Clerk JWT issuer) | **Owner only** (infra class) |
| 5 | Frontend env chain (`VITE_*`) | `infra/frontend.ts:18-24`; `.env.local` for standalone vite | `src/utils/api.ts:6`, `src/utils/clerk.ts:8` | **Owner only** (values come from infra/secrets) |
| 6 | Frontend runtime flags & constants | `localStorage`, `src/utils/constants.ts`, `index.html:18-28` | browser | any maintainer, frontend gates |
| 7 | Cron schedules | `infra/cron.ts:14,27,40` | AWS EventBridge | **Owner only** |

## 1. SST secrets (exactly five, as of 2026-07-13)

Declared in `infra/secrets.ts` (11 lines, read it). Grouped exports: `emailSecrets`
(AlertEmail), `dbCreds` (DbUrl), `clerkCreds` (the three Clerk ones).

> **Email sends through AWS SES** (`@aws-sdk/client-sesv2`) from a **domain identity**
> (`mail.comedycellar.mafz.al`, declared in `infra/email.ts` as `sst.aws.Email`,
> DKIM/verification records managed via the Cloudflare DNS adapter). The sending
> address is a code constant, not a secret: `notifications@mail.comedycellar.mafz.al`
> (`email.ts:5`, from `Resource.Email.sender`). The only email *secret* is `AlertEmail`
> — the **recipient** address for ops alerts. IAM permission to call SES comes from
> linking the `Email` resource (axis 1b), not from a credential. See §1c below and
> `cellar-run-and-operate`.

| Secret | Consumed at | What it is | Prod vs dev |
|---|---|---|---|
| `AlertEmail` | `packages/core/email.ts:6` (`Resource.AlertEmail.value`, const `AlertRecipient`) — the **recipient** of `sendEmail` ops/telemetry alerts (`email.ts:18`, New/Sync/Show-Notification cron mails + `new reservation!`). Not the *sender* — SES sends from the domain identity. | Owner's inbox address for ops alerts | Same mechanism per stage; value is owner's |
| `DbUrl` | `packages/core/database.ts:6`, `drizzle.config.ts:9` | Supabase Postgres connection string. Per-stage secret but **historically the same DB for all stages** (commit 741ca41, 2024-10-14: "Added stage field to users since db is shared across envs" — verified in local history). Treat destructive DB work as prod surgery → `cellar-data-model`. | Possibly identical values — never assume dev DB is disposable |
| `ClerkSigningSecret` | `packages/core/verifyClerkWebhook.ts:13` (svix webhook signature check) | Clerk webhook signing secret | Per-Clerk-instance (prod vs dev Clerk app) |
| `ClerkSecretKey` | `packages/core/clerk.ts:5`, `packages/functions/webhooks/clerk.ts:34` | Clerk backend API key (`sk_…`) | Per-Clerk-instance |
| `ClerkPublishableKey` | `infra/frontend.ts:21` only — becomes `VITE_CLERK_PUBLISHABLE_KEY` in the browser bundle | Clerk publishable key (`pk_…`, public by design) | `pk_live_` in prod bundle, `pk_test_` in dev (`packages/frontend/.env.template:12-13`) |

### The load-bearing typo

`infra/secrets.ts:10` names the *TypeScript key* with a typo:

```ts
clertPublishableKey: new sst.Secret("ClerkPublishableKey"),
```

The SSM secret name is correct (`ClerkPublishableKey`); the object key `clert…` is
referenced by `infra/frontend.ts:21` (`clerkCreds.clertPublishableKey.value`).
Renaming the key without updating frontend.ts breaks the deploy; both files must
change together, which makes it an infra-class change (owner-only). Until then,
copy the typo faithfully wherever you touch it.

### Set / rotate / list

Documented in root `.env.template:11-18` (authoritative — defer to it). Run from
the repo root on a machine with AWS credentials (not possible in restricted
sandboxes — see `cellar-build-and-env`):

```bash
# set or rotate one secret for one stage (owner-only operation):
pnpm exec sst secret set ClerkSecretKey <value> --stage prod

# list what is currently set for a stage:
pnpm exec sst secret list --stage prod
```

After rotating a secret, affected functions need a redeploy of that stage to pick
up the new value. Rotation is explicitly on the owner-only list in
`cellar-change-control` ("infra / cron / secrets / prod deploy" row).

### Adding a sixth secret — see checklist §9a.

### 1c. The SES Email identity (non-secret infra resource)

Not a secret, but a config axis: `infra/email.ts` is **stage-conditional** (as of
2026-07-13, working-tree change after #65):

```ts
export const email =
  $app.stage === "mohammadafzal"
    ? new sst.aws.Email("Email", {
        sender: "mail.comedycellar.mafz.al",
        dns: sst.cloudflare.dns({ zone: "b94d6748e8554bed2a3eae31cc65c81b" }),
      })
    : sst.aws.Email.get("Email", "mail.comedycellar.mafz.al");
```

Only the owner's dev stage `mohammadafzal` CREATES the identity — on deploy of that
stage, SST verifies the domain and writes DKIM/verification records into the
Cloudflare zone automatically (same zone id as the app domains). Every other stage
(prod included) ADOPTS the already-existing identity via `.get()` — no DNS writes,
no create. Why: an SES domain identity is an account-level singleton; two stages
both running `new sst.aws.Email` on the same domain collide with "already exists"
at deploy. Two consequences (also weak point 13 in `cellar-architecture-contract`):
a stage other than `mohammadafzal` deployed into an account where the identity was
never created fails at `.get()`; and removing the `mohammadafzal` stage deletes the
identity + DKIM DNS that prod sends through (it carries the "remove" policy,
sst.config.ts:8). The `email` export
is added to the `link:` array of the three crons (`infra/cron.ts`) and the two
mail-sending API routes (`/sync-shows` and the reservation route, `infra/api.ts`);
linking is what grants each Lambda IAM permission to call SES. Code reads
`Resource.Email.sender` (the verified domain) and prepends `notifications@`
(`packages/core/email.ts:5`).

**Sandbox caveat:** a fresh AWS account's SES is in *sandbox* mode (can only send to
verified addresses). Sending to arbitrary subscribers — and even to `AlertEmail` if
it isn't separately verified — requires requesting SES production access once per
account. See `cellar-run-and-operate`.

## 2. Root `.env` (SST CLI environment)

Holds exactly two variables — Cloudflare DNS provider credentials consumed by
`sst.config.ts:12-13`:

```
CLOUDFLARE_API_TOKEN=   # sst.config.ts:12
CLOUDFLARE_EMAIL=       # sst.config.ts:13
```

- Template: root `.env.template` (comments there rule; it says "Do NOT commit .env").
- Needed only for SST CLI operations that touch DNS (deploys of prod domains); the
  Cloudflare zone id `b94d6748e8554bed2a3eae31cc65c81b` is hardcoded (non-secret)
  in `infra/api.ts:11` and `infra/frontend.ts:8`.
- **AWS credentials never go in `.env`** — SST reads them from the standard AWS SDK
  chain (`~/.aws/credentials` or `AWS_*` env vars), per `.env.template:4-5`.

**Gitignore trap (verified 2026-07-07):** root `.gitignore:15` ignores only
`.env*.local` — a root `.env` is NOT gitignored (`git check-ignore .env` exits 1).
Nothing but discipline stops `git add -A` from staging the owner's Cloudflare
token. Check before any bulk `git add`:

```bash
git check-ignore .env || echo "WARNING: root .env is NOT ignored - do not stage it"
```

(The frontend is safe: `packages/frontend/.gitignore:26` ignores `.env*` except
`.env.template`.)

## 3. Lambda runtime env flags (the stage-safety system)

Three variables, set only in `infra/` `environment:` blocks. Exact semantics:

| Var | Value | Set where | Meaning |
|---|---|---|---|
| `IS_ACTIVE` | `"1"` iff `$app.stage === "prod"`, else `"0"` | `infra/cron.ts:10,23,36` (all three crons) | "this stage's crons should really run" |
| `IS_CRON` | `"1"` | `infra/cron.ts:11,24,37` (all three crons) | "this invocation came from a scheduled cron deployment" |
| `STAGE` | `$app.stage` (literal stage name) | `infra/api.ts:86` — **the reservation route only** | gates REAL seat booking |

### The cron guard (quoted from source)

```ts
// packages/functions/cron/newShowCron.ts:10-16 (syncCron.ts:11-12,45-47 and showNotificationCron.ts:11-12,20-23 identical)
const IS_ACTIVE = process.env.IS_ACTIVE === "1";
const IS_CRON = process.env.IS_CRON === "1";

export async function handler() {
  if (!IS_ACTIVE && IS_CRON) {
    return;
  }
```

Read it carefully — it returns early only when BOTH "not prod" AND "cron-deployed".
Consequences:

- Scheduled cron firings in dev stages no-op (crons deploy everywhere,
  `infra/cron.ts`, but only prod acts). Symptom "my dev cron does nothing" is this
  guard working — see `cellar-debugging-playbook`.
- **Loophole:** the same `syncCron.handler` is also routed as public
  `GET /sync-shows` (`infra/api.ts:38-41`) with NO `environment:` block, so
  `IS_CRON` is unset → the guard passes → an HTTP hit runs a full scrape-and-sync
  in ANY stage, unauthenticated. This is how you manually trigger a sync, and also
  why dev stages can still write scraped rows into the shared DB.
- Incident behind the flags: when SyncCron was added, both env vars were committed
  **commented out** and the dev-stage cron ran unconditionally until 70baa86
  ("uncommented envs", 2024-10-28, verified in local history: the diff restores
  `IS_ACTIVE`/`IS_CRON` in `infra/cron.ts`). When adding any new cron, copy the
  whole `environment:` block — see checklist §9b.

### The STAGE guard (quoted from source)

```ts
// packages/core/createReservation.ts:10-17
if (process.env.STAGE === "prod") {
  const res = await requester.post("/reservations/api/addReservation", data);
  return res.data as ApiResponse.CreateReservationResponse;
}
return createReservationSuccessResponse;
```

`POST addReservation` **books real seats at a real club**. Every non-prod stage
returns the canned fixture `packages/__fixtures__/createReservation.ts`. House
rule #1 (non-negotiable, incident history in `cellar-change-control` §2a): never
weaken this check, never set `STAGE=prod` on a non-prod stage, never add `STAGE`
to other routes without owner sign-off.

There is no other `process.env` use in `packages/` (verified by grep, §Provenance).

## 4. Per-stage config map — `infra/config.ts`

The whole file is a stage-keyed record with one field, `clerkFrontendApi` (the
Clerk JWT issuer URL for that stage's Clerk instance):

| Stage key | `clerkFrontendApi` (as of 2026-07-07) |
|---|---|
| `mohammadafzal` | `https://fair-sunfish-35.clerk.accounts.dev` |
| `prod` | `https://clerk.comedycellar.mafz.al` |

`infra/config.ts:17` exports `config[$app.stage]`. **For any stage name not in the
map this is `undefined`, and the deploy crashes at `infra/api.ts:23`
(`issuer: config.clerkFrontendApi` → TypeError reading property of undefined).**
So a new engineer running `sst dev` (default stage = their username) cannot deploy
until their stage is added — checklist §9d.

## 5. Frontend env chain (`VITE_*`)

Pipeline: `infra/frontend.ts:18-24` `environment:` block → SST injects it either
into the vite dev server (`pnpm dev` in packages/frontend = `sst dev vite`,
`packages/frontend/package.json:5`) or into `npm run build` at deploy → browser
code reads `import.meta.env.VITE_*` (values baked into the bundle; no runtime
switching).

The five declared keys and their real status (verified by grep over `src/`,
2026-07-07):

| Key | Source value | Used in src? |
|---|---|---|
| `VITE_API_URL` | `api.url` (dev-stage API GW URL, or `https://comedycellar-api.mafz.al` in prod) | YES — `src/utils/api.ts:6`, every fetch |
| `VITE_CLERK_PUBLISHABLE_KEY` | `clerkCreds.clertPublishableKey.value` (note typo'd key, §1) | YES — `src/utils/clerk.ts:8` |
| `VITE_REGION` | `aws.getRegionOutput().name` | NO — type-declared only |
| `CLERK_SIGN_IN_URL` | literal `"/sign-in"` | NO — and lacking the `VITE_` prefix, Vite would not expose it to browser code anyway |
| `CLERK_SIGN_UP_URL` | literal `"/sign-up"` | NO — same |

Removing the three unused keys would be an infra-class change (owner); until then
just know they are inert.

### Generated typing files — never hand-edit

SST generates three `sst-env.d.ts` files (all headed "auto-generated by SST. Do
not edit"); they regenerate on `sst dev`/`sst deploy`/`sst install`:

| File | Contains |
|---|---|
| `/sst-env.d.ts` (root) | `Resource` types: Api, Frontend, Email (SES identity — has `.sender`/`.configSet`), the 5 secrets |
| `/packages/frontend/sst-env.d.ts` | just a reference to the root file |
| `/packages/frontend/src/sst-env.d.ts` | `ImportMetaEnv` with exactly the 5 keys above (eslint-ignored) |

If a new secret/env key doesn't show up in types, the fix is regeneration (needs
SST to run, i.e., network + AWS creds), not editing — in sandboxes that cannot run
`sst install`, stale types are expected (`cellar-build-and-env`).

### `.env.local` — standalone vite only

Per `packages/frontend/.env.template:1-7` (authoritative): `.env.local` is used
ONLY when running vite without SST (`cp .env.template .env.local`, fill values,
`npx vite`). Under `sst dev vite` the stack injects the environment and
`.env.local` is not used. Prod values documented in the template: API
`https://comedycellar-api.mafz.al`, `pk_live_` key baked into the bundle at
`https://comedycellar.mafz.al` (as of 2026-07-07).

## 6. Frontend runtime flags and constants

| Flag | Where | Values / default | Change class |
|---|---|---|---|
| `localStorage["cc-theme"]` | `src/hooks/useTheme.ts:5` | `"light"`/`"dark"`; default light (also hardcoded `data-theme="light"` on `index.html:2`; no prefers-color-scheme) | The key name is frozen by `src/components/ui/CONTRACT.md:106` — renaming contradicts the contract; don't |
| `localStorage["cc-view-mode"]` | `src/pages/Home/index.tsx:23-36` | `"relaxed"` (default) / `"compact"` | frontend-logic, any maintainer + gates |
| `WARNING_OCCUPANCY_RATE = 0.8` | `src/utils/constants.ts:1` (the file's only constant) | Occupancy fraction above which a show shows "selling fast" (used by `getShowView`, `src/types.ts`) | frontend-logic, any maintainer + gates |
| GA analytics gate | `index.html:18-28` wraps the gtag snippet (id `G-P7QT320QQB`) in EJS `<% if(!isDev){ %>`; `isDev = config.mode === "development"` via the **vendored** plugin `vitePluginEjs.ts:48` | GA absent from `vite`/`sst dev vite` dev server, present in every `vite build` output (including CI's — the artifact just isn't published) | frontend, any maintainer + gates |

## 7. Cron schedules as config (owner-gated)

`infra/cron.ts` (three crons; first two as of 2026-07-07, third added 2026-07-13):

| Cron | Handler | Schedule | Meaning |
|---|---|---|---|
| `Cron` | `newShowCron.handler` | `cron(0 0/6 * * ? *)` (`infra/cron.ts:14`) | every 6 hours — discover new shows |
| `SyncCron` | `syncCron.handler` | `cron(0 0/1 * * ? *)` (`infra/cron.ts:27`) | hourly — refresh today's inventory |
| `ShowNotificationCron` | `showNotificationCron.handler` | `cron(0/15 * * * ? *)` (`infra/cron.ts:40`) | every 15 min — email opted-in users about batches of newly discovered shows (shipped #62, as of 2026-07-13; operational anatomy in `cellar-run-and-operate`) |

Schedule frequency is the site-politeness dial (house rule #2): tightening it
increases load on comedycellar.com, whose anti-bot response once cost a 5-month
outage. Schedule changes are explicitly owner-only in `cellar-change-control`;
operational anatomy (what fires, logs, no-op behavior) lives in
`cellar-run-and-operate`.

## 8. `sst.config.ts` app-level policy

- Providers: `cloudflare` (creds from root `.env`, §2) and `supabase: true`
  (`sst.config.ts:10-16`).
- `run()` dynamically imports every file in `infra/` (`sst.config.ts:23-26`) — a
  new `infra/foo.ts` file deploys automatically; there is no registry to update.
- **Latent mismatch (open, unfixed as of 2026-07-07):** `sst.config.ts:8` reads
  `removal: input?.stage === "production" ? "retain" : "remove"` — but the real
  prod stage is named `prod`, so prod resources carry the "remove" policy (an
  `sst remove --stage prod` would tear prod down rather than retain). Nothing has
  gone wrong yet; fixing the string is trivial but it is an infra-class,
  owner-only change and is tracked as an open item in `cellar-frontier-and-method`.

## 9. Checklists (all end at change control)

### 9a. Add a new SST secret

1. Declare in `infra/secrets.ts`: `new sst.Secret("MyName")` inside the right
   export group (match casing exactly; remember §1's typo precedent — key name and
   secret name need not match, but make them match).
2. Link it where consumed: add to the `link:` array of that Lambda/route in
   `infra/api.ts` / `infra/cron.ts` (unlinked = unreadable; incident d020632).
3. Read it as `Resource.MyName.value`.
4. Set the value per stage: `pnpm exec sst secret set MyName <value> --stage <stage>`
   for `prod` AND every dev stage that will run the code path.
5. Document the `sst secret set` line in root `.env.template` (keep its
   reference-only style; never put the value in any file).
6. Deploy regenerates `sst-env.d.ts` typings.
7. **Gate:** infra class → owner performs or explicitly approves
   (`cellar-change-control` §1).

### 9b. Add an env var to a Lambda

1. Add to the `environment:` block of that function in `infra/*.ts`. If creating a
   new cron, copy the full `IS_ACTIVE`/`IS_CRON` block from `infra/cron.ts:9-12`
   verbatim — shipping without it repeats incident 70baa86 (§3).
2. Read via `process.env.X` with an explicit comparison (`=== "1"`), matching the
   existing guards.
3. Remember: routes and crons pointing at the same handler have independent
   `environment:` blocks (that is the §3 loophole; decide deliberately whether the
   HTTP route should get the var too).
4. **Gate:** infra class → owner-only.

### 9c. Add a frontend env var

1. Add `VITE_MYVAR: <value>` to `infra/frontend.ts` `environment:` — the `VITE_`
   prefix is mandatory for browser visibility (§Jargon).
2. Read as `import.meta.env.VITE_MYVAR`.
3. Add it to `packages/frontend/.env.template` with a comment so standalone vite
   still works.
4. Types appear in `src/sst-env.d.ts` after the next SST run; do not hand-edit.
5. **Gate:** touching `infra/frontend.ts` is infra class → owner-only; the src
   consumption side additionally passes the frontend CI trio.

### 9d. Add a new stage (e.g., a new dev's personal stage)

1. Add a key to `infra/config.ts` named exactly after the stage, with a
   `clerkFrontendApi` (a dev Clerk instance's frontend API URL) — without it,
   deploy crashes at `infra/api.ts:23` (§4).
2. Set all five secrets for the stage (§1); for `DbUrl` read
   `cellar-data-model` first — the DB is shared, a new stage does NOT get a fresh
   database by default.
3. Crons will deploy but no-op (`IS_ACTIVE="0"`, §3) — correct, leave it.
4. Reservations will return the fixture (`STAGE !== "prod"`, §3) — correct; never
   "fix" it.
5. Custom domains attach only when `$app.stage === "prod"`
   (`infra/api.ts:16`, `infra/frontend.ts:25`) — dev stages get generated URLs.
6. **Gate:** infra class → owner-only (he must at minimum run the secret sets and
   approve the config.ts edit).

### 9e. Rotate a secret

Owner-only, full stop. Procedure = §1 set command with the new value, then redeploy
the stage. For `DbUrl` coordinate via `cellar-data-model` (live crons hold the old
connection string until redeploy).

## 10. Secrets hygiene — known committed secrets, and what never to copy

| Item | Location (reference only — NEVER reproduce the value anywhere, including skills, logs, or PR text) | Status |
|---|---|---|
| `x-code-localize` anti-bot header value | `packages/core/requester.ts:12-13` | Committed, load-bearing (scraping breaks without it), contains encoded timestamp + a residential IP. Anatomy: `cellar-scraping-reference`. |
| Slack webhook URL split across an array | `packages/core/slack.ts:3-9` | Committed live secret in dead code (leftover of the removed Partiful cron — story in `cellar-failure-archaeology`). Do not call it, do not paste it. |
| Captured real reservation payload | `packages/__fixtures__/createReservation.ts` | Deliberate fixture (real reservationId); fine to use as the dev-stage mock, don't extend it with fresh real bookings. |

Remediating either committed secret (rotate webhook, recapture token) is
owner-only and, for the token, a scraping-behavior change
(`cellar-change-control`).

## Provenance and maintenance

Verified 2026-07-07 against the working tree at commit `0f277a2` (branch
`claude/skill-library-continuity-4m3x56`, == main) by reading: `infra/secrets.ts`,
`infra/frontend.ts`, `infra/config.ts`, `infra/cron.ts`, `infra/api.ts`,
`sst.config.ts`, `.env.template`, `packages/frontend/.env.template`,
`packages/core/{createReservation,email,requester,database,clerk,verifyClerkWebhook}.ts`,
`packages/core/models/user.ts`, `packages/functions/cron/{newShowCron,syncCron,showNotificationCron}.ts`,
`packages/functions/webhooks/clerk.ts`, `drizzle.config.ts`, root + frontend
`package.json`, all three `sst-env.d.ts`, `packages/frontend/src/{utils/{api,clerk,constants}.ts,hooks/useTheme.ts,pages/Home/index.tsx}`,
`index.html`, `vite.config.ts`, `vitePluginEjs.ts`, both `.gitignore`s; commands:
`git check-ignore -v .env` (exit 1 → not ignored), `git show 70baa86`, `git show
741ca41`, greps below. `sst secret list` could not be run here (no AWS creds /
network); those commands are carried from `.env.template:11-18`.

Reconciled 2026-07-13 against commit `5ceaf98` (main). Config-relevant deltas:
#62 added a third cron `ShowNotificationCron` (`infra/cron.ts:30-40`, schedule
`cron(0/15 * * * ? *)`, same `IS_ACTIVE`/`IS_CRON` block) and `sendHtmlEmail`
(`packages/core/email.ts:35-57`) — the **first user-facing email channel**, sending
show-notification mail from `"Comedy Cellar Bot <FromEmail>"` to opted-in users off
the same `FromEmail`/`FromEmailPw` secrets; the old `sendEmail` admin-self telemetry
channel is unchanged. #63 (merged 2026-07-12) declared `@clerk/types` and turned the
frontend CI trio green (no config surface here). No secret was added or rotated —
still exactly six. Re-read at reconcile: `infra/cron.ts`, `packages/core/email.ts`,
`packages/functions/cron/showNotificationCron.ts`.

Re-verification one-liners (run from repo root):

| Claim | Command | Expect |
|---|---|---|
| Still exactly 5 secrets, typo intact | `grep -n "sst.Secret\|clertPublishableKey" infra/secrets.ts infra/frontend.ts` | 5 `new sst.Secret` lines; `clert` at secrets.ts:10 + frontend.ts:21 |
| Email is SES, not Gmail/nodemailer | `grep -rn "nodemailer\|SESv2\|sst.aws.Email" packages/core/email.ts infra/email.ts package.json` | zero `nodemailer`; `SESv2` in email.ts; BOTH `new sst.aws.Email` and `sst.aws.Email.get` in infra/email.ts (stage-conditional since 2026-07-13) |
| SES identity linked to senders | `grep -n "email" infra/cron.ts infra/api.ts` | `import { email }` + `email` in each mail-sending `link:` array |
| Stage list | `grep -n "clerkFrontendApi" infra/config.ts` | one line per stage (2 as of 2026-07-07) |
| Cron schedules | `grep -n "schedule:" infra/cron.ts` | three lines: `cron(0 0/6 * * ? *)`, `cron(0 0/1 * * ? *)`, `cron(0/15 * * * ? *)` (as of 2026-07-13) |
| Env-flag surface | `grep -rn "process.env" packages/ --include='*.ts' \| grep -v node_modules` | 7 lines: IS_ACTIVE/IS_CRON across all three cron files + STAGE (createReservation.ts:10) (as of 2026-07-13) |
| Guard code verbatim | `sed -n '10,16p' packages/functions/cron/newShowCron.ts` | the §3 quote |
| STAGE gate verbatim | `sed -n '10,17p' packages/core/createReservation.ts` | the §3 quote |
| /sync-shows still lacks env block | `sed -n '38,41p' infra/api.ts` | route with `link:` but no `environment:` |
| Unused frontend keys still unused | `grep -rn "VITE_REGION\|CLERK_SIGN" packages/frontend/src --include='*.ts*' \| grep -v sst-env.d.ts` | no output |
| removal-policy mismatch still open | `grep -n "production" sst.config.ts` | line 8 ternary still says `"production"` |
| Root .env still unignored | `git check-ignore .env; echo $?` | `1` |
| localStorage keys | `grep -rn "cc-theme\|cc-view-mode" packages/frontend/src --include='*.ts*'` | useTheme.ts:5 + Home/index.tsx:23 |
| Selling-fast threshold | `cat packages/frontend/src/utils/constants.ts` | `WARNING_OCCUPANCY_RATE = 0.8` |
