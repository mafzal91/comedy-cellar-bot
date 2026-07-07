---
name: cellar-scraping-reference
description: >-
  Domain-knowledge pack for talking to comedycellar.com from this repo: the three
  reverse-engineered endpoints (lineup HTML-in-JSON, getShows JSON, addReservation REAL booking)
  with request/response contracts, the HTML parse contract in parseLineUp.ts, the requester.ts
  fingerprint (random UA + hardcoded x-code-localize anti-bot token + x-page-creation), the
  anti-bot/politeness history, NY-timezone doctrine, and unofficial-fan-site positioning. Use when
  changing or debugging any fetch to comedycellar.com, decoding/recapturing the x-code-localize
  header, editing parseLineUp / fetchLineUp / fetchShows / createReservation, understanding show-id
  identity, empty/garbage scrape output, or reservation booking rules. NOT a live-outage runbook —
  see cellar-scraper-recovery-campaign for that.
---

# cellar-scraping-reference

Everything about how this project speaks to `comedycellar.com`, verified against the repo on 2026-07-07. This is the reference (contracts, anatomy, history). It is not a step-by-step outage runbook.

**When NOT to use this skill:**
- A scraper is broken *right now* and you need a decision-gated recovery procedure → **cellar-scraper-recovery-campaign**.
- You need symptom→triage tables and discriminating experiments → **cellar-debugging-playbook**.
- You need the DB schema / upsert conventions for what gets stored → **cellar-data-model**.
- You need "who approves changing this / which gate applies" → **cellar-change-control**.
- You need the system map / invariants → **cellar-architecture-contract**.

Any change here that alters behavior must end at **cellar-change-control**'s gates before it ships. Prod deploys, secret rotation, and cron-schedule changes are owner-only.

---

## 0. Non-negotiable house rules (read before editing anything in this pack)

| Rule | Why | Enforced at |
|---|---|---|
| **Never create a real reservation outside `prod`.** `POST addReservation` books a REAL seat at a real club. | The venue's real booking system; spamming it from dev burns goodwill and can get us blocked. | `createReservation.ts:10` gates the live POST behind `process.env.STAGE === "prod"`; all other stages return the fixture. Do not remove or widen this gate. |
| **Be polite to comedycellar.com.** Keep serial fetching + sleeps. Never parallel-scrape many dates, never hammer. | We present as one ordinary visitor. Parallel/rapid scraping is what triggers anti-bot. | `sleep(5000)` between dates in `newShowCron.ts:62`; `sleep(7500)` in `syncCron.ts:88`; syncCron fetches only `[dates[0]]` (one date/run). |
| **The shared Supabase DB is prod.** All stages write scraped tables (show/comic/act/room) into one Postgres. | Dev scraping mutates data prod reads. | See **cellar-data-model**. Treat destructive DB work as prod surgery. |
| Prod deploy / secret rotation / cron schedule changes are **owner-only**. | | **cellar-change-control**. |

---

## 1. The three reverse-engineered endpoints

All go through the shared axios client `packages/core/requester.ts` (`baseURL: https://www.comedycellar.com`). Response types live in `packages/types/api.ts` (namespace `ApiResponse` / `ApiRequest`). **None of these responses is runtime-validated** — every fetcher blind-casts, so shape drift surfaces as a `TypeError` or a silent empty result, not a clean error.

### 1.1 Endpoint A — line-ups (HTML fragment inside JSON)

- **Where:** `packages/core/fetchLineUp.ts`
- **Request:** `POST /lineup/api/`, `content-type: application/x-www-form-urlencoded` (overrides the client default). This is a WordPress `admin-ajax` style call.
  - Body (form-encoded via `URLSearchParams`, fetchLineUp.ts:8-15):
    - `action=cc_get_shows`
    - `json=` `JSON.stringify({ date, venue: "newyork", type: "lineup" })` — `venue` is **hardcoded** to `"newyork"`; `date` is `yyyy-MM-dd` NY-zone (see §6).
- **Response:** JSON. The actual payload is an **HTML fragment** at `res.data.show.html` (fetchLineUp.ts:31). If `res.data.show` is absent the destructure throws a `TypeError`, which is logged (`console.log(error)`) and rethrown (fetchLineUp.ts:33-36).
- The HTML fragment is handed to `parseLineUp` (§3).

### 1.2 Endpoint B — show inventory (pure JSON)

- **Where:** `packages/core/fetchShows.ts`
- **Request:** `POST /reservations/api/getShows`, JSON body `{ date }` (fetchShows.ts:7-9). Uses the client default `content-type: application/json`.
- **Response:** `res.data.data.showInfo`, blind-cast to `ApiResponse.GetShowsResponse` (fetchShows.ts:13). `showInfo.shows[]` is the inventory. Full field contract, from `packages/types/api.ts:12-30` (`ApiResponse.Show`):

  | Field | Type | Notes / how it's used here |
  |---|---|---|
  | `id` | number | The CC numeric show id. **Becomes the local `show.id` PK on upsert** (see cellar-data-model). |
  | `time` | string | `"HH:MM:SS"`. Reservation cross-check compares this to submitted `settime` (reservation.ts:77). |
  | `description` | string | Free text (e.g. lineup blurb). |
  | `forwardUrl` | string | CC-provided redirect URL. |
  | `soldout` | boolean | **Not trusted.** Comment at show.ts:103: "soldout from comedy cellar api is not accurate." We recompute locally as `totalGuests >= max` (show.ts:83-85). |
  | `max` | number | Capacity used for the local sold-out calc. |
  | `special` | boolean | Special event; specials often have no lineup fragment. |
  | `roomId` | number | Room key. Mapped to a name via a **hardcoded** `roomDictionary` (show.ts:27-32): 1=MacDougal St, 2=Village Underground, 3=Fat Black Pussycat, 5=Unknown. A new/unknown roomId ⇒ name `undefined` ⇒ NOT NULL violation, swallowed. |
  | `cover` | number | Cover charge. |
  | `note` | string \| null | |
  | `mint` | boolean | |
  | `weekday` | number | |
  | `totalGuests` | number | Drives local sold-out + occupancy. |
  | `venueMin` / `venueMax` | number | |
  | `available` | number | |
  | `timestamp` | number | **Unix seconds. The public show identity — see §2.** |

### 1.3 Endpoint C — reservation booking (REAL money/seats)

- **Where:** `packages/core/createReservation.ts` → wrapped by `packages/core/handleReservation.ts` → called from `packages/functions/reservation.ts` (route `POST /api/reservation/{timestamp}`).
- **Request:** `POST /reservations/api/addReservation`, JSON body = `ApiRequest.CreateReservationRequest` (api.ts:85-126):
  - `guest`: `{ email, firstName, lastName, size, phone, howHeard, smsOk }`.
    - `phone` must be exactly 10 chars; `size` ≥ 1 (Zod, models/reservation.ts:9-10).
    - `howHeard` is a **25-value enum** mirroring the site's marketing dropdown ("Conan O'Brien", "Howard Stern", "Zagat", "Olive Tree", …; api.ts:93-119 / reservation.ts:11-38). If CC changes that dropdown, our enum drifts.
    - `smsOk`: `"Yes" | "No"`.
  - `showId` (number), `date` (`YYYY-MM-DD`), `settime` (`HH:MM:SS`).
- **THE FENCE:** `createReservation.ts:10` — the live POST fires **only when `process.env.STAGE === "prod"`**. Only `POST /api/reservation/{timestamp}` sets `STAGE` (infra/api.ts:84-86). Every other stage returns the canned fixture and books nothing.
- **Response shape** is documented by the fixture `packages/__fixtures__/createReservation.ts` (a captured real success payload — do not treat its `reservationId`/emails as live data). Key fields the code depends on:
  - `data.responseCode` — must be `200` or `handleReservation.ts:13-15` throws `ReservationError` with `data.message`.
  - `data.content.message` — HTML confirmation blurb. It is sanitized with `sanitize-html` after `htmlContent.replace("\n","<br/>")` — note `.replace` with a string replaces **only the first** newline (handleReservation.ts:19; known cosmetic bug).
  - `data.reservationId`, `data.content.email`, `data.content.conversionInfo` (cover/guestCount/totalValue).
- Pre-booking cross-checks (reservation.ts:63-87) re-scrape the date live and reject if: show id not found, locally-sold-out, `settime !== show.time`, or `size > room.maxReservationSize` (that field is never set from scraping, so it's always the default 4). The **real** gate is CC's own API response; our checks are best-effort against a possibly-stale scrape.

---

## 2. Identity model: the show timestamp IS the show

One fact ties the whole system together:

> **`showid` (in the reservation URL) = Unix seconds = the show's `timestamp` = the public show identity.**

- In lineup HTML the reservation link is `.../reservation/?showid=<unixseconds>`. `parseLineUp` extracts the substring after `showid=` and `parseInt`s it into `timestamp` (parseLineUp.ts:72,80).
- In getShows JSON, `Show.timestamp` is the same Unix-seconds value (api.ts:29).
- The reservation route is keyed by that timestamp: `POST /api/reservation/{timestamp}`; the handler requires it match `/\b\d{10}\b/` (reservation.ts:23) and not be in the past (reservation.ts:34), then derives NY-zone `date`/`settime` from it via `parseTimestampString` (models/reservation.ts:73-78).
- `handleLineUp` joins a scraped lineup to a stored show by looking up **exactly one** show with that timestamp (`getShowByTimestamp`, handleLineUp.ts:31,34). Zero or >1 matches ⇒ the acts for that show are silently skipped. A lineup with no reservation link ⇒ `timestamp === undefined` ⇒ the lookup throws inside the swallowed `try`.

Consequence: getShows (Endpoint B) must run and store the show **before** the lineup join can attach comics to it. The crons order this correctly; ad-hoc reruns may not.

---

## 3. The HTML parse contract (`packages/core/parseLineUp.ts`)

`parseLineUp({ html })` turns the Endpoint-A fragment into `ApiResponse.LineUp[]` using cheerio. It is **entirely dependent on comedycellar.com's CSS class names** — a site redesign that renames any of these produces a silent empty list or garbage, not an error.

Required structure:

| Selector | Meaning | If it changes |
|---|---|---|
| Fragment has **no shared parent** | The API returns sibling `.lineup` nodes. parseLineUp wraps them in `<div>${html}</div>` first (parseLineUp.ts:57) so cheerio can select the list. Keep this wrap. | — |
| `.no-shows` | Empty-day sentinel. Presence ⇒ return `[]` (parseLineUp.ts:60-62). | If CC renames it, empty days parse as garbage or throw. Added by commit **f8b6976** ("Checking for empty lineup from cc", local). |
| `.lineup` | One per show (parseLineUp.ts:66). | No shows parsed. |
| `.make-reservation > a[href]` | Reservation link; source of `showid` → `timestamp` (parseLineUp.ts:68-72). | `timestamp` becomes `undefined` ⇒ show can't be joined to lineup (§2). |
| `.set-content` | One per act/comic (parseLineUp.ts:38). | No acts parsed. |
| `.name` | Comic name. `parseNameDescription` reads `.name` text, **removes that node**, then treats the remaining parent text as the description (parseLineUp.ts:16-26). | Name/description both break. |
| first `<img src>` in `.set-content` | Comic photo. | `img` undefined ⇒ comic fails `isValidComic` (needs name AND img). |
| first `<a href>` in `.set-content` | Comic website. | `website` undefined (non-fatal). |

Downstream (`models/act.ts` `Lineup` class): `reservationUrl` and each `img` are prefixed with `https://www.comedycellar.com/` (act.ts:26,29) — so a missing/absolute value yields `".../undefined"` or a double-prefixed URL. `description` is lowercased on ingest (act.ts:30).

**Silent-failure signature of a redesign:** fetch succeeds (HTTP 200), `parseLineUp` returns `[]` or acts with blank names, comics/acts stop being created, no error is emailed. Confirm by logging the raw `res.data.show.html` and checking whether the classes above still exist. See **cellar-diagnostics-toolkit** for a measure-don't-eyeball recipe and **cellar-scraper-recovery-campaign** for the outage runbook.

---

## 4. Request fingerprint (`packages/core/requester.ts`)

The client bakes three anti-bot-relevant headers **once at module load** (i.e., once per Lambda cold start — NOT per request):

### 4.1 `User-Agent` — random realistic UA per cold start
`new UserAgent().toString()` from the `user-agents` npm package (requester.ts:11). One random realistic desktop UA is chosen when the module loads and reused for the container's lifetime. Not rotated per request. Introduced by commit **411fa43** (2024-01, "random user-agent"; recovered from GitHub history — **not in the local shallow clone**, so `git show 411fa43` fails here).

### 4.2 `x-code-localize` — the load-bearing captured token
`requester.ts:12-13` hardcodes a token of the form:

```
<64-hex-char blob> "." <base64 of "unixTimestamp-IPv4">
```

- This was **captured from a real browser session** to defeat comedycellar.com's header-based anti-bot check. It is the single most fragile thing in the scraper.
- **Do NOT reproduce the value in any file, doc, or commit message.** Reference it by path.
- **Decode the base64 tail to read its provenance** (read-only, safe — reads the token already in the repo; the trailing `-<IP>` is stripped so only the non-PII timestamp is printed):

  ```bash
  cd /home/user/comedy-cellar-bot
  awk -F'"' '/[a-f0-9]{64}\./ {print $2}' packages/core/requester.ts | cut -d. -f2 | base64 -d | cut -d- -f1; echo
  ```

  Verified output (as of 2026-07-07): `1726188037` — i.e. Unix `1726188037` = **2024-09-13 UTC**. (The decoded tail also contains a trailing residential IPv4; it is mild PII, **do not reproduce it** — the `cut -d- -f1` above drops it.) That date matches when the token was committed (**122ccf5**, "fixed request headers"; recovered from history, not local) to end the first ~5-month outage; the timestamp shows the token is old and load-bearing.
- **If the site starts rejecting requests, the token is the prime suspect.** Recapture recipe (a human with a browser must do this; the sandbox cannot reach the site):
  1. Open `https://www.comedycellar.com/line-up/` (or any lineup page) in a real browser.
  2. Open DevTools → Network tab, reload, and find the `cc_get_shows` / `getShows` XHR.
  3. Copy the `x-code-localize` request header value from that real request.
  4. Paste it into `requester.ts:12-13`, replacing the old value. This is a behavior-changing edit → route through **cellar-change-control**; treat rotating a captured credential as owner-territory.
  - Full decision-gated procedure: **cellar-scraper-recovery-campaign**.

### 4.3 `x-page-creation` — frozen-per-container gotcha
`requester.ts:14`: `"x-page-creation": +new Date()`. Evaluated **once at module load**, so every request from a warm container sends the same millisecond timestamp (the cold-start time), not the current time. If CC ever validates freshness of this header, warm Lambdas would look stale. Currently believed inert but worth knowing.

There is **no** axios-level retry, timeout, or proxy on this client (requester.ts). Retry lives only in `syncCron`'s `withRetry` (§5).

---

## 5. Anti-bot & politeness history

Evolution of scraping defense (SHAs before 2024-10-11 are **recovered from GitHub history, not in the local shallow clone**; SHAs marked *local* are checkoutable here):

| Era | Change | Evidence |
|---|---|---|
| 1. Naive | Plain axios, no fingerprint. | 2023-12 origins. |
| 2. UA randomization | Shared `requester.ts`; random UA per cold start via `user-agents`. | **411fa43** (2024-01, history) |
| 3. Token capture (ended a ~5-month outage) | Added hardcoded `x-code-localize` (Sep-2024 token) + `x-page-creation`. CC had deployed a header anti-bot check that silently broke the scraper during a dormancy. | **122ccf5** (2024-09-13, history) |
| 4a. Politeness — pacing | `sleep(5000)` between dates in newShowCron; syncCron reduced to **one date per hourly run** (`[dates[0]]`), `sleep(7500)`. | `newShowCron.ts:62`, `syncCron.ts:68,88` |
| 4b. Politeness — retry/backoff | `withRetry` (3 attempts, delay `5000 * attempt` = **linear** 5s/10s despite the "Exponential backoff" comment), `Promise.allSettled`. | **adafd66** (2024-11-24, *local*), `syncCron.ts:16-42` |
| 5. Parser hardening | `.no-shows` empty-day detection; `.trim()` on names. | **f8b6976** (2024-10-25, *local*) |

Etiquette rules and **why** they exist:

- **Serial, sleep-spaced fetching.** We must look like one human visitor. The whole point of the captured token + random UA is to blend in; parallel bursts throw that away and re-trigger exactly the anti-bot that caused the outage.
- **One date per sync run.** syncCron intentionally iterates only `[dates[0]]` even though it computes a full date range (the range is dead code). Refreshing "today" hourly is enough; walking the whole horizon every hour would hammer the site.
- **No headless browsers, no commercial proxy rotation.** The project has deliberately never gone down that road — captured-token + UA + politeness only.
- **The site can and did change its anti-bot silently.** Two multi-month dormancies ended with the scraper already broken. Assume the token is a time bomb.

---

## 6. Timezone doctrine

> **The club lives in `America/New_York`. Every date string sent to CC is NY-zone `yyyy-MM-dd`. Show identity is Unix seconds.**

- `America/New_York` is hardcoded as the default TZ in `getFutureDatesByDay.ts:14`, `utils.ts:6` (`parseTimestampString`), and `newShowCron.ts:28,32`.
- `parseTimestampString` (packages/core/utils.ts:4-23): Unix seconds → ms → `toZonedTime(NY)` → `format` `yyyy-MM-dd` and `HH:mm:ss`. This is how a show timestamp becomes the `date`/`settime` sent to `addReservation`.
- **The DST incident:** the default TZ was once a fixed offset `Etc/GMT+5`, which is wrong for half the year. After US DST began (2024-03-10), EDT made the fixed offset off by an hour; dates computed near midnight landed on the wrong day. Fixed by switching the default to `America/New_York` (commit **6886326**, 2024-04-13, "fixed timezone issue"; recovered from history). Lesson: **never** use a fixed UTC offset for CC dates — always the named zone, so DST is handled.
- Residual hazard: some date math starts from Lambda-UTC `new Date()` before re-zoning (e.g. `syncCron.ts:49-51`), so between ~00:00–05:00 UTC (evening in NY) "today" can be off by one. If you touch date logic, verify against NY wall-clock, not UTC. Full analysis in **cellar-debugging-playbook** / **cellar-failure-archaeology**.

---

## 7. `frontier.ts` — an UNRELATED airline scraper (do not confuse with CC scraping)

`packages/functions/frontier.ts` (route `GET /api/frontier`, public/unauthenticated) is a **Frontier Airlines fare scraper** that happens to be hosted on this infra. It has **nothing to do with Comedy Cellar** and does not touch the DB. Called by nothing in the repo — effectively an open proxy on the prod API domain.

It is useful only as a **case study of more aggressive techniques** the CC scraper deliberately does NOT use:
- A full hardcoded Chrome-143/macOS header set incl. `sec-ch-ua`, `sec-fetch-*`, `dnt`, `priority` (frontier.ts:39-56).
- **Manual redirect following** (max 2) with a hand-rolled cookie jar that parses `Set-Cookie` and re-sends the accumulated `Cookie` header, updating `referer` per hop (frontier.ts:99-173).
- **Captcha/bot-wall detection** by scanning page text/title for "captcha", "just a moment", "access denied", "bot protection", "security check" → returns 403 (frontier.ts:183-208).
- **Inline-script JSON extraction:** finds `FlightData = '…'` in a `<script>`, then a regex chain to de-entitize and un-double-escape ASP.NET-style serialized JSON before `JSON.parse` (frontier.ts:212-252).

If you're ever asked to harden the CC scraper, this file is a menu of options — but adding cookie jars / captcha handling / full fingerprints to the CC path is a real design change and goes through **cellar-change-control** and **cellar-architecture-contract**.

---

## 8. Positioning & ethics

- This is an **unofficial, personal, non-commercial fan site**, not affiliated with Comedy Cellar. The Terms page states it plainly and links users to `comedycellar.com` to reserve directly: `packages/frontend/src/pages/Terms/index.tsx` ("personal, non-commercial project", :32; "You don't have to use this website to reserve tickets… reserve directly through Comedy Cellar", :243-254; effective date 2024-10-01, :27).
- **Reservation caution is baked into the history.** Real submissions were originally commented out, enabled only later, then stage-gated, then given a mock/fixture response for non-prod (commit **391196d**, *local*, "Implement reservation error handling and mock response"). The prod-only fence in `createReservation.ts` is the current form of that caution — respect it.
- **Single-visitor-equivalent load** is the guiding principle: the scraper should never generate more traffic than one attentive fan clicking around. Sleeps, serial fetching, and one-date-per-run all serve that.

---

## Provenance and maintenance

**Verified against (repo @ branch `claude/skill-library-continuity-4m3x56`, 2026-07-07):**
- Files read in full: `packages/core/{requester,fetchLineUp,parseLineUp,fetchShows,createReservation,handleReservation,handleLineUp,handleShowDetails,utils}.ts`, `packages/core/models/{show,reservation,act}.ts`, `packages/functions/{reservation}.ts`, `packages/functions/cron/{newShowCron,syncCron}.ts`, `packages/functions/frontier.ts`, `packages/types/api.ts`, `packages/__fixtures__/createReservation.ts`, `infra/{api,cron}.ts`, `packages/frontend/src/pages/Terms/index.tsx`.
- Token tail decoded via the §4.2 command → leading timestamp `1726188037` (2024-09-13 UTC). Verified. (Trailing residential IP intentionally not reproduced here — see §4.2.)
- Local git confirms **adafd66, f8b6976, 391196d** are checkoutable; **411fa43, 122ccf5, 6886326, 40d6024, bea2b49, ca85460** are NOT in the local shallow clone (grafted 2024-10-11) and were carried from the archaeology report's GitHub-API recovery.
- Cross-checked leads from the four discovery reports; every fact above was re-read in source.

**Re-verify (these drift):**

| Fact | Command / check |
|---|---|
| `x-code-localize` token still the 2024-09-13 one | `awk -F'"' '/[a-f0-9]{64}\./ {print $2}' packages/core/requester.ts \| cut -d. -f2 \| base64 -d \| cut -d- -f1; echo` → expect `1726188037` (trailing IP stripped; do not reproduce it) |
| addReservation still prod-gated | `grep -n 'STAGE === "prod"' packages/core/createReservation.ts` |
| Endpoint paths unchanged | `grep -rn '/lineup/api/\|/reservations/api/getShows\|/reservations/api/addReservation' packages/core` |
| Parser still keys on these classes | `grep -n '\.no-shows\|\.lineup\|\.set-content\|\.name\|\.make-reservation' packages/core/parseLineUp.ts` |
| Cron pacing/sleeps | `grep -n 'sleep(' packages/functions/cron/*.ts` |
| syncCron still one-date-per-run | `grep -n '\[dates\[0\]\]' packages/functions/cron/syncCron.ts` |
| Show field contract | `sed -n '12,30p' packages/types/api.ts` |
| Cron schedules (owner-only to change) | `grep -n 'schedule:' infra/cron.ts` → `cron(0 0/6 * * ? *)`, `cron(0 0/1 * * ? *)` |
| Terms positioning unchanged | `grep -n 'non-commercial\|reserve directly' packages/frontend/src/pages/Terms/index.tsx` |
