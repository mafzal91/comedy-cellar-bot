---
name: cellar-frontier-and-method
description: Ranked open problems for comedy-cellar-bot (ship user notifications, scraper self-monitoring, backend test harness, data-quality repairs, multi-venue) each with the specific asset, first file-level steps, and a falsifiable milestone; plus the research discipline for turning a hunch into an accepted result here. Use when asked "what should we build next", "how do we make this self-running", "how do we ship notifications", when planning a new feature or experiment, or when deciding whether an idea is proven enough to promote. Not for live bugs or outages.
---

# Cellar frontier and method

Where this project can advance beyond today, and the discipline for getting there. Part 1 is a ranked backlog of open problems, each with its concrete first steps in THIS repo and a number that tells you when you have a result. Part 2 is how a hunch becomes an accepted change here without repeating the repo's past dead ends.

**When NOT to use this skill:**
- A day-to-day bug or misbehavior to diagnose → `cellar-debugging-playbook`.
- A scraper outage happening right now (stale data, cron failure emails, 403s) → `cellar-scraper-recovery-campaign`.
- Deciding a change's class/gates/approver, or actually shipping anything below → `cellar-change-control` (every item here terminates there; nothing on this list is authorized by being on this list).

Jargon (defined once): **stage** = an SST deployment environment (`prod` is live; `mohammadafzal` is the owner's dev stage). **SST** = the infra-as-code framework this repo deploys with. **owner** = mafzal91, sole author, only holder of AWS creds + prod secrets. **idempotent** = running it twice produces the same effect as running it once.

---

## Part 1 — Ranked open problems

Ranked by value-over-effort and by how much of the groundwork already exists. Each entry: why it's still open, the asset this repo already has, the first three steps at file level, and a falsifiable milestone.

### (1) Ship user notifications — SHOW notifications shipped, COMIC notifications still unbuilt

**Status (as of 2026-07-13).** SHOW notifications now ship end-to-end to real opted-in users — PR #62 (merged 2026-07-13, commit `5ceaf98`). The old "no user email has ever been sent / every path is admin-to-self" claim is now FALSE for show subscribers. What shipped, so you don't re-derive it:
- An **outbox table** `new_show_queue` (migration `0003`, `packages/core/sql/newShowQueue.sql.ts`): one row per newly-inserted show, `notifiedAt` NULL = pending, `queue_show_unique` unique index on `showId` so a show is queued at most once. Ingestion enqueues via `handleShowDetails.ts` — `createShows` now `.returning({ ..., inserted })` (Postgres `xmax = 0` ⇒ brand-new insert), and rows that are brand-new AND upcoming get `enqueueNewShows(ids)`. So **every** ingestion path — both crons AND the API cache-through — queues.
- A **third cron** `ShowNotificationCron` (`infra/cron.ts`, handler `packages/functions/cron/showNotificationCron.ts`), `cron(0/15 * * * ? *)` = every 15 min, same `IS_ACTIVE`/`IS_CRON` prod-gating as the other two. It holds the batch until the oldest queued show is `BATCH_WINDOW_MINUTES` (60) old — shows post over ~an hour, so latecomers ride the same email — then `claimPendingNewShows(...)` (`newShowQueue.ts:43-54`), an atomic `UPDATE ... WHERE notifiedAt IS NULL RETURNING` that is the idempotency guard so overlapping runs never double-announce.
- **User email plumbing**: `sendHtmlEmail({to, subject, html, text})` (`packages/core/email.ts:31-59`, `from: "Comedy Cellar Bot <notifications@mail.comedycellar.mafz.al>"`, `to: <user>`) is the user-facing channel; `sendEmail` (`:8-29`) is the ops/telemetry channel, sending from `notifications@mail.comedycellar.mafz.al` to the owner's `AlertEmail` address. A react-email template `packages/core/emails/newShowsEmail.tsx` (`renderNewShowsEmail({shows})`) renders it. Recipients = `getShowNotificationRecipients()` (`showNotification.ts:35-42`): `show_notification.enabled = true` AND `user.stage = SST_STAGE` (per-stage isolation).

**Two things remain open.**

**(1a) COMIC notifications — still unbuilt (the primary remaining notification ambition).** #62 shipped SHOW notifications only. **Nothing reads `comic_notification`** — `getShowNotificationRecipients` reads `show_notification` alone. The "notify me when a comic I follow is booked" feature the changelog promised twice (`packages/frontend/src/pages/Updates/data.ts:44-52` Nov 2024, `:29-32` Feb 2025 — *"You'll soon be able to receive notifications about your favorite comedians…"*) is still not built, and the one attempt, PR #44 "wip new comic email", died closed-unmerged (`cellar-failure-archaeology` Entry 10).

*The asset already in place* (so this is wiring, and now there's a shipped sibling to copy):
- Tables `comic_notification` and `show_notification` with the settings read/write API — `packages/functions/settings/index.ts` (`get`/`update` upsert both). Schema in `packages/core/sql/{comicNotification,showNotification}.sql.ts`; semantics in `cellar-data-model`.
- The entire SHOW pipeline (outbox + atomic claim + `sendHtmlEmail` + react-email template + stage-scoped recipients) as a **working template to mirror**, not green-field.

*First three steps (file-level):*
1. Write the trigger query as a **pure function in `packages/core`** so it is unit-testable with zero mocks: "acts newly linked to a show, joined to `comic_notification` rows with `enabled = true` for that show's comics, not yet notified." Keep it a query-returning function, not a side-effecting one. (Pure-function testing pattern: `cellar-validation-and-qa` §3a/§5.)
2. Add the **outbox/dedup table** the SHOW path already models — a per-(user, act/comic) ledger through the `cellar-data-model` migration workflow (`pnpm db generate` → review → `pnpm db migrate`, owner-gated). Do NOT lean on `show_notification`'s unique index for dedup: it is on `userId` **alone** (`user_show_unique`, `showNotification.sql.ts:33`). Mirror `new_show_queue`'s atomic-claim pattern (`newShowQueue.ts:43-54`) so re-runs are safe.
3. Reuse `sendHtmlEmail` + a new react-email template; wire the send into a cron **behind the same `IS_ACTIVE`/`IS_CRON` gate** with stage-scoped recipients, exactly as `showNotificationCron.ts` does — do not hardcode a stage check. Adding a flag/table is a config + schema axis — `cellar-config-and-secrets`, `cellar-data-model`.

*Milestone (you have a result when):* a dev-stage run emits **exactly the predicted N** comic notifications for a seeded scenario, and a second identical run emits **ZERO** (the outbox/claim holds — proven idempotent). Predict N before running (Part 2).

**(1b) Harden & monitor the just-shipped SHOW pipeline — shipped, UNPROVEN.** It went live 2026-07-13 with **zero tests and no production track record**; its idempotency rests entirely on the outbox + atomic claim + `queue_show_unique` — the design looks sound but is untested in the wild. Before trusting it, verify: idempotency under **overlapping cron runs** (two claims race, only one wins); the **60-min batch-window** behavior (a late trickle rides the same email; nothing is stranded); **failure handling** (a `sendHtmlEmail` rejection alerts the owner (via `sendEmail` to the `AlertEmail` address) but does NOT un-claim the rows — a partial send is not retried); and **per-stage isolation** (`user.stage = SST_STAGE`).

*Milestone (hardening):* a seeded dev-stage run sends **exactly the expected N** emails, and an immediately-overlapping run (or re-run) sends **0** — proving the claim guard holds under the concurrency it was built for.

**Promotion.** Broadening outbound email further — COMIC notifications, or widening SHOW recipients beyond today's opt-in + stage scope — is a product + consent change: **owner decision + `cellar-change-control`** (§5 explicitly gates "anything that sends email/Slack/notifications to anyone other than the owner"). #62 cleared that bar for SHOW notifications; a new channel clears it again.

### (2) Scraper self-monitoring

**Why it's open.** The defining incident (Sep-2024 anti-bot breakage) went undetected for up to 5 months because nobody was watching and there is no monitoring — the only failure signal is an alert email to the owner that only fires on an *exception*, not on *silent staleness* (`syncCron.ts:90-97`). See `cellar-failure-archaeology` Entry 1 and Entry 4.

**The asset.** Data freshness is already derivable from our **own public API** — no scraping, no AWS internals needed. The freshness canary and its interpretation live in `cellar-diagnostics-toolkit` (`freshness-check.sh`); the recovery campaign's Phase 0 also computes "newest act-bearing show in the DB." A monitor is that canary on a schedule with an alarm.

**First three steps:**
1. Reuse the freshness canary from `cellar-diagnostics-toolkit` unchanged — it hits the public API (`https://comedycellar-api.mafz.al`, non-secret), so it needs no credentials and touches no scraper.
2. Schedule it as a **GitHub Actions cron hitting the PUBLIC API** — candidate, zero AWS infra, keeps it off the SST/Lambda deploy path. (This is a *candidate*, not a decided design.)
3. Decide an alert channel. **Do not reuse `packages/core/slack.ts`**: it is dead code (orphaned when the Partiful cron was reverted) that still contains a committed **live** webhook secret. It must be rotated/removed first — rotation is owner-only (`cellar-change-control` §5); history in `cellar-failure-archaeology` Entry 2 & 14. Email-to-admin (the existing `email.ts` path) is the lower-risk default.

**Milestone:** a deliberately-stale scenario (freeze/seed the freshness input to look N days old) trips the alarm within **one cron cycle**, with **zero false alarms over a week** of normal operation.

### (3) Backend test harness

**Why it's open.** There is **zero** backend test coverage today; the only automation is the frontend CI trio — now GREEN as of 2026-07-13 (PR #63 declared the phantom `@clerk/types` dependency, merged 2026-07-12; it had failed every prior run) — but that trio covers only the frontend, so there is still **no backend CI at all** (`cellar-validation-and-qa` §1). The *how-to* — vitest at the root workspace, the alias config, the first pure-function targets — is fully specified in `cellar-validation-and-qa` §5 as a CANDIDATE plan. **This entry states only the frontier goal; do not duplicate that plan here.**

**Milestone:** a `parseLineUp` fixture test **catches a simulated CSS-selector rename** (e.g. `.lineup` → `.line-up` in the fixture, or the parser changed to look for the wrong class) by failing **in CI**, gating the merge. That is the first time a backend regression is caught by a machine instead of by a user noticing empty listings.

### (4) Data-quality repairs

**Why it's open.** Several defects are latent (they don't crash, they quietly return wrong data), so nobody has been forced to fix them. Each is verified below — re-verify before acting.

| Defect | Evidence (verified 2026-07-07) | Effect |
|---|---|---|
| N-plicated shows + wrong totals | `getShows`/`getShowsCount` `innerJoin(act)` then `innerJoin(comic)` with **no GROUP BY / DISTINCT** — `packages/core/models/show.ts:214-223` and `:242-248` (shifted ~+7 by #62's `.returning`) | A show with N comics appears **N times** in `/api/shows/new`; `total` counts act-rows, not shows |
| Act-less specials invisible | same `innerJoin(act)` — a show with no parsed lineup has no act rows to join | Specials never appear in `/api/shows/new` at all |
| `/api/shows/scan` always `[]` | `scanShows` → `handleShowList({days})` → `getFutureDatesByDay(days, undefined)`; `new Date(undefined)` = Invalid Date and date-fns v4 `eachDayOfInterval` returns `[]` — `packages/functions/shows/index.ts:94-107`, `packages/core/handleShowList.ts:11`, `packages/core/getFutureDatesByDay.ts:21-31` | The scan endpoint returns `[]` for every request |
| Comic identity forks on variants | Comic dedup is exact/case-insensitive **name-string** equality (`cellar-data-model` §3) | Diacritic/spelling/punctuation variants ("Dave Attell" vs "Dave Attel") become separate comic rows forever; no merge tooling |

**First three steps** (pick the N-plication defect as the anchor — it's the most user-visible): 1. reproduce with a count probe against the public API (dedup show `.id` vs raw `total`; recipe in `cellar-validation-and-qa` §6 caveat and `cellar-diagnostics-toolkit`); 2. change the query to `GROUP BY show.id` / DISTINCT or restructure the join, and decide the specials story (`innerJoin` → `leftJoin` on act, or a separate specials path) — this is a backend-logic change, `cellar-change-control`; 3. add the pinning test from item (3) so the fix can't silently regress.

**Milestone:** `/api/shows/new` returns **each show exactly once** with a **correct total** (proven by a count query: `unique .id` count == `total`), **and specials are present**. Fixing `/api/shows/scan` has its own milestone: the endpoint returns non-empty data for a date range with known shows.

**Executable version:** this section is the *why/what*; the decision-gated *how* — numbered phases, exact measurement commands, expected numbers at every gate, ranked fix menus, and fenced wrong paths — is `cellar-data-quality-campaign`. Data quality is the owner-designated hardest live problem (2026-07-07), so that campaign is the flagship for it.

**Caution.** Comic-row merges touch the **shared** prod database — prod surgery, owner-only (`cellar-change-control` §2c, `cellar-data-model` §8). Do not `DELETE`/`UPDATE` comic rows to "clean up" without an approved plan.

### (5) Multi-venue generalization — SPECULATIVE tier

**Label: fully speculative. No schema assumptions. Owner call before any code.** Listed because the request already parameterizes the venue and the club has other rooms/cities.

**The asset.** The lineup request body already carries a `venue` field, hardcoded `"newyork"` — confirm at `packages/core/fetchLineUp.ts:12`. Everything downstream assumes one venue and one timezone (`America/New_York`, hardcoded in many places — `cellar-scraping-reference`, `cellar-data-model`).

**First step (only):** a **READ-ONLY, one-polite-request-per-candidate** probe of the venue parameter space — vary the `venue` value and observe response shape, nothing more. This is a scraping-behavior change the instant it touches `comedycellar.com`, so it is owner-gated and must obey the politeness rules (serial, sleeps, no parallel hammering — `cellar-change-control` §2b, `cellar-scraping-reference`). Do not design a schema for multiple venues until a probe proves the endpoint even accepts other values.

**Milestone:** a single documented probe run shows, per candidate venue value, whether the endpoint returns a real lineup, an empty page, or a rejection — i.e. you know the venue parameter space before touching any table.

---

## Part 2 — Research method: how a hunch becomes an accepted result here

This repo has been burned by acting on partial explanations. The discipline below is reconstructed from its own history; each rule cites the incident that paid for it.

### The evidence bar: one mechanism must explain ALL observations, including the negatives

Do not act until a single mechanism accounts for every observation you have — *especially* the ones where nothing happened. Two worked examples from this repo:

- **The pagination saga.** Infinite scroll "loading forever" got three partial fixes over four months (`ebc8f5a` 2024-11-24 → `a9a902b`/PR #39 → `42ab4ac` 2025-01-04) before the real root cause landed in `6c3da50` 2025-03-13: `getNextPageParam` returned an offset **unconditionally**, so TanStack Query never learned the list had ended. The partial fixes each "worked on page 1" — which is exactly the negative they failed to explain (what happens at the *end*?). Full account: `cellar-failure-archaeology` Entry 6. (SHAs/messages verified locally 2026-07-07.)
- **The `.no-shows` discovery.** An empty scrape result had a **legitimate** meaning: comedycellar.com serves a `.no-shows` HTML fragment on days with no shows. `f8b6976` (2024-10-25, "Checking for empty lineup from cc") taught the parser to return `[]` for it. Lesson: "empty" is not automatically "broken" — a hypothesis has to explain *why* empty, not just flag it. Full account: `cellar-failure-archaeology` Entry 8.

### Predict the number before you run

Write down the expected count/observation **before** executing the check. A hypothesis that doesn't predict a number isn't testable here. The decision gates in `cellar-scraper-recovery-campaign` model this (each phase states the expected observation, and a *different* observation routes you to a different branch); the acceptance-threshold table in `cellar-validation-and-qa` §6 is the same discipline for feature work. "Looks right" is not a result; "emitted exactly N, then 0" is.

### The idea lifecycle

```
personal itch
   → env-flagged experiment on a DEV stage (never prod, never a real side effect)
   → MEASURED against a threshold you declared in advance
   → EITHER promoted through cellar-change-control
      OR removed cleanly AND logged in cellar-failure-archaeology
```

The lifecycle is **not done until the cleanup is done.** Case study: the Partiful availability cron. It was added (`1d3d5fd`, 2026-01-23 12:19) and removed (`a762657`, 2026-01-24 02:03) about **14 hours later** (13h44m — SHAs/timestamps verified locally; note the removal was *correct*). But the removal left `packages/core/slack.ts` orphaned in the tree **with a live webhook secret still in it** — so the "remove cleanly" step was never actually completed, and that dead file is now a standing liability (`cellar-failure-archaeology` Entry 2 & 14). Removing an experiment means removing *all* of it, including the plumbing it dragged in.

### Where good ideas have historically come from here

Three sources, all attested in the history — use them as precedent, not as the only options:

| Source | Precedent (verified) | Note |
|---|---|---|
| **Breakage-driven** | The Sep-2024 anti-bot fix (`122ccf5`, "fixed request headers") — a 5-month outage forced the return | `[GitHub-only]` SHA, per `cellar-failure-archaeology` Entry 1; the captured token it added is still load-bearing (see below) |
| **Itch-driven** | Comic search burst (PRs #41–#43, Sep 2025); the whole vintage-marquee redesign (Jun–Jul 2026) | Small personal itches, shipped as normal PRs |
| **Agent-assisted planning** | `plan/IMPLEMENTATION_PLAN.md` — the multi-agent re-skin plan is the repo's **own artifact** of orchestrated work: ~47 agents in barrier-separated waves (`:222-229`), safe because of one ownership rule (`:15-17`: edit only your files, import anything) | Cite as precedent for orchestrated/parallel work; the ownership rule is now the standing rule in `cellar-change-control` §3 |

### Standing live risk to weigh in any roadmap

The scraper's `x-code-localize` anti-bot token is **662 days old (~22 months) as of 2026-07-07** — verified by running `cellar-scraper-recovery-campaign/scripts/token-age.sh` (prints age, never the secret). The >12-month standing order is already triggered. Any multi-month plan should assume this token can be invalidated at any time, taking all scraping down (Problem 2 above is the mitigation). Never copy the token value anywhere; anatomy lives in `cellar-scraping-reference`, incident history in `cellar-failure-archaeology` Entry 1.

---

## Provenance and maintenance

Verified 2026-07-07 against the working tree at branch `claude/skill-library-continuity-4m3x56` (== `main`). Established by **reading**: `packages/frontend/src/pages/Updates/data.ts` (the notification promises, lines 29-32 / 44-52), `packages/core/email.ts` (`sendEmail` sends from `notifications@mail.comedycellar.mafz.al` to the owner's `AlertEmail`; `sendHtmlEmail` sends to a user), `packages/functions/settings/index.ts` (notification read/write, no send), `packages/core/sql/showNotification.sql.ts` (`user_show_unique` on userId alone) and `comicNotification.sql.ts`, `packages/functions/cron/{newShowCron,syncCron}.ts`, `packages/core/fetchLineUp.ts` (`venue: "newyork"`), `packages/core/getFutureDatesByDay.ts` + `packages/core/handleShowList.ts` + `packages/functions/shows/index.ts:94-107` (the scan-returns-`[]` chain), `packages/core/models/show.ts:207-246` (innerJoin N-plication), `plan/IMPLEMENTATION_PLAN.md:15-17,222-229`. Established by **running** (read-only): `git log -1` on `f8b6976`, `ebc8f5a`, `42ab4ac`, `6c3da50`, `1d3d5fd`, `a762657`, `66ce813` (SHAs/dates/messages confirmed); `cellar-scraper-recovery-campaign/scripts/token-age.sh` (output: 662 days). Pre-graft SHAs (`122ccf5`) are **[GitHub-only]** — not in this shallow clone; carried from `cellar-failure-archaeology` and labeled there.

**Reconciled 2026-07-13 against commit `5ceaf98` (== `main`).** Two facts moved since the 2026-07-07 pass: (i) **SHOW notifications shipped** — PR #62 added the `new_show_queue` outbox (migration `0003`, now four migrations `0000`–`0003`), a third cron `ShowNotificationCron`, `sendHtmlEmail` + a react-email template, and `getShowNotificationRecipients` now READS `show_notification` to email opted-in users; so problem (1) is reframed to COMIC notifications (still unshipped) + hardening the new SHOW pipeline. COMIC notifications remain unbuilt (nothing reads `comic_notification`). (ii) **Frontend CI is now GREEN** — PR #63 declared `@clerk/types` in `packages/frontend/package.json` (merged 2026-07-12); backend CI and backend tests are still zero. Re-anchored: `show.ts` join line numbers shifted ~+7 (getShows `214-223`, getShowsCount `242-248`) from #62's `.returning` add. Verified 2026-07-13 by reading `packages/core/email.ts` (both `sendEmail` self-email and `sendHtmlEmail` user channel), `packages/functions/cron/showNotificationCron.ts`, `packages/core/models/{newShowQueue,showNotification}.ts`, `infra/cron.ts` (three crons), `packages/frontend/package.json` (`@clerk/types` present), and `ls migrations/`.

Cross-referenced siblings whose content is NOT restated here: `cellar-change-control` (the promotion terminus for every item), `cellar-failure-archaeology` (Entries 1, 2, 4, 6, 8, 10, 14), `cellar-validation-and-qa` (§3a/§5/§6 — test harness plan, pure-function protocol, acceptance thresholds), `cellar-data-model` (schema, migration workflow, comic identity), `cellar-config-and-secrets` (env-flag add-one checklist), `cellar-diagnostics-toolkit` (`freshness-check.sh` canary), `cellar-scraper-recovery-campaign` (decision gates, token-age.sh), `cellar-debugging-playbook` and `cellar-scraping-reference` (pointers only).

| Volatile fact | One-line re-verification |
|---|---|
| SHOW notifications ship to users (#62); COMIC notifications still unshipped | `grep -n "sendHtmlEmail" packages/core/email.ts` (present) and `grep -c 'new sst.aws.Cron' infra/cron.ts` (expect `3`); COMIC: `grep -rln "comicNotification\|comic_notification" packages/functions/cron/` (expect empty — no cron sends comic emails) |
| Frontend CI green since #63; still zero backend CI | `grep -n "@clerk/types" packages/frontend/package.json` (now present) |
| Changelog still promises notifications | `sed -n '29,32p;44,52p' packages/frontend/src/pages/Updates/data.ts` |
| `show_notification` still unique on userId alone | `grep -n "user_show_unique\|uniqueIndex" packages/core/sql/showNotification.sql.ts` |
| `/api/shows/scan` still returns `[]` | `grep -n "getFutureDatesByDay(days, fromTimestamp)" packages/core/handleShowList.ts` and that `scanShows` passes no `fromTimestamp` |
| `getShows` still N-plicates (no GROUP BY/DISTINCT) | `sed -n '214,248p' packages/core/models/show.ts` (expect `innerJoin(act)`, no `groupBy`) |
| `venue` still hardcoded | `grep -n 'venue:' packages/core/fetchLineUp.ts` (expect `"newyork"`) |
| `slack.ts` still orphaned with committed webhook | `grep -rln "core/slack" packages/ infra/ --include='*.ts'` (expect no importers) |
| Token age (recompute) | `bash .claude/skills/cellar-scraper-recovery-campaign/scripts/token-age.sh` |
| Still zero backend tests | `find packages infra -name "*.test.*" \| grep -v node_modules` (expect empty) |
