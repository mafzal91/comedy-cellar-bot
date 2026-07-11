---
name: cellar-data-quality-campaign
description: >-
  Decision-gated campaign for the KNOWN data-quality defects in comedy-cellar-bot's read/ingest
  path. Use when /api/shows/new returns duplicate shows or a wrong "total", a comedian's show
  history looks split or a comic appears twice under near-identical names, /api/shows/scan
  always returns [], "special" shows are missing from listings, a whole night's shows silently
  fail to persist, or when planning an ingestion/query-correctness fix. Numbered phases with
  exact commands, expected numbers at every gate, ranked fix menus with derivation obligations,
  fenced wrong paths, and a numeric definition of "done".
---

# cellar-data-quality-campaign

**Why this campaign exists.** The owner designated **data quality** as the hardest LIVE problem
(as of 2026-07-07). Unlike a scraper outage, these defects never throw and never email anyone —
they quietly return *wrong* data, so nobody is forced to fix them. This is the executable
version of open problem #4 in **cellar-frontier-and-method**: four verified defects, each with a
way to *measure* it, a ranked menu of candidate fixes, and a numeric acceptance gate. Nothing
here is "done"; every fix is a **candidate** that terminates at **cellar-change-control**.

**When NOT to use this skill:**
- Live scraper outage (stale data, cron failure emails, 403s from comedycellar.com) →
  **cellar-scraper-recovery-campaign**. Wrong data because *nothing is landing* is that skill's
  problem, not this one.
- Day-to-day symptom triage ("why is this screen empty", "off-by-one date") →
  **cellar-debugging-playbook**.
- Just the schema / upsert / migration reference → **cellar-data-model** (the home for all of it;
  this campaign points into it, it does not restate it).
- Deciding what to build next in the abstract → **cellar-frontier-and-method**.

**Definitions (each used once):** *CC* = comedycellar.com, the scrape source. *stage* = an SST
deployment environment (`prod` = live; `mohammadafzal` = the owner's dev stage). *the shared DB*
= the single Supabase Postgres every stage reads and writes (only the `user` table is
stage-partitioned; `show`/`comic`/`act`/`room` are not — **cellar-data-model** §8). *N-plication*
= one show returned N times, once per comic on its lineup. *special* = a show flagged
`special = true` whose lineup is often not published (a headliner special, a private event). *act*
= a `(show, comic)` join row — the lineup. *upsert* = insert-or-update on conflict.

## Campaign ground rules (hold for every phase)

| Rule | Why / evidence |
|---|---|
| The DB is **production** from every stage. Any `UPDATE`/`DELETE`/`TRUNCATE`, a comic-row merge, or a hand-edit in `pnpm db:studio` is **prod surgery** — owner-approved backup + rollback plan first. | Shared DB by design: commit `741ca41` "Added stage field to users since db is shared across envs"; **cellar-data-model** §8, **cellar-change-control** §2c. |
| Every behavior-changing fix here is class **backend-logic** and/or **DB-schema**. It ships through **cellar-change-control** (owner sign-off for DB-schema; prod deploy is owner-only). Nothing routes around those gates. | **cellar-change-control** §1. A wrong query returning right-shaped JSON is still a behavior change. |
| Stay polite to CC. Measurement here probes **our** API (`https://comedycellar-api.mafz.al`), never CC directly. If a probe must hit CC, it obeys the serial + sleeps doctrine. | **cellar-diagnostics-toolkit** house rule; **cellar-scraping-reference**. |
| Never book a real reservation to "test" data (unrelated path, but the standing rule). | `createReservation.ts:10` gates live booking to `STAGE === "prod"`; **cellar-change-control** §2a. |
| `migrations/` is **append-only**. A dedupe/normalization migration adds a new file; never edit, renumber, or re-baseline applied migrations. | The Feb-2025 squash lesson: `8b3b837`; **cellar-data-model** §7. |
| Never reproduce secrets (the `x-code-localize` token in `requester.ts:12-13`, Slack fragments in `slack.ts:3-9`, `.env`). Reference by path only. | Committed-credential discipline; discovery SEED-4. |

## The four defects at a glance (re-verified 2026-07-07 — line numbers are current)

| # | Defect | Symptom | Evidence (path:line) |
|---|---|---|---|
| 1 | **N-plication + wrong `total` + specials invisible** in `/api/shows/new` | a show appears once per comic; `total` counts act-rows; act-less specials never appear | `getShows` `models/show.ts:207-217`, `getShowsCount` `:235-241` (three `innerJoin`s, no `GROUP BY`/`DISTINCT`); consumed by `listShowsLocal` `functions/shows/index.ts:166-184` |
| 2 | **`/api/shows/scan` always returns `[]`** | scan endpoint yields nothing for any horizon | `scanShows` `functions/shows/index.ts:94-105` → `handleShowList({days})` `handleShowList.ts:11` (no `fromTimestamp`) → `getFutureDatesByDay` `getFutureDatesByDay.ts:21,28-31` builds `new Date(undefined)` = Invalid Date → `eachDayOfInterval` returns `[]` |
| 3 | **Comic identity = exact name string** | a comedian forks into multiple rows; history/likes/notifications split | `createComics` `models/comic.ts:36-38` (`onConflictDoNothing()`); uniques on `name` and `lower(name)` only (`sql/comic.sql.ts:27,33-37`); batch dedup is an exact-name `Set` (`handleLineUp.ts:16-21`) |
| 4 | **Show upsert staleness + unknown-room silent vanish** (secondary) | some columns never refresh; a new CC `roomId` makes a whole night's shows disappear with no error | `createShows` DO UPDATE refreshes only 6 columns `models/show.ts:169-178`; `roomDictionary` has no room 4/6+ `:27-32`; failure swallowed by `Promise.allSettled` + try/catch `handleShowDetails.ts:19-28` |

## Campaign map

```
PHASE 0  Measure  ── get a NUMBER for each defect (probe OUR API; DB counts need AWS)
PHASE 1  Prioritize  ── rank worst × cheapest (small table)
PHASE 2  Fix menu  ── per defect, ranked candidates, each with a derivation obligation
WRONG PATHS  ── fenced, with the reason each is wrong
PHASE 3  Validate & promote  ── numeric gates → cellar-change-control → watch
```

---

## PHASE 0 — Measure the current state (each gate is a number, never an eyeball)

Prefer our public API — no CC hit, no AWS, runnable from anywhere with network. The base URL is
`https://comedycellar-api.mafz.al` (`infra/api.ts`, as of 2026-07-07; the diagnostics toolkit's
`check-api.sh`/`freshness-check.sh` carry the fuller probe kit). **This sandbox blocks external
hosts (CONNECT 403); run the `curl` probes from an unrestricted machine.** DB-level counts are
labeled **needs-AWS**.

```bash
API=https://comedycellar-api.mafz.al
```

### Defect 1 — N-plication and wrong `total` (probe OUR API)

```bash
# One page of the DB-backed listing. Route: infra/api.ts:62 → listShowsLocal.
curl -sS "$API/api/shows/new?limit=100&sort=-timestamp" \
  | jq '{total, rows: (.results|length), distinctIds: ([.results[].id]|unique|length)}'
```

| Field | Healthy (post-fix) | Current (buggy) | Why |
|---|---|---|---|
| `rows` vs `distinctIds` | **equal** | `rows > distinctIds` | a show with N comics is emitted N times (the `act`/`comic` `innerJoin`s, no `DISTINCT`) |
| `total` vs `distinctIds` | **equal** when `total ≤ 100` | `total > distinctIds` | `getShowsCount` counts act-rows, not shows (`show.ts:235-241`) |

Note: `getShows` selects **only show columns** (`show.ts:208`, `getTableColumns(show)`) — the
`act`/`comic` join contributes *no data*, only duplication and the optional `comicId` filter.
That fact drives the Phase 2 fix. (Caveat: two rooms can legitimately share a `timestamp`, so
dedupe on `id`, never on `timestamp`.)

### Defect 1b — specials invisible (cross-check live vs DB)

```bash
D=$(TZ=America/New_York date +%F)                     # a night CC clearly lists shows
START=$(( $(TZ=America/New_York date -d "$D 00:00" +%s) * 1000 ))   # API filters take MILLISECONDS
END=$((   $(TZ=America/New_York date -d "$D 23:59:59" +%s) * 1000 ))
live=$(curl -sS  "$API/api/shows?date=$D" | jq '[.shows[].timestamp]|unique|length')
db=$(curl -sSg "$API/api/shows/new?date[start]=$START&date[end]=$END&limit=100" | jq '[.results[].timestamp]|unique|length')
echo "live=$live db=$db"
```

- Healthy (post-fix): `db == live` — every show, including act-less specials, is present.
- Current (buggy): `db < live`. The gap is specials **plus** any show whose lineup never scraped
  (both are dropped by the `innerJoin(act)`). This gate proves "specials present" only alongside
  knowing lineups landed — cross-ref the counting caveat in **cellar-validation-and-qa** §6.

### Defect 2 — scan returns `[]` (probe + library proof)

```bash
curl -sS "$API/api/shows/scan?days=7" | jq 'length'    # Route: infra/api.ts:52 → scanShows
```

- Current (buggy): `0` for **every** `days` value.
- Healthy (post-fix): the count of dates in the horizon that CC has shows for (`> 0`).

Prove the root cause against the repo's own `node_modules` (no network; **verified 2026-07-07,
node v22, date-fns v4** — replicates `getFutureDatesByDay(days, undefined)`, `getFutureDatesByDay.ts:21,28-31`):

```bash
cd /home/user/comedy-cellar-bot
node -e '
const { startOfDay, addDays, eachDayOfInterval } = require("date-fns");
const { toZonedTime } = require("date-fns-tz");
const currentDate = toZonedTime(new Date(undefined), "America/New_York");
const start = startOfDay(currentDate);
const days = eachDayOfInterval({ start, end: addDays(start, 1) });
console.log("currentDate:", currentDate.toString());
console.log("dayDates:", JSON.stringify(days), "length =", days.length);
'
# VERIFIED OUTPUT:
#   currentDate: Invalid Date
#   dayDates: [] length = 0
```

It returns `[]`, it does not throw — so `handleShowList` iterates zero dates and `scanShows`
returns `[]`. The crons are unaffected: they always pass a real `fromTimestamp`
(`newShowCron.ts`, `syncCron.ts`). Same measured fact as **cellar-diagnostics-toolkit** Recipe 4
and **cellar-validation-and-qa** §3a.

### Defect 3 — comic name-variant forks (needs-AWS for exact counts)

There is no public endpoint that lists near-duplicate comics. Two measurement paths:

1. **Heuristic, our API (no AWS):** search a surname and eyeball variants —
   `curl -sS "$API/api/comics?name=<surname>&limit=100" | jq '[.results[].name]'`. Whitespace,
   diacritic, or punctuation twins ("Mark Normand" vs "Mark  Normand"; an accented vs unaccented
   spelling) are candidate forks. The `lower(name)` index folds **case only**, not whitespace or
   diacritics.
2. **Exact, needs-AWS:** count collisions after normalization in the shared DB via
   `pnpm db:studio` (read-only GUI) or a read query — e.g. group by
   `regexp_replace(lower(unaccent(name)), '\s+', ' ', 'g')` having `count(*) > 1`. Treat any
   write as prod surgery (ground rules). `unaccent` requires the Postgres extension; confirm it
   exists before relying on it.

- Current (buggy): `> 0` normalization-collision groups exist over time (unquantified here — no
  DB access from this sandbox).
- Healthy target: a re-scrape of a known comic under a variant spelling does **not** create a new
  row (Phase 3 gate G5).

### Defect 4 — upsert staleness & unknown-room vanish (mostly needs-AWS; drift grep is free)

```bash
# Free: has CC introduced a roomId the hardcoded dictionary doesn't cover?
sed -n '27,32p' packages/core/models/show.ts     # expect rooms 1,2,3,5 — no 4, no 6+
```

- **Unknown-room symptom (needs-AWS or live cross-check):** a whole night's shows missing from
  `/api/shows/new` on a night the site lists them. Reuse the Defect 1b live-vs-DB probe: `db == 0`
  while `live > 0` for a date is the fingerprint of a swallowed persist failure
  (`handleShowDetails.ts:19-28`). Confirm which room by reading logs (**cellar-run-and-operate**).
- **Staleness is largely benign and must not be over-claimed:** `createShows` never refreshes
  `soldout`/`available`, **but the API doesn't read `soldout` from the DB** — `Show.toJSON`
  recomputes it as `totalGuests >= max` (`show.ts:83-85,103`), and `totalGuests`/`max` **are**
  refreshed on conflict (`show.ts:177`). So live availability is current despite the stale
  column. The column that matters is **`timestamp` never refreshing** (`show.ts:169-178`): it is
  the lineup lookup key (`getShowByTimestamp`, `show.ts:254-256`), though CC show timestamps are
  effectively immutable, so this is latent, not observed. Rank accordingly (Phase 1).

---

## PHASE 1 — Prioritize (worst × cheapest)

| Rank | Defect | User impact | Fix cost | Risk | Rationale |
|---|---|---|---|---|---|
| **1** | **#1** N-plication / total / specials | High — visible wrong data on any unfiltered/room-filtered listing; breaks paginated counts (the repo's infinite-scroll computes page count from `total`, `pages/Comics/index.tsx:34`) | Low — a query-only change in `models/show.ts`, no schema, no migration | Low | Highest impact for the least surface; anchor the campaign here. |
| **2** | **#2** scan → `[]` | Medium — an entire endpoint is dead; also the orphan `functions/list.ts` | Low — a one-argument root-cause fix in the date helper | Low | Cheap and self-contained; do alongside #1. |
| **3** | **#3** comic forks | Medium — splits a comedian's history, likes, notifications; compounds over time | Medium–High — normalize-on-ingest is code; cleaning existing rows is a **migration + prod surgery** | High (touches shared prod data + FKs) | Real but slow-burning; the cleanup half is owner-gated and irreversible if done wrong. |
| **4** | **#4** staleness / unknown-room | Low (staleness, mostly benign) to High-but-rare (a new room silently drops a night) | Low (add a room / a `default` name) to Medium (loud-fail on unknown room) | Low–Medium | Latent today; a hardening task, not a live wrong-answer. |

Do #1 and #2 first (cheap, low-risk, high/medium impact). Treat #3's ingest-normalization as a
follow-up and its historical cleanup as a separate owner-gated migration. #4 is hardening.

---

## PHASE 2 — Fix menu per defect (candidates ranked; each carries a derivation obligation)

Each option below is a **candidate**. You must *derive* correctness for counting AND for the
returned rows before choosing — do not paste a query you have not reasoned through. None of this
SQL has been run here (no DB); the derivation is on paper, the proof is Phase 3.

### Defect 1 — restructure the query (getShows + getShowsCount, `models/show.ts`)

Key fact from Phase 0: **`getShows` returns only show columns; the `act`/`comic` join is a pure
filter/multiplier.** So dedup is lossless — you are not throwing away lineup data by removing the
duplication (there is none to lose in the payload).

| Rank | Option | Correct for rows? | Correct for `total`? | Derivation obligation |
|---|---|---|---|---|
| **1** | **Join `act`/`comic` only when `comicId` is set; drop them otherwise.** The where-clause only references `comic.externalId`/`room.externalId` when those filters are present (`show.ts:138-143`), so the joins are conditional by construction. | Yes — no join, no duplication | Yes — count over `show` rows | Show that with no `comicId`, `getShowWhereClause` adds no `comic`/`room` predicate, so nothing needs those tables. Keep `room` joined only if you keep the `roomId` filter path. |
| **2** | **Keep the joins; add `GROUP BY show.id` (+ every selected show column) to `getShows`, and `COUNT(DISTINCT show.id)` to `getShowsCount`.** | Yes — one row per show | Yes — distinct shows | Postgres requires every non-aggregated selected column in `GROUP BY`; enumerate them. Verify `ORDER BY`/`LIMIT`/`OFFSET` still apply post-group. |
| **3** | **`SELECT DISTINCT` on the show columns** (+ `COUNT(DISTINCT show.id)` for the count). | Yes | Yes | Cheapest diff, but `DISTINCT` + `ORDER BY timestamp` + `LIMIT` interact — confirm ordering is deterministic and pagination stable. |
| **—** | **`json_agg` the lineup into each show row** (aggregate acts). | Yes | Yes | Only worth it if you *want* the endpoint to start returning the lineup — that is a **feature add**, not a bug fix; scope it separately. |

**The specials fix is orthogonal to dedup and must be done too:** an act-less show has no `act`
row, so any variant that still `innerJoin`s `act` keeps specials invisible. Fix by **not joining
`act` when there is no `comicId` filter** (Option 1 gives this for free) or `innerJoin` →
`leftJoin` on `act`. Also weigh the `innerJoin(room)` (`show.ts:212,240`): a show whose `roomId`
has no `room` row (Defect 4) is *also* dropped — prefer `leftJoin(room)` or filter `roomId` via a
subquery so a missing room can't hide a show.

**Decide the `total` contract explicitly:** it should count **distinct shows** matching the
filters (what a paginator needs), not act-rows. State this in the PR — the frontend divides by
`total` to compute page count (`pages/Comics/index.tsx:34`), so an act-row `total` over-counts
pages and can loop forever (same failure class as the pagination saga, **cellar-failure-archaeology**
Entry 6).

### Defect 2 — fix the Invalid-Date root cause (`getFutureDatesByDay.ts` / `handleShowList.ts`)

| Rank | Option | Trade-off / obligation |
|---|---|---|
| **1** | **Default `fromTimestamp` to "now" inside `getFutureDatesByDay`** when omitted (e.g. `new Date(fromTimestamp ?? Date.now())`). One line; fixes `scanShows`, the orphan `list.ts`, and the equally-broken `getFutureDatesByWeek` at once. | Confirm the crons are unaffected — they always pass a real timestamp, so a `?? now` default never changes their input. Re-run the Phase 0 node proof with a valid ms value to show it now returns `n+1` dates. |
| **2** | **Make `scanShows` pass an explicit `fromTimestamp`** (today's start-of-day in NY). | **Fenced as a partial fix if done alone** (see wrong paths) — it leaves the Invalid-Date landmine armed for the next caller. Only acceptable *in addition to* Option 1, not instead of it. |

Either way: `numberOfDays <= 0` still throws (`getFutureDatesByDay.ts:16-18`); `scanShows`
defaults `days` to `"1"`, so that guard is not the bug.

### Defect 3 — comic identity (ingest-time vs cleanup)

Two independent halves; do the ingest half first, the cleanup half is owner-gated.

| Rank | Option | Kind | Obligation |
|---|---|---|---|
| **1** | **Normalize on ingest**: canonicalize the name (trim, collapse internal whitespace, optional diacritic-fold) before insert in `handleLineUp.ts:16-21` / `createComics`. Prevents *new* forks. | code (backend-logic) | Decide what to store: normalized display name vs a separate normalized key column. If you add a column/index it becomes **DB-schema** (migration). Re-read the `56581a9` lesson (**cellar-data-model** §3): with a `lower(name)`/expression unique index, the conflict target must be **targetless** `onConflictDoNothing()` or name the expression index exactly — a plain `comic.name` target does not cover it and crashes. |
| **2** | **Canonical-name mapping** (a small alias table or map: variant → canonical id) consulted at ingest and read time. | code + maybe schema | Non-destructive; keeps history intact. Adds a lookup on the hot path; define who maintains the map. |
| **3** | **Dedupe migration** to merge existing forked rows. | **DB-schema + prod surgery, owner-only** | Append-only migration (**cellar-data-model** §7). Must re-point `act`, `comic_notification`, `comic_to_user` FKs (all `CASCADE`, **cellar-data-model** §1) to the survivor **before** deleting a duplicate, inside one transaction, with a backup. `externalId` is API-facing — a merge changes which `externalId` a comedian resolves to; decide and document the survivor rule. |

### Defect 4 — hardening

| Rank | Option | Obligation |
|---|---|---|
| **1** | **Fail loud on an unknown `roomId`** instead of inserting `name: undefined`: throw or log with the room id in `handleShowDetails`/`roomName`, so a new room surfaces as an error, not a silent empty night. | It changes a swallowed failure into a visible one — confirm the crons/handlers surface it (an email or a non-swallowed log). Behavior change → change control. |
| **2** | **Add the missing room(s)** to `roomDictionary` (`show.ts:27-32`) and/or a `default` room name. | Requires knowing CC's real room numbering — a scrape observation, not a guess. Room 4 has never been seen; do not invent a name. |
| **3** | **Refresh more columns on conflict** in `createShows` (add `available`/`soldout`/`timestamp` to the DO UPDATE `set`). | **Low value — derive before doing.** The API already recomputes `soldout` from refreshed `totalGuests`/`max`; `timestamp` is effectively immutable. Justify the need with a measured stale row, or skip it. |

---

## WRONG PATHS — fenced. Do not do these.

| Wrong path | Why it is fenced |
|---|---|
| **Client-side dedup in the frontend** to "hide" the duplicate shows | Masks the bug at one screen while `total` stays an act-row count — and the repo's infinite-scroll computes page count from `total` (`pages/Comics/index.tsx:34`), so pagination stays broken (over-counts pages / loops). Fix the query, not the view. |
| **Dropping the `act` join entirely without preserving the `comicId` filter path** | The join *is* how `comicId` filtering works (`show.ts:138-139,210-211`). Remove it unconditionally and comic-filtered queries (the current live consumer, `pages/Comic/UpcomingShows.tsx:52-58`) silently return everything. Make the join **conditional**, don't delete it. |
| **A destructive prod-DB dedupe (comic merge, `DELETE`/`UPDATE`) without a migration + backup** | Shared DB = prod surgery; comic FKs `CASCADE` to acts, notifications, and likes (**cellar-data-model** §1) — a careless delete takes real user data with it. Owner-approved append-only migration only (**cellar-change-control** §2c). |
| **"Fixing" scan by hand-passing a timestamp in `scanShows` only** | Leaves the `new Date(undefined)` landmine (`getFutureDatesByDay.ts:21`) armed for `list.ts`, `getFutureDatesByWeek`, and the next caller. Fix the root cause in the helper (Defect 2, Option 1). |
| **Renaming comic rows in place in prod to "clean up"** without a canonical mapping | `externalId` is the API-facing identity other rows and the frontend reference; renaming/merging without re-pointing FKs and recording the survivor breaks history and links. Route through the mapping/migration options, owner-gated. |
| **Adding `GROUP BY`/`DISTINCT` to only `getShows` and not `getShowsCount`** (or vice-versa) | The list and the count must agree or pagination desyncs (rows deduped, `total` still act-rows). Fix both in the same change and prove they match (Phase 3 G1). |

---

## PHASE 3 — Validate & promote

**Numeric acceptance gates** (define the number before you run the check; probe our API from an
unrestricted machine, or a dev-stage API — remember dev writes hit the shared DB):

| Gate | Defect | Pass criterion | Measurement |
|---|---|---|---|
| **G1** | 1 | `rows == distinctIds` on a full page, AND `total == distinctIds` when `total ≤ 100` | Phase 0 Defect-1 probe |
| **G2** | 1b | DB distinct-show count `==` live show count for a date (specials present) | Phase 0 Defect-1b probe |
| **G3** | 2 | `/api/shows/scan?days=N` returns `> 0` for a horizon with known shows; node proof with a valid ms timestamp returns `n+1` dates | Phase 0 Defect-2 probe + proof |
| **G4** | 1 | pagination terminates: `getNextPageParam` stops (page count from the corrected `total`) | manual scroll to end on a `total`-driven list, or assert `total` in the response |
| **G5** | 3 | re-scraping a known comic under a variant spelling creates **0** new rows (normalization holds) | dev-stage line-up scrape of a date with that comic, then re-count that comic's rows (needs-AWS) |
| **G6** | 4 | a simulated unknown `roomId` produces a visible error, not a silent empty night | dev-stage fixture/probe; confirm the failure is surfaced |

There is **no backend test gate today** (zero automated tests; CI is red on main and covers only
the frontend — **cellar-validation-and-qa** §1). So the acceptance *evidence* is exactly the
manual numeric protocol above: paste the before/after probe outputs (and the SQL derivation for
Defect 1) into the PR. That transcript IS the proof (**cellar-validation-and-qa** §3, §7).

**Promote through cellar-change-control** — name the class and its gate:

| Fix | Class | Gate / approver |
|---|---|---|
| Defect 1 (query), Defect 2 (date helper), Defect 4 opt-1 (loud-fail) | **backend-logic** | No automated gate; manual verification protocol (**cellar-validation-and-qa** §3c); any maintainer, but the owner deploys prod |
| Defect 3 ingest normalization (if it adds a column/index), Defect 3 dedupe migration, Defect 4 opt-2 (schema) | **DB-schema** | Migration workflow (**cellar-data-model** §6) + **prod surgery** discipline; **OWNER** sign-off; append-only |
| Prod deploy of any of the above | **infra / deploy** | **OWNER only** (`pnpm deploy:prod`) |

**Pin the fixes against regression.** With no test harness, each fix can silently regress. The
highest-value pins map directly onto the candidate harness in **cellar-validation-and-qa** §5:
a `getFutureDatesByDay` unit test (valid ms → `n+1` dates; no-arg → document/guard the fixed
behavior) and a `getShows`/`getShowsCount` query test (each show once; `total == distinct shows;
specials present`). Adding that harness + a backend CI job is itself an owner-gated new gate
(**cellar-frontier-and-method** problem #3) — propose it, don't wire it silently.

---

## Provenance and maintenance

Re-verified 2026-07-07 against the working tree (branch `claude/skill-library-continuity-4m3x56`,
== main) by **reading**: `packages/core/models/show.ts` (roomDictionary `:27-32`; `createShows`
`:165-180`; `getShows` `:186-219` with `innerJoin`s `:210-212` and show-only select `:208`;
`getShowsCount` `:221-246` with joins `:238-240`; `getShowWhereClause` `:124-159`),
`packages/functions/shows/index.ts` (`scanShows` `:94-105`; `listShowsLocal` `:108-185`; specials
comment `:67`), `packages/core/getFutureDatesByDay.ts` (`:11-41`, `new Date(fromTimestamp)` `:21`,
`eachDayOfInterval` `:28-31`), `packages/core/handleShowList.ts` (`:11`),
`packages/core/models/comic.ts` (`createComics` `:36-38`), `packages/core/sql/comic.sql.ts`
(`name` unique `:27`, `nameUniqueIndex` on `lower(name)` `:33-37`),
`packages/core/handleLineUp.ts` (`:16-21`, `:34`), `packages/core/handleShowDetails.ts`
(`:14-28`), `packages/core/models/room.ts` (`createRooms` `:11-13`), `infra/api.ts`
(`/api/shows/scan` `:52-53`, `/api/shows/new` `:62-63`), and the frontend consumers
`packages/frontend/src/pages/Comic/UpcomingShows.tsx:52-58`,
`packages/frontend/src/pages/Comics/index.tsx:33-38` (page count from `total`),
`packages/frontend/src/utils/api.ts:147-161`. **Ran** (read-only): the Defect-2 `node -e` proof
against repo `node_modules` — output `currentDate: Invalid Date` / `dayDates: [] length = 0`.

Every defect's line numbers **matched** the discovery leads (`show.ts:186-246`,
`getFutureDatesByDay.ts` Invalid-Date chain, `comic.ts:36-38` + `comic.sql.ts` indexes,
`createShows` 6-column set + `roomDictionary`). **Could not verify from this sandbox** (network +
AWS blocked): live `/api/*` numbers, actual counts of forked comic rows (Defect 3 magnitude),
whether the `unaccent` Postgres extension is installed, and any DB-level Defect-4 symptom — all
labeled needs-AWS / run-from-an-unrestricted-machine above.

| May drift | Re-verify with |
|---|---|
| Defect 1 joins still un-grouped | `sed -n '207,246p' packages/core/models/show.ts` (expect three `innerJoin`, no `groupBy`/`distinct`) |
| `getShows` still selects only show columns | `sed -n '207,218p' packages/core/models/show.ts` (`getTableColumns(show)`) |
| Defect 2 chain intact | `sed -n '94,105p' packages/functions/shows/index.ts` + `sed -n '11,11p' packages/core/handleShowList.ts` + `sed -n '21,31p' packages/core/getFutureDatesByDay.ts` |
| Defect 2 behavior (library) | the `node -e` proof above → `[] length = 0` |
| Defect 3 conflict handling + indexes | `sed -n '36,38p' packages/core/models/comic.ts`; `sed -n '27,37p' packages/core/sql/comic.sql.ts` |
| Defect 4 upsert set + roomDictionary | `sed -n '165,180p' packages/core/models/show.ts`; `sed -n '27,32p' packages/core/models/show.ts` |
| Routes unchanged | `grep -n 'shows/scan\|shows/new' infra/api.ts` |
| Frontend still divides by `total` | `sed -n '33,38p' packages/frontend/src/pages/Comics/index.tsx` |
| API base URL | `grep -n 'comedycellar-api' infra/api.ts` |
