---
name: cellar-data-model
description: Schema reference, id/externalId conventions, per-entity upsert semantics, the roomDictionary, drizzle-kit migration workflow, and shared-database discipline for comedy-cellar-bot's Supabase Postgres. Use when adding or changing a table/column in packages/core/sql/*.sql.ts, writing queries or upserts in packages/core/models/, running pnpm db generate/migrate, debugging duplicate or missing rows (comic name variants, N-plicated shows in /api/shows/new, shows silently not persisting), or bootstrapping/seeding an empty database.
---

# cellar-data-model — schema, identity, upserts, migrations

The backend stores scraped comedycellar.com ("CC") data and user preferences in **one Supabase Postgres database** via **Drizzle ORM** (a TypeScript SQL query builder; schema lives in code, migrations are generated SQL files). Schema files: `packages/core/sql/*.sql.ts`. Query/mutation helpers: `packages/core/models/*.ts`. Migrations: `migrations/` (checked in, applied with drizzle-kit).

**When NOT to use this skill**: how data GETS INTO the DB from the scraper (endpoints, parsing, politeness) → `cellar-scraping-reference`; wrong data symptoms and triage → `cellar-debugging-playbook`; which changes need whose approval → `cellar-change-control`; stage/secret plumbing (`DbUrl`, `sst shell`) → `cellar-config-and-secrets`; running the app/crons → `cellar-run-and-operate`.

## 0. Mental model (60 seconds)

- 8 tables. Scrape-populated: `show`, `room`, `comic`, `act` (show↔comic join). User-populated: `user`, `show_notification`, `comic_notification`, `comic_to_user`.
- **All SST stages (prod + dev) share this one database.** Only `user` rows are stage-partitioned. Destructive DB work from ANY stage is prod surgery. See §8.
- Show identity = CC's own numeric show id (used as our primary key). Comic identity = the exact name string CC prints. Both have sharp edges (§3).
- Notification tables exist and are user-editable via `/api/settings`, but **nothing has ever sent a user notification** — no code reads them to fire anything. They are storage for an unshipped feature (open problem: `cellar-frontier-and-method`).
- `comic_to_user` (likes) is schema-only: no model file, no code reads or writes it anywhere in `packages/` (verified by grep, 2026-07-07).

## 1. Schema reference (as of 2026-07-07; migrations 0000–0002, no schema change since 2025-02-05)

Every table except `comic_to_user` has: `id serial PRIMARY KEY`, `externalId varchar(128) NOT NULL UNIQUE` (app-generated, §2), `createdAt timestamp DEFAULT now()`. Columns below are the rest.

| Table | Schema file | Other columns | Constraints beyond externalId |
|---|---|---|---|
| `show` | sql/show.sql.ts:16-41 | time varchar(8), description, forwardUrl, soldout bool, max int, special bool, roomId int NOT NULL → room.id (**ON DELETE NO ACTION**), cover int, note, mint bool, weekday int, totalGuests int, venueMin, venueMax, available int, timestamp int (unix seconds) | **NONE — no unique on `timestamp`**, despite code treating it as a lookup key (§3) |
| `room` | sql/room.sql.ts:15-24 | name text NOT NULL, maxReservationSize int NOT NULL DEFAULT 4 | name UNIQUE |
| `comic` | sql/comic.sql.ts:18-38 | img text NOT NULL, name text NOT NULL, description, website, enabled bool | name UNIQUE **plus** a second case-insensitive unique index `nameUniqueIndex` on `lower(name)` (comic.sql.ts:33-37; migrations/0000:124) — two overlapping uniques, see §3 |
| `act` | sql/act.sql.ts:17-40 | showId int NOT NULL → show.id **CASCADE**, comicId int NOT NULL → comic.id **CASCADE**, enabled bool DEFAULT true | unique `uniqueComicShow (comicId, showId)` (act.sql.ts:34-39) |
| `user` | sql/user.sql.ts:17-36 | authId text NOT NULL (Clerk user id), email text NOT NULL, stage text NOT NULL | authId UNIQUE (**global, not stage-scoped**); unique `emailUniqueIndex (lower(email), stage)` (user.sql.ts:30-35) |
| `show_notification` | sql/showNotification.sql.ts:18-35 | userId int NOT NULL → user.id CASCADE, enabled bool NOT NULL DEFAULT false | unique `user_show_unique` on **userId alone** (added in migration 0002) — one global on/off row per user, not per-show |
| `comic_notification` | sql/comicNotification.sql.ts:18-41 | userId → user.id CASCADE, comicId → comic.id CASCADE, enabled bool NOT NULL DEFAULT false | unique `user_comic_unique (userId, comicId)` |
| `comic_to_user` | sql/comicToUser.sql.ts:17-36 | userId → user.id CASCADE, comicId → comic.id CASCADE, isLiked bool NOT NULL DEFAULT false | unique `user_comic_unique1 (userId, comicId)`; **deliberately no externalId** (comment at comicToUser.sql.ts:16) |

Cascade map (what deletes take with them):

| Deleting a… | Cascades to | Blocked by |
|---|---|---|
| user | show_notification, comic_notification, comic_to_user | — |
| comic | act, comic_notification, comic_to_user | — |
| show | act | — |
| room | nothing | any `show.roomId` referencing it (FK is NO ACTION → delete fails) |

Drizzle `relations()` are declared in every sql.ts file but are **inert**: `packages/core/database.ts:5` does `import * as schema from "./database"` — it imports **itself**, so the drizzle instance's schema is `{ db }` and the relational API (`db.query.*`) does not work. All real code uses the query builder (`db.select()...`). Don't "fix" this casually (behavior change → `cellar-change-control`); don't write new code that relies on `db.query.*` until it is fixed.

## 2. ID conventions

Two ids per row:

1. `id serial` — internal integer PK, used for FKs. **Exception that bites**: `show.id` is NOT locally generated; it is CC's own numeric show id, inserted verbatim (§3).
2. `externalId` — API-facing opaque id, `"<prefix>_<cuid2>"`, generated app-side by `createExternalId(PREFIX)` (packages/core/common/createExternalId.ts:3-9; cuid2 = collision-resistant random string, lowercase alphanumeric).

Prefixes (packages/core/common/constants.ts:1-7):

| Constant | Value | Example externalId |
|---|---|---|
| USER_PREFIX | `user` | `user_tz4a98xxat96iws9zmbrgj3a` |
| COMIC_PREFIX | `comic` | `comic_…` |
| SHOW_PREFIX | `show` | `show_…` |
| ROOM_PREFIX | `room` | `room_…` |
| ACT_PREFIX | `act` | `act_…` |
| SHOW_NOTIFICATION_PREFIX | `show_notif` | `show_notif_…` |
| COMIC_NOTIFICATION_PREFIX | `comic_notif` | `comic_notif_…` |

**Trap — the guards are UNANCHORED substring regexes.** Every "is this a valid X id" check is `externalId.match(new RegExp(PREFIX))`:
`isComicExternalId` models/comic.ts:32-34, `isShowExternalId` models/show.ts:161-163, `isRoomExternalId` models/room.ts:7-9, `isUser` sql/user.sql.ts:51-58, and models/user.ts:13-15 (which is ALSO named `isRoomExternalId` — copy-paste misnomer; it checks USER_PREFIX).
Consequences:
- `show_notif_…` passes the `show` guard; `comic_notif_…` passes the `comic` guard (prefix is a substring).
- cuid2 output can contain `user`/`act`/`show` as a substring, so random ids can pass the wrong guard.
- These guards are input-shape hints, not authorization or type safety. New guards you write should anchor (`^prefix_`), but changing the existing ones is a behavior change → `cellar-change-control`.

## 3. Identity semantics (where duplicate/missing rows come from)

**Show identity = CC's numeric show id.** `handleShowDetails` (packages/core/handleShowDetails.ts:13,22) inserts the RAW CC API objects, so their `id` field becomes our `show.id` serial PK. Two consequences:
- **Sequence desync (latent)**: explicit-id inserts never advance Postgres's serial sequence. Nothing currently inserts a show without an id, but any future code relying on the serial default will start at ~1 and eventually collide with CC ids. Never insert a show row without an explicit id.
- `show.timestamp` (unix seconds of showtime; it is also the `showid=` in CC reservation URLs) is used as the lookup key by the lineup pipeline — `getShowByTimestamp` (models/show.ts:254-256) — **but has no unique index** (§1). handleLineUp only creates acts when EXACTLY one show matches the timestamp (handleLineUp.ts:34: `if (show.length === 1 && show[0].id)`); duplicates make acts silently stop being created for that show.

**Comic identity = exact name string.** Dedup within a scrape batch is a `Set` of names (handleLineUp.ts:16-21); DB dedup is the `name` unique + `lower(name)` unique index. Accent, spelling, or punctuation variants of the same person ("Dave Attell" vs "Dave Attel") fork separate rows forever. There is no merge tooling; merging rows is prod surgery (§8).

**The 56581a9 lesson (2025-09-02, "Fixed comic creation logic")**: `createComics` used `onConflictDoNothing({ target: comic.name })`. Postgres could not match that conflict target to the `lower(name)` expression index, so a case-variant duplicate raised a unique violation instead of being ignored — comic creation crashed in prod. Fix: drop the target — `onConflictDoNothing()` with no target ignores conflicts on ANY unique constraint (models/comic.ts:36-38 today). Rule: **if a table has an expression/partial unique index, either name it precisely in the conflict target or use targetless doNothing; a plain column target does not cover `lower(col)`.**

## 4. Upsert semantics per entity — what refreshes on conflict, what never does

| Entity | Function | Conflict target | On conflict |
|---|---|---|---|
| show | `createShows` models/show.ts:165-180 | `show.id` | **DO UPDATE**, refreshes ONLY: description, cover, note, roomId, max, totalGuests (via `EXCLUDED.*`). **Never refreshed: soldout, available, timestamp, time, special, mint, weekday, venueMin/venueMax, forwardUrl** — those stay at first-insert values |
| room | `createRooms` models/room.ts:11-13 | `room.id` | DO NOTHING — name and maxReservationSize never updated by scraping |
| comic | `createComics` models/comic.ts:36-38 | none (any unique) | DO NOTHING — img/description/website never refreshed after first sighting |
| act | `createActs` models/act.ts:44-51 | `(showId, comicId)` | DO NOTHING |
| user | `createUser` models/user.ts:17-22 | `user.authId` | DO NOTHING — email never refreshed |
| show_notification | `upsertShowNotification` models/showNotification.ts:9-19 | `userId` | DO UPDATE `enabled` |
| comic_notification | `upsertComicNotification` models/comicNotification.ts:21-55 | `(userId, comicId)` | DO UPDATE `enabled = excluded.enabled`. Trap: unknown external comicId maps to `undefined` → NOT NULL violation → unhandled 500 (comicNotification.ts:39-43) |
| comic_to_user | none exists | — | schema-only table |

Why "stale soldout" confuses people twice: the stored `soldout` column is never refreshed (above), AND the API doesn't even use it — `Show.toJSON()` computes soldout as `totalGuests >= max` because "soldout from comedy cellar api is not accurate" (models/show.ts:83-85,103-104). `totalGuests`/`max` ARE refreshed on conflict, so live-scraped availability is current even though the column is stale.

## 5. roomDictionary and the unknown-room silent failure

Room names are NOT scraped; they come from a hardcoded map (models/show.ts:27-32):

```ts
const roomDictionary: Record<number, string> = {
  1: "MacDougal St",
  2: "Village Underground",
  3: "Fat Black Pussycat",
  5: "Unknown",
};
```

(Yes, 4 is missing — CC's numbering, not ours.) If CC ever emits a new `roomId`, `show.roomName` is `undefined` → `createRooms` gets `name: undefined` → NOT NULL violation kills the whole rooms batch insert → `createShows` for that day hits an FK violation on the missing room → **and both failures are swallowed** by `Promise.allSettled` with discarded results inside a try/catch (handleShowDetails.ts:19-28). Net effect: every show that day silently fails to persist, no email, no log you'll notice. Symptom→triage for this lives in `cellar-debugging-playbook`. Also note the same `allSettled` runs room-insert and show-insert **in parallel**, so show inserts only succeed because rooms already exist from prior runs.

`room.maxReservationSize` (default 4) gates reservation party size in the booking flow; scraping never sets it, so it is 4 everywhere unless hand-edited in the DB (hand-editing = prod surgery, §8).

## 6. Migration workflow

Toolchain: drizzle-kit (v0.31.10 installed here, `^0.31.8` in package.json:25). Config `drizzle.config.ts`: schema glob `./packages/core/**/*.sql.ts`, out `./migrations`, dialect postgresql, url `Resource.DbUrl.value`. Because the config reads an SST secret at load time, **every drizzle-kit command must run under `sst shell`** (which resolves stage secrets; needs AWS credentials + root `.env` — see `cellar-config-and-secrets`). That is what the root scripts do (package.json:12-13):

```bash
pnpm db <subcommand>   # = sst shell drizzle-kit <subcommand>
pnpm db:studio         # = sst shell drizzle-kit studio  (DB GUI — this is live shared data)
```

The procedure:

```bash
# 1. Edit or add a schema file under packages/core/sql/ (the config glob picks up any *.sql.ts).

# 2. Generate a migration (diffs schema code vs migrations/meta/*.json snapshots):
pnpm db generate
#    → writes migrations/00NN_<codename>.sql + migrations/meta/00NN_snapshot.json
#      and appends to migrations/meta/_journal.json

# 3. REVIEW the generated SQL before applying (new files are untracked, so use
#    status + cat, not git diff). drizzle-kit expresses some changes
#    (renames, type changes) as DROP+ADD — that destroys data on a shared DB.
git status --short migrations/ && cat "$(ls -t migrations/*.sql | head -1)"

# 4. Apply (OWNER-GATED — see warning below):
pnpm db migrate
# explicit-stage form:
pnpm exec sst shell --stage <stage> drizzle-kit migrate
```

Subcommand names verified against `pnpm exec drizzle-kit --help` (2026-07-07): `generate`, `migrate`, `introspect`, `push`, `studio`, `up`, `check`, `drop`, `export`. Steps 2/4 cannot run in a sandbox without AWS creds (`Resource.DbUrl.value` throws outside `sst shell`); that's an environment limit, not a bug (`cellar-build-and-env`).

**Which database does `migrate` hit?** The `DbUrl` secret of whichever stage `sst shell` runs as — your personal stage by default (stage defaults to your username), `--stage prod` for prod. **But all stages have historically pointed at the same Supabase database** (§8), so a migrate "from your dev stage" is, in practice, a prod schema change. Treat every `pnpm db migrate` as a prod deploy: owner approval per `cellar-change-control` before running it.

**Never use `drizzle-kit push`** here — it applies schema diffs directly with no migration file, no review step, and no journal entry, on a database prod is reading. If you're tempted, you want `generate` + `migrate`.

## 7. The Feb-2025 squash, and the append-only rule

Commit `8b3b837` (2025-02-05, "Refactor database models…") deleted all 18 accumulated migrations (0000–0017) and re-baselined the history to today's three files: `0000_closed_mattie_franklin.sql`, `0001_pale_nighthawk.sql`, `0002_light_miss_america.sql` (journal timestamps 2025-02-05/06, migrations/meta/_journal.json). This only works if the live database's drizzle migration ledger is manually reconciled to match the rewritten history — a one-time, risky, owner-executed event on the shared prod DB.

Rules derived from it:
- **Treat `migrations/` as append-only.** Never edit, rename, renumber, or delete a migration that may have been applied anywhere; `migrations/meta/` moves only via `pnpm db generate`.
- Never reset/re-baseline migration history without a written prod reconciliation plan approved by the owner (`cellar-change-control` — this is in the owner-only class).
- If generated SQL looks wrong, fix the schema code and regenerate the not-yet-applied file (delete it AND its journal/snapshot entries together, before anything has run it) — never hand-edit applied SQL.

## 8. Shared-DB discipline

One Supabase Postgres serves every stage. Evidence: commit `741ca41` (2024-10-14) "Added stage field to users **since db is shared across envs**". `DbUrl` is a per-stage secret so stages COULD diverge, but assume shared unless the owner says otherwise.

- **User-adjacent queries MUST filter by stage.** The pattern (models/user.ts:7-11): every user query goes through `applyWhere(...)`, which appends `eq(user.stage, Resource.App.stage)`. Any new query that touches `user` (or joins through it) without this filter leaks rows across stages — e.g. dev code acting on prod users. `createUser` stamps `stage` on insert (user.ts:17-22). Note `user.authId` is unique globally, NOT per stage: the same Clerk account cannot have rows in two stages (dev and prod use different Clerk instances, so this holds today).
- **Scraped tables (`show`, `room`, `comic`, `act`) are NOT partitioned.** A dev-stage scrape or seed writes rows that prod immediately serves. Keep dev writes limited to what the normal pipeline would write anyway (idempotent upserts, §4), and stay polite to CC while doing it (`cellar-scraping-reference`).
- **Any UPDATE/DELETE/TRUNCATE, hand-edit via `pnpm db:studio`/Supabase console, or comic-row merge is prod surgery** — owner approval + backup plan first (`cellar-change-control`). Remember the cascade map (§1): deleting one comic silently deletes its acts and every user's notification rows for it.

## 9. Bootstrap: an empty `show` table crashes things

Three call sites destructure `getLastShow()`'s first element and read `.timestamp` without a guard, so with zero show rows they throw `TypeError: Cannot read properties of undefined`:

| Crashes | Where | Visible as |
|---|---|---|
| `getComics` | models/comic.ts:53-59 | `GET /api/comics` 500s (reads both `getLastShow` and `getUpcomingShow` results unguarded) |
| newShowCron | functions/cron/newShowCron.ts:17-19 | discovery cron errors every 6h |
| syncCron | functions/cron/syncCron.ts:52-55 | hourly sync errors; `GET /sync-shows` 500s |

Seeding procedure (fresh DB, or after the shared DB was ever emptied). These hit the deployed API, which scrapes CC live and persists as a side effect — serial, one date at a time, respecting politeness rules in `cellar-scraping-reference`:

```bash
API=https://comedycellar-api.mafz.al        # prod (as of 2026-07-07); or your dev stage's API URL
D=$(date +%F)                               # a date CC has shows for, yyyy-mm-dd

# 1. Shows + rooms first (GET /api/shows → handleShowDetails persists room + show rows):
curl -s "$API/api/shows?date=$D" | head -c 300

# 2. Then the lineup for the same date (GET /api/line-up → handleLineUp persists
#    comic + act rows; acts resolve against the show rows written in step 1):
curl -s "$API/api/line-up?date=$D" | head -c 300

# 3. Repeat for a few more dates with sleeps in between. Once ≥1 show row exists,
#    the crons take over discovery/sync on their own.
```

Order matters: line-up before shows writes comics but zero acts (no show row matches the timestamp), and acts are NOT retroactively backfilled by the hourly sync for past dates. Do NOT seed with `GET /sync-shows` — it calls `getLastShow` first and 500s on the empty table.

## 10. Known data-quality issues (open — do not silently "fix"; route through change control)

| Issue | Evidence | Status |
|---|---|---|
| `/api/shows/new` returns a show once per comic on its lineup ("N-plicated"), and `total` counts act-rows: `getShows`/`getShowsCount` inner-join show→act→comic with no GROUP BY/DISTINCT | models/show.ts:186-246 | open |
| Shows with zero acts (typically `special` shows) are invisible in `/api/shows/new` (inner join drops them) | same join | open |
| Comic duplicates from name variants; no merge tooling | §3 | open |
| Stored `show.soldout`/`available`/`timestamp` never refreshed after first insert | §4 | open (API computes soldout instead) |
| `maxReservationSize` stuck at default 4 for all rooms | §5 | open |
| `database.ts` self-import leaves `relations()`/`db.query.*` inert | database.ts:5 | open trap |
| Notification tables written but never read to notify anyone | §0 | open — flagship gap, see `cellar-frontier-and-method` |

## Add-a-table / add-a-column checklist

1. New file `packages/core/sql/<name>.sql.ts` following the house pattern: `id serial PK` + `externalId` with `createExternalId(PREFIX)` default + `createdAt` — add the PREFIX to `common/constants.ts`. Skipping externalId is allowed only for internal-only tables; say why in a comment (precedent: comicToUser.sql.ts:16).
2. Decide partitioning: user-adjacent data gets a `stage text NOT NULL` column AND an `applyWhere`-style stage filter on every query (§8); scraped/shared data gets a comment saying it is shared.
3. Don't rely on `relations()`/`db.query.*` (§1 inert-schema trap); write models with the query builder in `packages/core/models/`.
4. If the table has any expression/partial unique index, re-read §3 (56581a9) before writing its upsert; pick the conflict target deliberately and document what refreshes vs what doesn't (add it to the §4 table).
5. `pnpm db generate` → review SQL → get owner approval → `pnpm db migrate` (§6).
6. Behavior-affecting or destructive? Stop and run the gates in `cellar-change-control`. Zero tests exist (as of 2026-07-07), so evidence standards come from `cellar-validation-and-qa`.

## Provenance and maintenance

Verified 2026-07-07 against working tree at commit `c8d9918` (branch == main) by reading: all 8 `packages/core/sql/*.sql.ts`; `packages/core/models/{show,comic,room,act,user,showNotification,comicNotification}.ts`; `packages/core/{handleLineUp,handleShowDetails,database}.ts`; `packages/functions/cron/{newShowCron,syncCron}.ts`; `packages/functions/{lineUp.ts,shows/index.ts}`; `infra/{cron,config}.ts`; `drizzle.config.ts`; root `package.json`; `.env.template`; `migrations/*` incl. `meta/_journal.json`. Commands run: `pnpm exec drizzle-kit --help` and `--version` (v0.31.10); grep for `comic_to_user`/`isLiked` usage. Git evidence: `git show 8b3b837 --stat` (18→3 migration squash), `git show 56581a9` (onConflict target removal diff), `git log` for `741ca41` (shared-DB commit message). Not verifiable here: anything requiring a live DB connection or AWS creds (`pnpm db *`, actual DbUrl values, whether stages' DbUrls are literally identical today — stated as historical/assumed above).

| May drift | Re-verify with |
|---|---|
| Table/column/constraint set | `cat migrations/*.sql` and `ls packages/core/sql/` |
| No new migrations since 0002 | `cat migrations/meta/_journal.json` |
| drizzle-kit subcommands/version | `pnpm exec drizzle-kit --help && pnpm exec drizzle-kit --version` |
| `pnpm db` script wiring | `grep '"db' package.json` |
| roomDictionary contents | `sed -n '27,32p' packages/core/models/show.ts` |
| createShows refreshed-column list | `sed -n '165,180p' packages/core/models/show.ts` |
| Stage-filter pattern intact | `sed -n '7,11p' packages/core/models/user.ts` |
| comic_to_user still unused | `grep -rn isLiked packages/ --include='*.ts' \| grep -v sql/` |
| Prefix list | `cat packages/core/common/constants.ts` |
