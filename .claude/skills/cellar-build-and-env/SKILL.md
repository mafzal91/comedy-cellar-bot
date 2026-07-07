---
name: cellar-build-and-env
description: From-scratch environment setup for comedy-cellar-bot and its known traps - node/pnpm/corepack prereqs, the two-pnpm-workspace install gotcha, pnpm v10 build-script gates, what works with vs without AWS credentials, why root tsc fails without .sst platform types, and a verified-environment checklist with expected outputs. Use when setting up a fresh clone or sandbox, when pnpm install or lockfiles behave strangely, when root tsc --noEmit says "Cannot find name 'sst'", when frontend tsc errors on dist/assets/*.js, or when sst install fails with HTTP 403.
---

# cellar-build-and-env: recreate a working environment from scratch

Runbook for getting a fresh clone (or a fresh AI sandbox) of comedy-cellar-bot to a
verified-working state, plus every known setup trap. All commands and outputs below were
run and verified in this repo on 2026-07-07 at commit `0f277a2b1accf50ae3c78165b3d30900fa3512ba`.

**When NOT to use this skill:**
- Running/deploying the app (`sst dev`/`sst deploy` anatomy, crons, logs, domains) → **cellar-run-and-operate**
- Secrets, stages, env-var meanings, adding a config axis → **cellar-config-and-secrets**
- What gates a change must pass before merge/deploy → **cellar-validation-and-qa** and **cellar-change-control**
- Something that used to work now misbehaves at runtime → **cellar-debugging-playbook**
- System map / why the repo is shaped this way → **cellar-architecture-contract**

Jargon used below:
- **SST** — the "Serverless Stack" framework (v3, "Ion") that defines and deploys the AWS
  infrastructure from TypeScript files in `infra/`. The `sst` CLI is a root dependency.
- **Stage** — SST's name for a deployment environment (e.g. `prod`, or a personal dev stage).
- **corepack** — Node's bundled package-manager version shim; it reads the `packageManager`
  field in `package.json` and runs that exact pnpm version.

## 1. Prerequisites

| Tool | Required | Evidence (as of 2026-07-07) |
|---|---|---|
| Node.js | ≥ 22 works; CI pins 24 | Sandbox runs v22.22.2 and all frontend gates pass locally (but CI is red on main — §5.2); CI uses node 24 (`.github/workflows/frontend-ci.yml:36`); vite 7 requires `^20.19.0 \|\| >=22.12.0` (`packages/frontend/node_modules/vite/package.json` engines) |
| pnpm | 10.23.0 (pinned) | `packageManager: "pnpm@10.23.0"` in root `package.json:6` — this field is authoritative |
| corepack | any recent (0.34.6 here) | provides the pnpm shim |
| git | any | clone + read-only archaeology |
| AWS credentials | only for section 6 | root `.env.template:4-5`: SST reads the standard AWS SDK chain |

```bash
corepack enable                                  # activates the pnpm shim
corepack prepare pnpm@10.23.0 --activate         # pre-fetch pinned pnpm (needs network on first run)
node --version && pnpm --version                 # expect >=22, and 10.23.0 when run at repo root
```

pnpm version quirk (as of 2026-07-07): the corepack shim resolves the version from the
**nearest** `package.json`. `packages/frontend/package.json` has NO `packageManager` field,
so `pnpm --version` inside `packages/frontend` falls back to corepack's default (observed:
10.33.0 there vs 10.23.0 at root, same machine). Installs still work (both lockfiles are
`lockfileVersion: '9.0'`), and CI avoids the drift because `pnpm/action-setup@v4` installs
the root-pinned version globally (`.github/workflows/frontend-ci.yml:29-31`). Just don't be
surprised by the mismatch, and don't "fix" it without owner sign-off (see §3 rules).

## 2. Quick start (happy path)

```bash
git clone <repo> comedy-cellar-bot && cd comedy-cellar-bot
pnpm install --frozen-lockfile                    # install #1: repo root
cd packages/frontend
pnpm install --frozen-lockfile                    # install #2: frontend (separate workspace!)
pnpm exec eslint src && pnpm exec tsc --noEmit && pnpm build   # the CI gate trio (green here ≠ green in CI — §5.2)
```

Both installs are required. Why: §3. Expected outputs: §8 checklist. But a local
exit-0 from that trio is NOT CI-faithful: frontend CI is red on main (phantom
`@clerk/types`, §5.2).

## 3. THE TWO-WORKSPACE TRAP (the #1 setup gotcha)

This repo contains **two independent pnpm workspace roots**:

| Workspace root | Workspace file | Lockfile | Covers |
|---|---|---|---|
| `/` (repo root) | `pnpm-workspace.yaml` (lists only `packages/frontend`) | `pnpm-lock.yaml` | backend deps: sst, drizzle, axios, cheerio, zod... (root `package.json:18-35`) |
| `packages/frontend/` | `packages/frontend/pnpm-workspace.yaml` (contains ONLY an `allowBuilds:` map — no `packages:` key) | `packages/frontend/pnpm-lock.yaml` | all frontend deps: preact, vite, tailwind, clerk-js... |

Because `packages/frontend` has its own `pnpm-workspace.yaml` + `pnpm-lock.yaml`, pnpm
treats it as a **separate workspace root**: an install run from inside that directory
resolves against the *nested* lockfile, not the root one. The canonical statement of this
is the comment in the CI workflow, `.github/workflows/frontend-ci.yml:40-43`:

> packages/frontend is its own pnpm workspace root (it has its own pnpm-workspace.yaml and
> a self-contained pnpm-lock.yaml), so install from there rather than the repo root, whose
> lockfile is stale for frontend deps.

Consequences and rules:

1. **Always run BOTH installs** (root, then `packages/frontend`). A root-only install
   leaves the frontend resolved from the root lockfile's stale `packages/frontend:`
   importer (it exists — root `pnpm-lock.yaml:64` — but is documented stale by the CI
   comment above).
2. **Never "consolidate" the two workspaces** (deleting the nested workspace/lockfile, or
   regenerating the root lockfile to "fix" the staleness) without owner sign-off. CI's
   install step, its cache key (`cache-dependency-path: packages/frontend/pnpm-lock.yaml`,
   workflow line 38), and the deploy build all depend on the nested root. This is a
   structural change → **cellar-change-control**.
3. **Do not remove `.npmrc`** (`shamefully-hoist=true`, the file's single line). It flattens
   `node_modules` so SST's esbuild Lambda bundling can resolve backend deps. It was added
   deliberately in the npm→pnpm migration — commit `c17b999` (PR #49, 2026-07-01), message:
   "Add pnpm-workspace.yaml, .npmrc (shamefully-hoist for SST compat), and
   pnpm.onlyBuiltDependencies for esbuild/native addons."
4. Backend dirs `packages/core`, `packages/functions`, `packages/types`,
   `packages/__fixtures__` are **not** workspace packages — no `package.json` of their own;
   SST/esbuild compiles them per-Lambda using root deps and the path aliases `@core/*`,
   `@customTypes/*` from root `tsconfig.json:3-6`.
5. Running plain `pnpm install` (unfrozen) at root rewrites the root lockfile's frontend
   importer → drift between the two lockfiles. Use `--frozen-lockfile` unless you are
   intentionally changing deps.

## 4. pnpm v10 build-script gates (why esbuild must be allowed to build)

pnpm v10 blocks dependency postinstall scripts by default. Each workspace allowlists its
own (different syntax in each — both intentional):

| Workspace | Mechanism | Allowed |
|---|---|---|
| root | `pnpm.onlyBuiltDependencies` in `package.json:39-45` | `esbuild`, `bufferutil`, `utf-8-validate` |
| frontend | `allowBuilds:` map in `packages/frontend/pnpm-workspace.yaml:1-7` | `@clerk/shared: true`, `esbuild: true`; explicitly false: browser-tabs-lock, bufferutil, core-js, utf-8-validate |

`esbuild` must be allowed to run its install script in BOTH workspaces: its postinstall
provisions the platform-native binary, without which `vite build` and SST's Lambda bundling
fail. Verified installed and runnable: root esbuild 0.25.12, frontend esbuild 0.28.1
(nested under `node_modules/.pnpm/`, as vite's dependency) — versions as of 2026-07-07.

Expected (benign) root-install output — do not "fix" this warning:

```
╭ Warning ─────────────────────────────────────────────────────╮
│ Ignored build scripts: @clerk/shared, aws-sdk,               │
│ browser-tabs-lock, core-js.                                  │
│ Run "pnpm approve-builds" to pick which dependencies ...     │
╰──────────────────────────────────────────────────────────────╯
```

Do NOT run `pnpm approve-builds` casually — it edits the allowlist config, which is a
tracked-file change → **cellar-change-control**.

## 5. What works WITHOUT AWS credentials (most sessions)

All frontend work, the entire CI gate set, and read-only backend experiments need no AWS
account, no SST state, and no secrets.

### 5.1 Frontend dev server against a live API

```bash
cd packages/frontend
cp .env.template .env.local     # fill VITE_API_URL and VITE_CLERK_PUBLISHABLE_KEY
npx vite                        # standalone dev server, no SST needed
```

- `.env.local` is ONLY for standalone vite; `pnpm dev` (= `sst dev vite`,
  `packages/frontend/package.json:5`) injects the same vars from the SST stack instead
  (`packages/frontend/.env.template:1-7` — that file's comments are the ruling doc).
- `VITE_API_URL`: the prod API `https://comedycellar-api.mafz.al` (as of 2026-07-07), or a
  personal dev-stage API URL. Pointing at prod is read-mostly-safe but remember every GET
  is a real request; see **cellar-scraping-reference** etiquette if you script against it.
- `VITE_CLERK_PUBLISHABLE_KEY`: a Clerk *publishable* key (`pk_live_`/`pk_test_` — public
  by design; the prod one is baked into the prod bundle, per `.env.template:12-14`).
- Verified here: `npx vite --port 5199` printed `VITE v7.3.6 ready in 342 ms` and served
  HTTP 200 on localhost (2026-07-07). API calls then happen from *your browser*, so a
  sandbox with blocked egress can still start the server.

### 5.2 The full CI gate trio (the only CI that exists)

```bash
cd packages/frontend
pnpm exec eslint src        # expect: no output, exit 0
pnpm exec tsc --noEmit      # expect: no output, exit 0 — BUT see dist/ trap below
pnpm build                  # expect: vite build success in ~10s + chunk-size warning (normal)
```

**Trap — stale `dist/` breaks the typecheck.** `packages/frontend/tsconfig.json` sets
`allowJs: true, checkJs: true` (lines 7-8) and includes `"**/*"` with no `exclude`
(line 21), so once `pnpm build` has produced `dist/`, `tsc --noEmit` typechecks the built
bundles and fails with hundreds of errors in `dist/assets/*.js` (verified both ways,
2026-07-07). CI never sees this because it typechecks a fresh checkout before building
(workflow lines 50-54). Locally: run typecheck **before** build, or `rm -rf dist` first.
Errors in `dist/assets/*.js` mean stale build output, not broken code.

**Trap — a local `tsc` exit-0 is NOT CI-faithful; CI is RED on main.** With `dist/`
absent, `tsc --noEmit` exits 0 here **only** because the repo-root install (§2 install
#1) hoisted `@clerk/types` into root `node_modules`, where a directory walk-up resolves
it. `@clerk/types` is a **phantom dependency**: `packages/frontend/src/hooks/useAuth.ts:2`
imports it, yet only `@clerk/clerk-js` is declared in `packages/frontend/package.json`.
CI installs **only inside `packages/frontend`** (§3), so the import is unresolvable there
and tsc fails with `src/hooks/useAuth.ts(2,30): error TS2307: Cannot find module
'@clerk/types'` (exit 2). `frontend-ci.yml` has **never passed — it is red on main for
exactly this.** So a local two-install exit-0 does NOT mean CI will pass. Canonical home
for this fact (and the candidate fix — do NOT apply it here) is **cellar-validation-and-qa**
§1.

There is no lint/typecheck/test script in `packages/frontend/package.json` — CI calls the
tools directly (workflow lines 47-51); do the same. Root `pnpm test` is a failing
placeholder (`package.json:8`) and **zero tests exist in the repo** (as of 2026-07-07) —
see **cellar-validation-and-qa** for what counts as evidence instead.

### 5.3 Read-only backend experiments

Backend deps are hoisted flat into root `node_modules` (§3 rule 3), so quick probes work
from the repo root without any build step:

```bash
node -e "const c=require('cheerio'); const \$=c.load('<div class=x>hi</div>'); console.log(\$('.x').text())"
# expect: hi
```

Backend source is TypeScript with `@core/*` aliases and no runner dep (no tsx/ts-node), so
you cannot `node packages/core/foo.ts` directly — see **cellar-diagnostics-toolkit** for
the scripts/ probe patterns.

## 6. What REQUIRES AWS credentials + owner setup

| Command | Needs | Notes |
|---|---|---|
| `pnpm dev` (= `sst dev`) | AWS creds, root `.env` with Cloudflare vars, personal stage | deploys real AWS resources for your stage; anatomy in **cellar-run-and-operate** |
| `pnpm deploy:prod` / `remove:prod` | all of the above | **owner-only decision** — see **cellar-change-control** |
| `pnpm db` / `pnpm db:studio` (= `sst shell drizzle-kit ...`) | AWS creds + `DbUrl` secret | touches the ONE Supabase DB shared by all stages — treat as prod surgery, see **cellar-data-model** |
| `sst secret set/list` | AWS creds | rotation is owner-only; see **cellar-config-and-secrets** |

Before your first `sst dev`: SST defaults the stage to your OS username, and
`infra/config.ts:17` does `config[$app.stage]` over a map containing only `mohammadafzal`
and `prod` (lines 12-15). An unknown stage yields `undefined`, and `infra/api.ts:22`
(`config.clerkFrontendApi`) crashes the deploy. **A new dev stage needs an
`infra/config.ts` entry first** — that is an infra change; route it through
**cellar-change-control**. AWS credentials come from the standard SDK chain
(`~/.aws/credentials` or `AWS_*` env vars), not from `.env` (root `.env.template:4-5`).

Reservation safety note: `sst dev` stages are safe from real bookings —
`packages/core/createReservation.ts` only POSTs the real reservation when
`process.env.STAGE === "prod"`; every other stage returns the canned fixture. Never
change that gate (house rule; enforcement details in **cellar-change-control**).

## 7. `sst install` and the `.sst` platform types

`sst.config.ts:1` starts with `/// <reference path="./.sst/platform/config.d.ts" />`.
That `.sst/` directory is **generated, gitignored** (`.gitignore:5`), and only produced by
running the SST CLI (`sst install`, `sst dev`, or `sst deploy`). Until then:

```bash
pnpm exec tsc --noEmit    # at repo root
# expect FAILURE: TS2304 Cannot find name 'sst' / '$app' / 'aws' across infra/*.ts,
# plus TS18028 from @clerk/backend .d.ts (root tsconfig.json has no "target" set —
# it contains ONLY path aliases, tsconfig.json:1-8)
```

- In sandboxed/proxied environments, `pnpm exec sst install` fails with
  `Could not install pulumi: HTTP status 403` — the proxy blocks the pulumi binary
  download. **That is a sandbox limitation, not a project bug** (verified in this sandbox
  2026-07-07). Do not report it as breakage; do not disable TLS or fight the proxy.
- Plainly: **there is NO working backend typecheck gate** (as of 2026-07-07). Root
  `tsc --noEmit` fails even on a healthy machine until SST has generated `.sst/platform`,
  no CI covers backend/infra code, and no tests exist. Backend changes are verified only
  by the practices in **cellar-validation-and-qa**.
- `sst` CLI version installed here: 3.19.3 (spec `^3.17.25`, root `package.json:31`) —
  volatile, as of 2026-07-07.

## 8. Environment files and a gitignore trap

| File | Purpose | Gitignored? |
|---|---|---|
| root `.env` | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_EMAIL` for the SST CLI (root `.env.template:7-9`) | **NO** — root `.gitignore:15` covers only `.env*.local`; `git check-ignore .env` exits 1 (verified). The template says "Do NOT commit .env" (`.env.template:2`) but git will not stop you. Check `git status` before committing. |
| `packages/frontend/.env.local` | standalone-vite vars (§5.1) | yes — `packages/frontend/.gitignore:26` ignores `.env*` (template excepted on :27) |
| App secrets | live in AWS SSM via `sst secret set`, never in files (root `.env.template:11-19`) | n/a — see **cellar-config-and-secrets** |

## 9. Editor notes

- `.vscode/launch.json` is **stale SST v2**: it launches `sst start --increase-timeout`
  (lines 8-9), a CLI that no longer exists in SST v3. Use `pnpm dev` (= `sst dev`) in a
  terminal instead. (Fixing the file is a repo change → change control.)
- `.vscode/settings.json:2-4` hides `.sst/` from search only. It is NOT hidden from file
  explorers or `ls`; seeing it locally after running SST is normal.

## 10. Verified-environment checklist

Run top to bottom on a fresh clone; every expectation was observed 2026-07-07:

| # | Command (from repo root unless noted) | Expected |
|---|---|---|
| 1 | `node --version` | ≥ v22 (v22.22.2 here; CI uses 24) |
| 2 | `pnpm --version` | 10.23.0 (root; inside packages/frontend may differ — §1 quirk) |
| 3 | `pnpm install --frozen-lockfile` | `Done in ~2-3s` (warm) + the "Ignored build scripts" warning box (§4 — normal) |
| 4 | `cd packages/frontend && pnpm install --frozen-lockfile` | `Done in ~1-2s` (warm), no errors |
| 5 | `cd packages/frontend && pnpm exec eslint src` | silent, exit 0 |
| 6 | `cd packages/frontend && rm -rf dist && pnpm exec tsc --noEmit` | silent, exit 0 **locally** (dist/ present ⇒ §5.2 trap). Local exit-0 ≠ CI: CI is red on main via phantom `@clerk/types` (§5.2, **cellar-validation-and-qa** §1) |
| 7 | `cd packages/frontend && pnpm build` | `✓ built in ~9-10s`; `clerk-*.js` chunk ≈ 3.0 MB with a `(!) Some chunks are larger than 500 kB` warning — **normal, do not chase it** |
| 8 | `pnpm exec tsc --noEmit` (root) | FAILS with `Cannot find name 'sst'` — expected without `.sst/` (§7) |
| 9 | `cd packages/frontend && npx vite --port 5199` | `VITE v7.3.6 ready in ...ms`, HTTP 200 on localhost |
| 10 | `git status --short` | empty (nothing accidentally modified; build artifacts are ignored except root `.env` — §8) |

If 1-7 and 9-10 pass, the environment is good for all frontend and read-only work. Step 8
failing is the *expected* state everywhere SST hasn't run.

Anything beyond environment setup — changing deps, lockfiles, allowlists, `.npmrc`,
workspace layout, or CI — changes shared behavior: classify it and pass the gates in
**cellar-change-control** before touching main.

## Provenance and maintenance

Verified against commit `0f277a2b1accf50ae3c78165b3d30900fa3512ba` (2026-07-07) by reading:
root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` (importers), `.npmrc`,
`tsconfig.json`, `sst.config.ts`, `.gitignore`, `.env.template`, `.vscode/{launch,settings}.json`,
`infra/{config,api}.ts`, `.github/workflows/frontend-ci.yml`,
`packages/frontend/{package.json,pnpm-workspace.yaml,pnpm-lock.yaml,tsconfig.json,.env.template,.gitignore}`;
and by running: both frozen installs (offline), the CI trio (eslint/tsc/build), root
`tsc --noEmit` (observed failure mode), the dist/-breaks-tsc experiment (both states),
`npx vite --port 5199` smoke test, `git check-ignore .env`, `corepack --version`, and
version reads of installed sst/esbuild/vite. Carried over from the lead session's verified
notes (same date), not re-runnable offline: `pnpm exec sst install` → "Could not install
pulumi: HTTP status 403" in proxied sandboxes.

Re-verification one-liners for facts most likely to drift:

| Fact | Re-verify with |
|---|---|
| pnpm pin | `grep packageManager package.json` |
| CI node version + canonical workspace comment | `grep -n "node-version\|workspace root" .github/workflows/frontend-ci.yml` |
| Two workspace roots still separate | `ls packages/frontend/pnpm-workspace.yaml packages/frontend/pnpm-lock.yaml` |
| Root lockfile still carries frontend importer | `grep -n "packages/frontend:" pnpm-lock.yaml` |
| shamefully-hoist still set | `cat .npmrc` |
| Build-script allowlists | `grep -A4 onlyBuiltDependencies package.json; cat packages/frontend/pnpm-workspace.yaml` |
| dist/ tsc trap still live | `grep -n "checkJs\|include" packages/frontend/tsconfig.json` |
| Root .env still not gitignored | `git check-ignore .env; echo $?` (1 = not ignored) |
| Stage map entries | `grep -n "const config" -A4 infra/config.ts` |
| launch.json still stale | `grep -n "sst" .vscode/launch.json` (v2 if it says `start`) |
| Installed sst / vite versions | `node -e "console.log(require('./node_modules/sst/package.json').version)"` / `node -e "console.log(require('./packages/frontend/node_modules/vite/package.json').version)"` |
