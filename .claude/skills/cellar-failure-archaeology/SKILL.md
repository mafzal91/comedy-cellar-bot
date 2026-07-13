---
name: cellar-failure-archaeology
description: Chronicle of every settled investigation, dead end, and revert in comedy-cellar-bot, each as Symptom → Root cause → Evidence (SHA/date/path) → Status. Use when a bug looks familiar, before re-attempting something that may have been tried and abandoned (Cognito, Sentry, Slack notifications, multi-day sync), when asked "why is this dead code here" (core/slack.ts, frontier.ts, commented Sentry), or when writing a post-incident entry.
---

# Cellar Failure Archaeology

History of battles already fought in this repo, so nobody re-fights one. Each entry: **Symptom → Investigation → Root cause → Evidence → Status**. This file is append-only history: never rewrite a past entry except to update its Status line (see "How to add an entry" at the bottom).

**When NOT to use this skill:** for live triage of a current symptom, use `cellar-debugging-playbook` (symptom→experiment tables). For a scraper outage happening right now, use `cellar-scraper-recovery-campaign`. For the comedycellar.com endpoint/token contracts themselves, use `cellar-scraping-reference`. For what is *allowed* to change, use `cellar-change-control`.

## Reading the evidence: the shallow-clone trap

The local checkout is a **shallow clone grafted at 2024-10-11** (81 commits; oldest local commits `1265e71`, `b697c94`, `e8154b5` — see `.git/shallow`). Commits before that date exist only on GitHub and are marked **[GitHub-only]** below — `git show <sha>` on them fails locally with "unknown revision"; that is the graft, not a wrong SHA.

```bash
# Verify any post-2024-10-11 SHA cited below (read-only):
git log -1 --format='%h %ad %s' --date=iso <sha>
# Confirm the graft boundary:
git log --oneline | tail -3 && cat .git/shallow
```

## Era timeline (as of 2026-07-07)

| Era | Dates | Character | Anchor commits |
|---|---|---|---|
| 1. Bot origins | 2023-12-24 → 2024-02-23 | Init, lineup scraper, reservation endpoint, Sentry | `4e21da9`, `97ac795`, `35dc6cb`, `a5093ee` [all GitHub-only] |
| 2. Monorepo consolidation | 2024-04-06 → 2024-04-13 | Frontend merged in, custom domain, DST fix | `c43a806`, `6886326` [GitHub-only] |
| Dormancy #1 | 2024-04-13 → 2024-09-13 | ~5 months silence; scraper broke unnoticed | — |
| 3. Revival & productization | 2024-09-13 → 2024-11-03 | Anti-bot fix, SST v3, Drizzle, crons, Clerk auth (~28 PRs / 7 weeks) | `122ccf5` [GitHub-only], `6420d6f`, `167a37b` |
| 4. Reliability & notifications scaffolding | 2024-11-24 → 2025-03-13 | Retry/backoff, reservation mock, migration squash | `adafd66`, `391196d`, `8b3b837`, `6c3da50` |
| Dormancy #2 | 2025-03-13 → 2025-09-02 | 173 days (verified from local log) | — |
| 5. Search burst | 2025-09-02 → 2025-09-14 | Comic search, Updates page, URL-persisted search | `56581a9`, PRs #41–#43 |
| Dormancy #3 | 2025-09-14 → 2026-01-18 | 126 days | — |
| 6. Maintenance + side-quests | 2026-01-18 → 2026-01-24 | Tailwind v4, dep updates, Frontier proxy, Partiful cron arc | `72b2eaf`, `4e71996`, `1d3d5fd`→`a762657` |
| Dormancy #4 | 2026-01-24 → 2026-06-29 | 156 days | — |
| 7. AI-agent redesign | 2026-06-29 → 2026-07-03 | pnpm, design handoff, "Vintage marquee" reskin + polish tail | `c17b999`, `66ce813`, `75029b8`, `c8d9918` |

Rhythm: burst–dormancy–burst. Solo project; prod runs unattended for months at a time (entry 12).

---

## Entry 1 — Sep-2024 anti-bot outage (the defining incident)

- **Symptom:** scraping of comedycellar.com stopped working at some point during Dormancy #1 (2024-04-13 → 2024-09-13). Exact break date unknown — no monitoring, project dormant; the outage could have lasted up to 5 months.
- **Investigation:** comedycellar.com had deployed a header-based anti-bot check. The fix captured live request headers from a real browser session in DevTools.
- **Root cause:** upstream anti-bot deployment; the existing defense (random User-Agent per cold start, from PR #2 `411fa43` [GitHub-only]) was no longer sufficient.
- **Evidence:** fix commit `122ccf5` "fixed request headers", 2024-09-13 [GitHub-only]. The fix is still live in `packages/core/requester.ts:12-14`: a hardcoded `x-code-localize` header (SECRET — never copy its value anywhere; see `cellar-config-and-secrets`) plus `x-page-creation: +new Date()`. The token's base64 tail decodes to Unix timestamp `1726188037` (= 2024-09-13 00:40 UTC, the capture date) concatenated with the author's residential IP — a mild PII leak committed to the repo.
- **Status:** FIXED, but **load-bearing time bomb**. The captured token has worked unchanged for ~22 months (as of 2026-07-07). If the site starts validating or expiring it, all scraping dies again → `cellar-scraper-recovery-campaign`. Token anatomy and etiquette: `cellar-scraping-reference`.

## Entry 2 — The Partiful availability-cron arc (~14-hour lifespan)

Nothing to do with Comedy Cellar — a personal waitlist sniper deployed on this stack because the plumbing was lying around (entry 14).

- **Timeline (all timestamps verified locally, `--date=iso`):**
  1. `1d3d5fd` 2026-01-23 12:19:45 -0500 (PR #48) — added a 5-minute cron (`infra/cron.ts` +13), `packages/core/slack.ts` (+118), `packages/functions/cron/eventAvailabilityCron.ts` (+165). Scraped one hardcoded Partiful event URL (`partiful.com/e/G85U206a6eTvJdIxti8k`, an "Akdeniz Restaurant dinner meetup"), parsed obfuscated CSS classes for "X/Y spots left", posted to Slack every run, emailed when spots opened.
  2. `441e262` 2026-01-23 12:37:26 (**18 minutes later**) — schedule 5→10 min, flipped notification logic (email every run, Slack only when spots open): the Slack firehose was immediately annoying.
  3. `a762657` 2026-01-24 02:03:21 (**13h44m after creation**) — "Remove event availability cron job and related functionality", −176 lines.
- **Root cause of death:** single-purpose ephemeral tooling — one hardcoded event, no configurability; once the dinner was handled the cron had no reason to exist.
- **The orphan it left behind:** `a762657` removed the cron and handler but **not `packages/core/slack.ts`** (118 lines, exports `sendSlackMessage` and `formatEventAvailabilityMessage`; zero importers — verified by grep 2026-07-07). Lines 3-9 contain a **live Slack webhook URL** as string fragments joined from an array literal (a committed secret, never rotated in repo history). Do not reproduce any fragment anywhere; handling → `cellar-config-and-secrets`.
- **Status:** REVERTED. Orphaned `core/slack.ts` with committed webhook still in tree (as of 2026-07-07). Deleting it is a behavior-neutral cleanup candidate, but rotation of the webhook is owner-only → `cellar-change-control`.

## Entry 3 — Cognito → Clerk, reversed in one day

- **Symptom (historical decision, not a bug):** AWS Cognito auth was built and abandoned within ~24 hours.
- **Evidence:** `7de294d` 2024-10-11 added Cognito (460+ lines) [GitHub-only]; `6420d6f` 2024-10-12 12:09 "Switched to clerk" (local, verified) deletes `infra/cognito.ts` and `packages/frontend/src/utils/cognitoConfig.ts`, rewrites the Auth pages, adds `utils/clerk.ts`. Migration completed across PRs #26–#30 (including the prod-config stumble in entry 13).
- **Root cause:** not recorded in commit messages. The observable fact is only the speed of the reversal; do not invent a rationale.
- **Status:** SETTLED — Clerk is the auth provider. Do not propose Cognito again without new evidence; auth-provider swaps are owner-only → `cellar-change-control`.

## Entry 4 — Sentry added, then abandoned; email became the only telemetry

- **Evidence:** added `a5093ee` 2024-02-20 (PR #4) [GitHub-only]. "Removed" by `56afdca` 2024-10-14 14:14 — which actually just **commented out** the frontend `Sentry.init` block. The commented block (with DSN) is still at `packages/frontend/src/index.tsx:20-26`, a commented `Sentry.captureException` at `:53`, and `@sentry/browser` is **still a dependency** (`^10.34.0`, `packages/frontend/package.json`, as of 2026-07-07).
- **Root cause:** zero-ceremony abandonment; no replacement chosen.
- **Consequence:** since 2024-10-14 the only *error/telemetry* channel is admin self-email (`packages/core/email.ts` `sendEmail` → `to: FromEmail`, admin-to-self — still unchanged as of 2026-07-13). ("Users are never emailed" was true through `c8d9918` but is no longer universally true: a separate user-facing channel `sendHtmlEmail` shipped 2026-07-13 for SHOW notifications only — entry 10 — and carries no error/telemetry.) The error channel then grew its own bug tail:
  - `953e0ef` 2024-10-29 "fixed error in email" — the syncCron failure email had the wrong subject ("New Show Cron") and no error detail; fix added message+stack and subject "Sync Show Cron". Same commit cut sync chunking from 10 dates to 1.
  - `5e92e5f` 2024-11-24 "Only send email if there are shows" — noise reduction.
  - `8af1a1c` (PR #21) [GitHub-only] — throttled cron email to 6-hourly.
- **Status:** REMOVED / OPEN — no error monitoring exists. Reinstating observability is a ranked open problem → `cellar-frontier-and-method`.

## Entry 5 — Feb-2025 migration squash (one-way door)

- **What happened:** `8b3b837` 2025-02-05 23:55 (PR #40) deleted all 18 accumulated Drizzle migrations (`0000_nostalgic_the_fallen` … `0017_rich_sebastian_shaw`, plus meta snapshots) and re-baselined to exactly 3: `0000_closed_mattie_franklin`, `0001_pale_nighthawk`, `0002_light_miss_america` (verified via `git show --stat 8b3b837`). A fourth migration `0003_dizzy_lady_ursula` was later **appended** (PR #62, 2026-07-13, the `new_show_queue` outbox table — entry 10), so `ls migrations/*.sql` now shows four (0000–0003, as of 2026-07-13).
- **Implication:** the prod database's drizzle migration journal was manually reconciled to the new baseline — a risky, undocumented operation against the **single Supabase DB shared by all stages**. Anything assuming the old migration chain is wrong.
- **Root cause (motivation):** 18 migrations of churn from the Oct-2024 schema burst; PR #40 was a model refactor.
- **Status:** DONE — the squash held with zero schema changes from 2025-02-05 until 2026-07-13, when migration `0003` was added (PR #62). Crucially `0003` was a **proper append**, not another squash — it *vindicates* the append-only migration rule rather than repeating this incident. Never re-baseline casually: migration work follows `cellar-data-model` workflow, and journal surgery on the shared DB is prod surgery → `cellar-change-control`.

## Entry 6 — The pagination/infinite-scroll saga (4 commits, 4 months)

- **Symptom:** Comics list infinite scroll kept loading forever / loader misbehaved.
- **Timeline:** `ebc8f5a` 2024-11-24 "Comic search and pagination wip" → `a9a902b` 2025-01-04 (PR #39) "Added lazy loading to comics list" → `42ab4ac` same day "Fixed lazy loading comic loader" → `6c3da50` 2025-03-13 "fixed infinite loading" (all verified locally).
- **Final root cause (verified in `6c3da50` diff):** `getNextPageParam` returned `lastPage.offset + lastPage.limit` **unconditionally**, so TanStack `useInfiniteQuery` never learned the list had ended. Fix: return `undefined` unless `allPages.length < lastPage.total / lastPage.limit` — current code at `packages/frontend/src/pages/Comics/index.tsx:33-38`.
- **Lesson:** infinite scroll needs a termination condition proved against `total`; "works on page 1" is not evidence → `cellar-validation-and-qa`.
- **Status:** FIXED.

## Entry 7 — Timezone bug class (recurring)

| Commit | Date | Bug | Verified |
|---|---|---|---|
| `1fcff16` (PR #7) | 2024-02-22 | prod-deploy timezone issues | [GitHub-only] |
| `6886326` | 2024-04-13 | default TZ was `Etc/GMT+5` — a **fixed** UTC−5 offset (POSIX sign reversal), so after US DST started 2024-03-10 every time was off by 1h; fixed to `America/New_York` | [GitHub-only] |
| `64b3ee2` (PR #61) | 2026-07-02 | Calendar grid ignored the selected year (built dates from the current year); fix threads `selectedYear` through grid computation + adds Today button (`packages/frontend/src/components/Calendar.tsx`) | local diff |

- **Still-live traps in this class** (details + experiments in `cellar-debugging-playbook`): `syncCron.ts:49-51` mixes UTC `startOfDay` with NY zoning (off-by-one-day window in UTC evening = NY evening); `getFutureDatesByDay` without a `fromTimestamp` silently returns `[]`.
- **Status:** individual bugs FIXED; the **class is recurring**. Any date logic: club timezone is hardcoded `America/New_York`; show identity is Unix seconds.

## Entry 8 — Empty-lineup hardening (`.no-shows` sentinel)

- **Symptom:** "undefined lineups" from the scraper on days with no shows.
- **Investigation:** `a9e371c` 2024-10-22 00:06 "Debugging undefined lineups" — defensive rework of `handleLineUp.ts`, `fetchLineUp.ts`, `shows/index.ts`.
- **Root cause:** comedycellar.com's lineup API returns an HTML fragment containing a `.no-shows` element on empty days; the parser assumed `.lineup` elements always exist.
- **Fix:** `f8b6976` 2024-10-25 01:03 (PR #33) — `parseLineUp` rewritten to detect `.no-shows` and return `[]` (still current at `packages/core/parseLineUp.ts:60`), plus `.trim()` on names and structured act parsing.
- **Status:** FIXED. The parse contract lives in `cellar-scraping-reference` — do not restate it here.

## Entry 9 — Comic upsert conflict (ended Dormancy #2)

- **Symptom:** Postgres duplicate-key errors on comic creation.
- **Root cause:** `createComics` used `onConflictDoNothing({ target: comic.name })`. `ON CONFLICT (name)` only suppresses conflicts on the plain unique constraint on `name`; the table **also** has a case-insensitive unique index on `lower(name)` (`packages/core/sql/comic.sql.ts:34-36`), and conflicts raised by that index were not covered → insert threw.
- **Fix:** `56581a9` 2025-09-02 01:13 — drop the target: `onConflictDoNothing()` swallows any conflict (verified diff, `packages/core/models/comic.ts`).
- **Side effect to remember:** comic identity is exact/case-insensitive name-string equality; accent or typo variants still create new rows → `cellar-data-model`.
- **Status:** FIXED.

## Entry 10 — PR #44 and the notification ambition (SHOW notifications shipped 2026-07-13; COMIC notifications still OPEN)

- **Fact (do not oversell in either direction):** through `c8d9918`, **user notifications had never been sent, ever** — notification tables and the settings UI existed (`cellar-data-model`) but nothing read them to send. That changed on **2026-07-13**: SHOW notifications now ship end-to-end (see UPDATE below). COMIC notifications — the actual PR #44 goal — are **still not shipped**: nothing reads `comic_notification` to send anything (it is read only by the settings API, `packages/functions/settings/index.ts`, for preference read/write). The old admin-to-self path also still exists (`packages/core/email.ts` `sendEmail` → `to: FromEmail`) as the ops/telemetry channel.
- **The promises:** the public Updates page committed to them twice — `packages/frontend/src/pages/Updates/data.ts:29-32` (Feb 2025, "You'll soon be able to receive notifications…") and `:44-52` (Nov 2024, "Phase 1" ×2). Verified 2026-07-07.
- **The one attempt (comic email):** PR #44 "wip new comic email" (branch `feature/new-comic-email`, created 2026-01-19, closed unmerged) — the only dead PR in project history. [GitHub-only: the branch is no longer on the remote; `git branch -r` shows only `main` and one claude branch.] Its goal — notify when a followed comic is booked — remains unbuilt.
- **UPDATE (2026-07-13, PR #62, commit `5ceaf98`):** SHOW notifications shipped — the first user-facing email the project has ever sent. Plumbing: a `new_show_queue` outbox table (migration `0003`, entry 5), enqueued from every ingestion path (`handleShowDetails.ts` via `createShows`'s new `inserted` flag → `enqueueNewShows`); a **third** cron `ShowNotificationCron` (every 15 min, `packages/functions/cron/showNotificationCron.ts`) that holds a 60-min batch window, atomically claims rows (`claimPendingNewShows` — the double-send guard), renders a react-email template (`packages/core/emails/newShowsEmail.tsx`), and sends to opted-in users via the new user-facing channel `sendHtmlEmail` (`packages/core/email.ts`). Recipients = `show_notification.enabled = true AND user.stage = SST_STAGE` (`getShowNotificationRecipients`, reads `show_notification` only). **Unproven:** zero automated tests, no production track record — idempotency rests on the outbox + atomic claim + `queue_show_unique` unique index; the design looks sound but is untested in the wild. Say "shipped, unproven," not "solved."
- **Status:** SHOW notifications DONE-but-UNPROVEN (2026-07-13); COMIC notifications OPEN — still the project's largest unshipped notification ambition. First steps and falsifiable milestones: `cellar-frontier-and-method`. Shipping the comic path — or hardening the new show path — is a behavior change with real user impact → `cellar-change-control`.

## Entry 11 — Redesign polish tail: 4 fix rounds in 10 hours

- **What happened:** the "Vintage marquee" big-bang reskin `75029b8` (PR #59) landed 2026-07-02 15:28 -0400. Then, all verified locally:

| Commit | Time (-0400) | Fix |
|---|---|---|
| `2fd6b30` (PR #60) | 07-02 21:05 | mobile show cards, auth/header clipping on small screens |
| `64b3ee2` (PR #61) | 07-02 22:47 | Spotlight simplification, calendar year bug (entry 7) |
| `6192496` (direct to main) | 07-03 00:00 | auth card layout, status badges, fragile Clerk internal override |
| `c8d9918` (direct to main) | 07-03 00:48 | comic-page identity row overflowing on mobile |

- **Root cause:** the reskin was validated desktop-first; every follow-up was a mobile/edge-case regression. Note two fixes bypassed PR review entirely (direct to main).
- **Lesson:** big-bang visual overhauls require a mobile/edge pass **before** landing — this is the founding incident for that gate in `cellar-validation-and-qa`; design rules live in `cellar-frontend-design-system` (CONTRACT.md rules).
- **Status:** FIXED; process lesson encoded in the gates.

## Entry 12 — The four dormancy periods

| # | Span | Length | Ended by | Verified |
|---|---|---|---|---|
| 1 | 2024-04-13 → 2024-09-13 | ~5 months | `122ccf5` anti-bot fix — **breakage** forced the return (entry 1) | [GitHub-only dates] |
| 2 | 2025-03-13 → 2025-09-02 | 173 days | `56581a9` comic-upsert fix + comic-search burst (PR #41) | local log gap |
| 3 | 2025-09-14 → 2026-01-18 | 126 days | `72b2eaf` Tailwind v4 + dep updates + Frontier proxy — a **new itch** | local log gap |
| 4 | 2026-01-24 → 2026-06-29 | 156 days | `66ce813` design handoff (PR #50) — the AI-agent redesign | local log gap |

- **Operational meaning:** prod runs unattended for months; the crons and the captured token keep working with nobody watching; failures during dormancy are discovered late (entry 1's outage lasted up to 5 months). The only *failure* signal is still admin self-email (entry 4) — the user-facing `sendHtmlEmail` channel added 2026-07-13 only announces new shows to subscribers (entry 10) and carries no failure telemetry. Anything you build must survive a 6-month dormancy → design reviews should ask "what happens when nobody looks at this until next year?"

## Entry 13 — Environment/config drift class (recurring)

| Commit | Date | Drift | Verified |
|---|---|---|---|
| `dee1ae7` / `f95f295` (PR #30) | 2024-10-14 | Clerk **prod** config values missing after dev-only auth work; fix introduced stage-keyed `infra/config.ts` | local |
| `741ca41` (PR #29) | 2024-10-14 | "Added stage field to users since db is shared across envs" — the commit that codified the shared-DB reality | local |
| `d020632` (PR #32) | 2024-10-22 | reservation Lambda deployed **without the DB binding**; fix added `dbCreds.dbUrl` to the route's `link:` array (`infra/api.ts`) | local diff |
| `167a37b` → `70baa86` | 2024-10-28 | SyncCron added with its `IS_ACTIVE`/`IS_CRON` guards **commented out** (would run in every stage); uncommented 3 minutes later — small window, real class | local diffs |

- **Lesson:** every new Lambda/cron needs its `link:` bindings and stage-guard envs checked against a list, not memory → add-one checklists in `cellar-config-and-secrets`; the guard mechanics in `cellar-run-and-operate`.
- **Status:** individual bugs FIXED; the **class recurs** whenever infra is touched.

## Entry 14 — The host-organism pattern

The repo hosts personal scrapers unrelated to Comedy Cellar because the plumbing (axios+cheerio, crons, email/Slack, API Gateway) is already there:

| Piggyback | Arrived | Fate |
|---|---|---|
| Partiful waitlist sniper (entry 2) | `1d3d5fd` 2026-01-23 | removed ~14h later; orphaned `core/slack.ts` + committed webhook remain |
| Frontier **Airlines** fare proxy | `4e71996` 2026-01-18 (PR #47) | **still deployed** (as of 2026-07-07): `packages/functions/frontier.ts`, routed `GET /api/frontier` (`infra/api.ts:46-48`), public, unauthenticated, called by nothing in the repo |

- **Why it matters:** piggybacks add public side-effectful endpoints to the prod domain and leak secrets into shared code (the Slack webhook). They also reuse and stress the same anti-bot techniques the core scraper depends on.
- **Status:** one REVERTED, one LIVE. Any new piggyback (or removal of frontier.ts) is an owner decision → `cellar-change-control`.

---

## How to add an entry

This file is **append-only history**. Never rewrite an existing entry except to update its **Status** line (e.g. OPEN → FIXED with new evidence).

Checklist for a new entry:

- [ ] Structure it **Symptom → Investigation → Root cause → Evidence → Status**. If root cause was never found, say so — "abandoned, cause unknown" is a valid, useful entry.
- [ ] Evidence = at least one SHA with date and touched paths. Generate it, don't recall it:

```bash
git log -1 --format='%h %ad %s' --date=iso <sha>
git show --stat <sha> | head -20
```

- [ ] If the SHA predates 2024-10-11, mark it **[GitHub-only]** — it cannot be verified from this clone.
- [ ] Status is one of: FIXED / REVERTED / ABANDONED / SETTLED / OPEN. OPEN entries must cross-reference `cellar-frontier-and-method` (if it's an ambition) or `cellar-debugging-playbook` (if it's a live trap).
- [ ] Never paste secret values (webhook URLs, the `x-code-localize` token, `.env` contents) — reference by `path:line` and describe.
- [ ] Adding the entry is documentation. **Fixing** whatever the entry describes is a behavior change and goes through `cellar-change-control`'s gates — this file records history, it authorizes nothing.

## Provenance and maintenance

Reconciled 2026-07-13 against `main` at commit `5ceaf98` (PR #62, the show-notification system; the sibling PR #63 `@clerk/types` CI fix is not referenced in this file). Entries 4, 5, 10, 12 and the re-verify table below were updated for that reconciliation; every other fact retains its original 2026-07-07 verification. Originally verified 2026-07-07 against the working tree at branch `claude/skill-library-continuity-4m3x56` (== `main`, HEAD `c8d9918`). All post-2024-10-11 SHAs re-verified with `git log -1` / `git show` locally; pre-graft SHAs (`122ccf5`, `7de294d`, `a5093ee`, `1fcff16`, `6886326`, `8af1a1c`, `411fa43`, `4e21da9`, `c43a806`, `97ac795`, `35dc6cb`) and PR #44 metadata come from GitHub via the project's discovery notes and are marked [GitHub-only]. Current-state claims checked by reading `packages/core/requester.ts`, `packages/core/slack.ts` (existence/exports/importers only), `packages/core/parseLineUp.ts`, `packages/core/models/comic.ts`, `packages/functions/cron/syncCron.ts`, `packages/frontend/src/index.tsx`, `packages/frontend/src/pages/Comics/index.tsx`, `packages/frontend/src/pages/Updates/data.ts`, `infra/api.ts`, `migrations/`.

| Claim that may drift | Re-verify with |
|---|---|
| Token still in requester.ts | `grep -n "x-code-localize" packages/core/requester.ts` |
| slack.ts still orphaned | `grep -rn "core/slack" packages/ infra/ --include='*.ts' \| grep -v node_modules` |
| frontier.ts still routed | `grep -n "frontier" infra/api.ts` |
| Now exactly 4 migrations (0000–0003; `0003` appended 2026-07-13) | `ls migrations/*.sql` |
| Sentry still commented out, still a dep | `grep -n -i sentry packages/frontend/src/index.tsx packages/frontend/package.json` |
| Infinite-scroll guard still present | `grep -n -A5 getNextPageParam packages/frontend/src/pages/Comics/index.tsx` |
| SHOW notifications shipped (2026-07-13), COMIC notifications still unshipped | `grep -rn "getShowNotificationRecipients\|comic_notification\|comicNotification" packages/functions/cron/ packages/core/models/` — a send path reads `show_notification` (via `ShowNotificationCron` → `getShowNotificationRecipients`); confirm nothing reads `comic_notification` to send |
| No new dead PRs / branches | `git branch -r` and GitHub PR list |
| Local graft boundary unchanged | `cat .git/shallow` |
