# Email Notification Frequency

How the "how often should we email you" setting works for the two global
subscriber emails.

## What this is

Signed-in users can opt in to two **global** emails:

- **New Show Alerts** — a heads-up when new shows are added.
- **New Comic Alerts** — a heads-up when a comic new to the Comedy Cellar joins a lineup.

For each of these, a user can choose **how often** they want to hear from us:

- **Immediately** — as soon as there's something to announce.
- **Weekly** — at most one digest every 7 days.
- **Monthly** — at most one digest every 30 days.

This setting does **not** apply to the "a comic I follow was booked" emails. Those
are event-driven and unchanged.

> Note: the UI only offers Immediately / Weekly / Monthly, but the backend stores
> the cadence as an arbitrary number of minutes. Adding a new preset (e.g. "Every
> 2 weeks") is a one-line change in the settings page — no backend or database
> change needed.

## The core idea: one cursor per user

The system does **not** keep a record of "we sent show X to user Y." That would be
a lot of rows to store and clean up. Instead, each subscriber has a single
timestamp per channel:

- **`lastNotifiedAt`** — the moment we last emailed this user for this channel.
  (Empty if we've never emailed them yet.)

Think of it as a bookmark. Everything queued *before* the bookmark has been handled;
everything queued *after* it is still owed to the user.

New shows and new comics are written into small "to-be-announced" queues as they're
discovered (`new_show_queue` and `new_comic_queue`). These queue rows are **kept
around**, not deleted the moment one email goes out — because a weekly or monthly
subscriber may still need an item that an "immediately" subscriber already received.

## How a user gets emailed

A background job runs **every 15 minutes**. On each run, for each channel, it asks a
simple question about every subscriber:

**1. Is there anything new for them?**
Look at the queue and keep only the items queued *after* their `lastNotifiedAt`
bookmark. If there's nothing newer than their bookmark, skip them.

**2. Is it time to email them again?**
Compare `now − lastNotifiedAt` against their chosen cadence:

- Immediately → 60 minutes (see "the batch window" below)
- Weekly → 7 days
- Monthly → 30 days

If not enough time has passed, skip them for now.

**Both** questions must pass. When they do, we:

1. Move their bookmark forward (`lastNotifiedAt = now`) — **before** sending.
2. Build one email containing the new items and send it.

That's the whole loop. There's no scheduler picking exact send times — the job just
wakes up every 15 minutes and asks these two questions.

## The batch window (why "immediately" isn't instant)

New shows are usually posted in a burst over about an hour. If we emailed on every
15-minute tick, a user could get several emails for one batch of shows.

So "immediately" really means **"at most once per hour."** New items are held for a
60-minute window so a burst arrives in a **single** email. This 60-minute window is
also a floor for *every* cadence — no one is ever emailed more than once per hour,
whatever their setting.

The first email a brand-new subscriber gets also waits for this window (rather than
the full 7 or 30 days), so a new weekly subscriber still gets a starter digest
promptly, then settles into their weekly rhythm afterward.

## Keeping the queues from growing forever

Because queue rows are kept (not deleted on send), they're cleaned up on a schedule
instead:

- **New shows** — a queued show is dropped once the show has **already started**.
  We only ever email people about **upcoming** shows, so a show in the past is useless
  to everyone. (This means: if a show was added after your bookmark but has already
  happened by the time your weekly digest fires, you simply won't hear about it —
  which is what you'd want.)
- **New comics** — a comic has no "showtime" to expire, so queued comics are dropped
  after **45 days**. That's comfortably longer than the longest cadence (monthly, 30
  days), so a monthly subscriber never misses one.

## Worked example

Two users subscribe to **New Show Alerts**:

- **Ava** — Immediately
- **Ben** — Weekly

Timeline:

| When | What happens |
|---|---|
| 09:01 | SHOW-1 is discovered and queued |
| 09:03 | SHOW-2 is discovered and queued (2 minutes later) |
| 09:15–10:00 | Job runs, but the 60-minute batch window hasn't passed → nobody emailed yet |
| **10:15** | Window passed. **Both** Ava and Ben get **one** email with SHOW-1 + SHOW-2. Both bookmarks move to 10:15. |
| 10:20 | SHOW-3 is discovered and queued |
| **11:15** | SHOW-3 is newer than both bookmarks (10:15). Ava's cadence (60 min) has elapsed → **Ava is emailed SHOW-3**, bookmark → 11:15. Ben's cadence (7 days) has **not** elapsed → Ben waits, bookmark stays 10:15. |
| ... | SHOW-3 stays in the queue (it hasn't started yet) |
| **7 days later** | Ben's 7 days are up. SHOW-3 is still newer than his bookmark (10:15) → **Ben is emailed SHOW-3**, bookmark advances. Ava gets nothing — her bookmark (11:15) is already past SHOW-3, so it's not "new" for her. |

Two things this shows:

- **The two shows 2 minutes apart become one email**, thanks to the batch window.
- **Ava and Ben diverge** for SHOW-3: Ava gets it the same morning, Ben gets it a week
  later, and neither gets it twice — purely from comparing each user's bookmark
  against when items were queued.

## Where this lives in the code

| Piece | File |
|---|---|
| Cadence values, presets, batch window, interval math | `packages/core/common/notificationFrequency.ts` |
| The "who is due and what do they get" decision | `packages/core/notificationDelivery.ts` (`selectDueRecipients`) |
| Per-user settings + bookmark (new shows) | `packages/core/models/showNotification.ts`, `packages/core/sql/showNotification.sql.ts` |
| Per-user settings + bookmark (new comics) | `packages/core/models/newComicNotification.ts`, `packages/core/sql/newComicNotification.sql.ts` |
| The show queue + pruning | `packages/core/models/newShowQueue.ts` |
| The comic queue + pruning | `packages/core/models/newComicQueue.ts` |
| The 15-minute jobs that send the emails | `packages/functions/cron/showNotificationCron.ts`, `packages/functions/cron/newComicNotificationCron.ts` |
| Read/write the setting | `packages/functions/settings/index.ts` |
| The settings UI | `packages/frontend/src/pages/Profile/profileSettings.tsx` |

### The two database columns that make it work

On both `show_notification` and `new_comic_notification`:

- **`frequencyMinutes`** (integer, default `0`) — the chosen cadence. `0` = immediately.
- **`lastNotifiedAt`** (timestamp, nullable) — the bookmark. Empty until the first email.

Added in migration `migrations/0004_email_frequency.sql`.

## Deploying this feature (first-run behavior)

Before this feature, `new_show_queue` rows were never deleted — an announced row
was just flagged (`notifiedAt` set) and left in the table. The new code ignores
that old flag and instead uses each user's cursor. That creates a one-time
deploy concern: with a fresh `lastNotifiedAt` starting empty, the first cron run
would treat every still-upcoming show already in the queue as "new" and email it
to everyone.

Two things in the migration handle this:

1. **Cursor backfill.** Migration `0004` stamps every *existing* subscriber's
   `lastNotifiedAt = now()`, immediately after adding the column. So on the first
   tick they're already "caught up" and the pre-existing backlog is **not**
   re-announced. It's in the same migration as the column-add on purpose — the
   cron runs every 15 minutes regardless of deploys, so there must be no moment
   where the column exists as NULL for an existing subscriber. New subscribers
   created after deploy keep NULL and correctly receive a starter digest.
2. **Automatic pruning.** On that first tick, `prunePastShows` deletes queue rows
   whose show has already started (the bulk of the old backlog). Rows for
   still-upcoming shows are kept but, thanks to the backfill, are not emailed to
   existing subscribers; they age out of the queue when their show starts.

Net first-run result after backfill: past-show rows deleted, upcoming-show rows
retained silently, **zero notification blast**. Only shows queued *after* deploy
trigger emails.

## One assumption to be aware of

The bookmark is a "high-water mark" — it assumes items are always queued in time
order, so "everything before the bookmark is handled" holds true. In normal operation
an item's queue time is just "now, when we discovered it," so this is always the case.
The only thing that would break it is **back-filling** an item with an old queue time:
a user whose bookmark already moved past that time would never see it. If back-fill
logic is ever added, that's the edge to design around.
