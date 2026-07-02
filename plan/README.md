# Handoff: Comedy Cellar — Site Redesign

## Overview
An unofficial fan-built reservation/listings site for NYC's Comedy Cellar. It lets people
browse tonight's shows, see real-time seat availability, reserve seats, browse the comic
roster, view individual comic pages, manage notification preferences, and read a product
changelog. The visual direction is a **"vintage marquee / ticket-stub"** aesthetic:
warm cream paper, heavy black ink lines, a single marquee-yellow accent, condensed display
type, and hard offset "block-print" shadows. Full **light + dark mode**.

## About the Design Files
The files in `designs/` are **design references created in HTML** — prototypes that show the
intended look, layout, and behavior. **They are not production code to copy directly.**

They are authored in a lightweight in-house template runtime (`support.js`, with `<x-dc>`,
`<sc-for>`, `<sc-if>` tags and a `class Component extends DCLogic` block). **Do not port that
runtime.** Treat each file as a spec: read the markup for structure/styling and the
`<script type="text/x-dc">` block at the bottom for the data shape and interaction logic.

Your task is to **recreate these designs in the target codebase's environment** (React, Vue,
Svelte, etc.) using its existing patterns, routing, and component conventions. If no codebase
exists yet, pick an appropriate stack — **React + Tailwind CSS v4 is the natural fit**, since
the design tokens are already provided as a Tailwind v4 theme (`theme.css`).

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, radii, shadows, and interactions
are all specified. Recreate the UI pixel-faithfully using the codebase's component library,
pulling exact values from `theme.css` and the per-screen notes below.

## Tech Setup (recommended)
- **Tailwind CSS v4**, CSS-first config. Use the provided `theme.css` as your stylesheet entry
  (`@import "./theme.css";` — it imports Tailwind and declares every token). See **Design Tokens**.
- **Dark mode** is attribute-driven: toggle `data-theme="dark"` on `<html>`. The provided
  prototypes persist the choice in `localStorage` under key `cc-theme` (`"dark"` / `"light"`)
  and render a floating round toggle button bottom-right. Reimplement this as a normal
  theme provider/toggle in your stack — don't copy the injected-button script.
- **Fonts** (Google Fonts): `Bebas Neue`, `Archivo` (400–900), `JetBrains Mono` (400/500/700).
- **Auth**: Sign In references Google OAuth + email, footer says "Secured by Clerk" — wire to
  your real auth provider.

## Screens / Views

> **Shared chrome on every page:**
> - **Top bar** — full-width, `background:#F3C44C` (brand yellow, fixed in both themes),
>   `padding:16px 40px`, flex space-between. Left: wordmark `COMEDY CELLAR` (Bebas Neue 31px,
>   letter-spacing .03em, `#1A1714`) with a mono tag `EST. NYC 1981` (JetBrains Mono 9px,
>   letter-spacing .22em, 60% opacity) baseline-aligned beside it (gap 11px).
>   Right: nav links (Archivo 15px; active = weight 700, inactive = weight 500 @ .78 opacity,
>   color `#1A1714`) + a pill button (Home/Comics/Updates/Profile, then "Sign In" / "Sign out").
>   The Sign-In pill: Archivo 700 14px, `color:#F3C44C` on `background:#1A1714`, `border-radius:999px`, padding 8px 16px.
> - **Perforation strip** — directly under the bar, a 14px-tall band: `background:#1A1714` with a
>   repeating dotted pattern `radial-gradient(circle at center, #F3C44C 2.2px, transparent 2.8px)`,
>   `background-size:20px 14px`. This is the signature "ticket edge" motif.
> - **Page body** — `background: var(--bg)`, `min-height:100vh`, centered content column
>   (max-width varies per page), `padding: ~34px 40px 60px`.
> - **Section eyebrow pattern** — most pages open with a mono uppercase eyebrow (JetBrains Mono
>   12px, letter-spacing .2em, color `#9A7B1E` gold) above a Bebas Neue H1 (~54–62px,
>   line-height .9, color `var(--text)`).

---

### 1. Home — `Comedy Cellar Home.dc.html`  (route: `/`)
**Purpose:** Browse tonight's shows and reserve.
**Layout:** Centered column, max-width 1180px. Eyebrow "Sunday · June 28, 2026" → H1
"Tonight at the Cellar" (Bebas 60px) → subline "12 shows across 3 rooms — **8 still available**"
(the count in `success` green, weight 700). Below: a **two-column grid `288px 1fr`, gap 32px**,
items start-aligned.
- **Left — Calendar panel (`<aside>`):** surface card, `border:1.5px solid var(--line)`,
  `border-radius:14px`, padding ~18px, `box-shadow:4px 5px 0 var(--shadow)`. Header row with two
  round 28px prev/next chips (1.5px border, circular) flanking "June 2026" (Bebas 23px). Then a
  7-column grid: weekday initials `S M T W T F S` (JetBrains Mono 11px, `var(--faint)`), then 6
  week rows of day cells (38px tall). **Today** (the 28th) gets a 32px yellow disc
  (`#F3C44C`, 1.5px border) behind the number; out-of-month days are faint.
- **Right — Shows list** with a header row: "Upcoming Shows" (Bebas 24px) and a **view toggle**
  (segmented pill, two buttons "Relaxed" / "Compact"; active button = `var(--solid)` bg +
  `var(--on-solid)` text, inactive = transparent + `var(--text)`).
  - **Relaxed rows** (default): horizontal ticket cards (surface, 1.5px border, radius 12px,
    `box-shadow:3px 4px 0`). Left **time stub** 112px wide, `border-right:2px dashed var(--line)`,
    background = brand yellow (or `#E9E3D6` stub-gray if sold out), showing time (Bebas 34px) +
    AM/PM (mono 11px). A rotated "SOLD" stamp (mono 9px, `danger` red, bordered, `rotate(-8deg)`)
    appears bottom of stub when sold out. Right side: title (Archivo 800 19px) + status pill
    (mono 10px uppercase; color/tint per status) + a **rotating chevron** (▾, 26px circle,
    `1.5px solid var(--line)`, `transform: rotate(180deg)` when open) + venue·capacity·**lineup**
    meta (mono 12px — third segment reads `"{n} comics"` or `"lineup TBA"`) + a
    **seat progress bar** (6px track `var(--track)`, fill colored per status, width = % full) +
    a "Reserve Tickets →" pill (`var(--solid)`/`var(--on-solid)`, hover flips to yellow/ink) or
    "Reservations closed" text.
  - **Compact rows:** same data as a dense grid `62px minmax(0,1fr) 104px 88px 108px 26px` (6th
    column added for the chevron), gap 16px, with a column header row (Show / Seats / Status).
    Smaller stub (radius 7px), truncated title, thin 5px progress bar, status pill, "Reserve →" /
    "Closed", trailing chevron.
  - **Lineup expand/collapse (both variants):** the row/card (excluding the Reserve pill, which
    stops click propagation) is the toggle target — the whole thing is clickable, not just the
    chevron. Expanding reveals the show's lineup **fused into the same card**
    (`border-top:2px dashed var(--line)` for Relaxed / `1.5px dashed` for Compact,
    `background:var(--bg)`, fade+slide-in `lineupIn` animation ~0.22s) — not a detached panel.
    Heading: `"Tonight's Lineup · {n} acts"`. Relaxed lists each act as a row (46px swatch avatar
    with initials, name, credits). Compact renders acts as wrapped **pill chips** (30px avatar +
    name only). Empty state (no lineup announced): a dashed-circle `?` glyph + "Lineup not
    announced yet" + "Acts are usually posted the morning of the show." Per-show open/closed
    state is independent (multiple shows can be expanded at once).
- **State:** `mode: 'relaxed' | 'compact'` (local); per-show `isOpen` (local, keyed by show
  index/timestamp) drives the lineup toggle. Show records are derived (see Data below).
- **Hover:** cards translate `(-1px,-1px)` and shadow grows to `5px 6px 0` (compact: `4px 5px 0`).
  The clickable row also gets a subtle background tint on hover (the mock's local `--hover` var
  isn't in `theme.css`'s token set — use the existing `hover:bg-track` utility instead).

### 2. Home Redesign — `Home Redesign.dc.html`  (canvas exploration — now normative for the
lineup interaction)
Two alternate Home treatments shown **side by side on a pannable canvas** (uses
`design_doc_mode=canvas`): "The Marquee — Roomy" and "The Marquee — Condensed". Same content as
Home; the Condensed variant fits the whole night on screen using the compact table layout and a
smaller hero. **Layout direction is reference-only** — ship the chosen direction (the live Home
above uses the Relaxed/Compact toggle, which subsumes both). **The click-to-expand lineup
behavior specified here (chevron, fused panel, heading, empty state, pill-chip vs list act
rendering — see section 1) is in scope and must be built on the live Home page for both view
modes.**

### 3. Comics — `Comics.dc.html`  (route: `/comics`)
**Purpose:** Browse/search the comic roster.
**Layout:** max-width 1180px. Eyebrow "The Lineup" → H1 "Meet the Comics" (Bebas 60px).
- **Toolbar card** (surface, 1.5px border, radius 14px, `box-shadow:4px 5px 0`): a pill
  **search input** (`⌕` glyph + text input "Search by comic name…") and a **heat legend** row:
  "Upcoming shows" label + four legend items, each a 3-bar "flame" meter + label
  (No shows / 1–4 / 5–8 / 9+ shows). Flame-on `#D8841E`, flame-off `#E6DECB`.
- **Grid:** `repeat(4, 1fr)`, gap 22px. Each card is a link to the comic page: a 170px
  **photo placeholder** header (rotating swatch background, large Bebas initials centered, tiny
  "PHOTO" tag bottom-right, `border-bottom:1.5px solid var(--line)`) over a body with name
  (Archivo 800 16px), a heat meter + "{n} upcoming" / "No shows" label, and a 3-line-clamped
  blurb (Archivo 13px, `var(--muted)`).
- **Empty state:** centered "No comics match "{query}"." when search yields nothing.
- **State:** `query` (search string). Filter is case-insensitive substring on name.
- **Hover:** card translate `(-1px,-1px)`, shadow `3px 4px 0` → `5px 6px 0`.

### 4. Comic detail — `Comic.dc.html`  (route: `/comics/:slug`)
**Purpose:** Single comedian profile + their upcoming shows.
**Layout:** max-width 1080px. "‹ All comics" back link (mono uppercase). One big profile card
(surface, 1.5px border, radius 16px, `box-shadow:5px 6px 0`):
- **Banner** 230px tall, dark diagonal-striped placeholder
  (`repeating-linear-gradient(135deg, #2A251F 0 14px, #211D18 14px 28px)`) labeled
  "CELLAR STAGE PHOTO".
- **Identity row** pulled up `margin-top:-66px`: 132px circular avatar (yellow, 3px border,
  block shadow) with Bebas initials, beside an eyebrow "Headliner" + H1 name (Bebas 56px). A
  "Website ↗" outline button sits at the right (hover fills yellow).
- **About** paragraph (Archivo 17px, line-height 1.65; `<em>` for titles).
- **Upcoming Shows** list: date stub (yellow, `border-right:2px dashed`, day Bebas 30px + month
  mono) + title + meta + "Reserve →" pill.
- **Data:** `shows: [{day, mon, title, meta}]` (static in prototype).

### 5. Reserve — `Reserve.dc.html`  (route: `/reserve` or `/reserve/:showId`)
**Purpose:** Reservation form for a chosen show.
**Layout:** max-width 1080px. "‹ Back to shows" link, eyebrow "You're almost in", H1 "Reserve
Your Seats" (Bebas 54px). One **ticket-shaped card**, grid `1.45fr 1fr`, surface, 1.5px border,
radius 16px, `box-shadow:5px 6px 0`, overflow hidden.
- **Left — form** (padding 30px 34px): section headers in Bebas 24px. Fields, all
  `border:1.5px solid var(--line)`, `border-radius:9px`, padding 12px 14px, Archivo 15px,
  `style-focus="box-shadow:3px 3px 0 #F3C44C"`:
  - Reservation Details: First Name + Last Name (2-col), Party Size (max 10).
  - Contact: Email, Confirm Email, Phone Number.
  - Misc: "How did you hear about us?" `<select>` (Other / Friend / Instagram / Walked by);
    a checkbox row "One-time SMS feedback" (20px square box, 1.5px border, radius 5px).
  - Full-width "Reserve My Seats →" submit (solid pill, padding 15px, Archivo 800 16px).
- **Right — ticket stub** (`background:var(--bg)`, `border-left:2px dashed var(--line)`, with two
  small notch circles punched at the top-left and bottom-left of the dashed seam). Shows: eyebrow
  "Your Show", show title (Bebas 30px), a DATE/ROOM/SEATS list (mono 12px, labels in gold), an
  **overlapping avatar stack** (six 30px circles, `margin-right:-7px`, 1.5px border, Bebas
  initials), a dashed divider, a **House Rules** list (4 items: title Archivo 800 13px + body
  12px), then a fine-print disclaimer + "Reserve on comedycellar.com ↗" link.
- **Data:** `avatars: [{i, bg, fg}]`, `rules: [{t, d}]`.

### 6. Sign In — `Sign In.dc.html`  (route: `/sign-in`)
**Purpose:** Authentication.
**Layout:** Vertically centered card, max-width 430px. Centered eyebrow "Members' Entrance",
H1 "Take Your Seat" (Bebas 46px), subline. Card (surface, 1.5px border, radius 16px,
`box-shadow:5px 6px 0`) contains: a "Continue with Google" button (full-width, 1.5px border,
radius 10px, a 22px circular "G" badge in solid/on-solid), an "or" divider (two 1.5px rules +
mono label), an Email field (radius 10px, `style-focus="box-shadow:3px 3px 0 #F3C44C"`), and a
full-width "Continue →" solid pill. Below the card: "New to the Cellar? **Create an account**"
(link underlined with a 2px yellow border-bottom) and a "Secured by Clerk" mono footnote.
Page uses `display:flex; flex-direction:column` so the card vertically centers between header
and bottom.

### 7. Profile / Account — `Profile.dc.html`  (route: `/account`)
**Purpose:** Manage notifications + view account. Note the nav here swaps in a "Profile" link
and the pill reads "Sign out".
**Layout:** max-width 820px. Eyebrow "Your Account", H1 "Backstage Pass" (Bebas 54px). A
**segmented tab pill** ("Settings" / "Profile"; active = solid bg + on-solid text).
- **Settings tab (default):**
  - *Global Notifications* card: header (Bebas 24px) + "System-wide setting" subnote, then a
    custom **checkbox row** ("New Show Alerts", 24px square box that fills yellow + shows a ✓ when
    on), and a right-aligned "Save" solid pill.
  - *Comic Notifications* card: intro text, then a list of tracked comics — each row has a 42px
    circular avatar (swatch bg + Bebas initials) + name, and a right-side **toggle pill** reading
    "Enabled" (green: text `#1E8E4E`, bg `#E6F1E9`, border `#1E8E4E`) or "Muted"
    (faint: text `#A99F8E`, bg `#F2ECDF`, border `#D9CFBB`). Clicking toggles it.
- **Profile tab:** account card — 76px avatar + "Comedy Fan" (Bebas 30px) + "Member since
  Oct 2024"; a detail list (Email, Comics tracked = count of enabled, Phone-free pledge =
  "Signed" green outline pill); a right-aligned "Edit Profile" outline button.
- **State:** `tab`, `showNotif` (bool), `comics: [{name, enabled}]`. `trackedCount` = enabled count.

### 8. Updates / Changelog — `Updates.dc.html`  (route: `/updates`)
**Purpose:** Product changelog.
**Layout:** max-width 760px. Eyebrow "Changelog", H1 "What's New" (Bebas 62px), subline. A
**vertical timeline**: a dashed left rail (`border-left:2px dashed var(--line)`), each entry a
14px dot (yellow if new, white otherwise, 1.5px border) beside a card (surface, 1.5px border,
radius 11px, `box-shadow:3px 4px 0`) with a date (mono 10px gold) + optional "New" badge
(yellow pill) + title (Archivo 800 18px) + body (Archivo 14px, `var(--muted)`).
- **Data:** `updates: [{date, title, body, isNew}]` (12 entries in prototype).

## Interactions & Behavior
- **Navigation:** header links route between pages; show "Reserve" CTAs → Reserve; comic cards →
  Comic detail; "‹ All comics" / "‹ Back to shows" → list pages.
- **Card hover (global):** `transform: translate(-1px,-1px)` + shadow deepens by ~2px on each
  axis. This applies to show cards, comic cards, comic-page show rows, and changelog cards.
- **Button hover:** solid buttons → `var(--solid-hover)`; secondary/outline + "Reserve"
  pills → fill brand yellow `#F3C44C` with ink text.
- **Input focus:** `box-shadow: 3px 3px 0 #F3C44C` (a hard yellow offset glow), some also
  switch background to surface.
- **Home view toggle:** switches between Relaxed cards and Compact table; no data change.
- **Comics search:** live, case-insensitive substring filter on comic name; empty state when no
  match. (In the prototype's intent the query is URL-persistable — see Updates changelog item
  "Persistent Comic Search" — recommend syncing search to a `?q=` query param.)
- **Profile toggles:** "New Show Alerts" checkbox and per-comic Enabled/Muted pills flip local
  state instantly; "Comics tracked" count reflects enabled comics.
- **Theme toggle:** flips `data-theme` on `<html>`, persisted to `localStorage["cc-theme"]`.

## State Management
- **Home:** `mode` ('relaxed' | 'compact').
- **Comics:** `query` (string) → derived `filtered`, `empty`. Recommend URL `?q=` sync.
- **Profile:** `tab` ('settings' | 'profile'), `showNotif` (bool), `comics` (array of
  `{name, enabled}`) → derived `trackedCount`.
- **Theme:** global `theme` ('light' | 'dark'), persisted.
- **Reserve / Sign In:** standard controlled form fields + validation (not implemented in mocks).
- **Data fetching (real app):** show listings w/ live seat counts (changelog says shows are
  polled every ~6h), comic roster + per-comic upcoming shows, auth/session, notification prefs.

## Design Tokens
All tokens are provided as a ready-to-use **Tailwind v4 theme: `theme.css`** (import it as your
stylesheet entry). Summary of the system:

**Theme-aware colors (flip with `data-theme="dark"`):**
| Token (utility) | Light | Dark | Use |
|---|---|---|---|
| `bg`        | `#FBF6EC` | `#16130E` | page background (warm cream) |
| `surface`   | `#FFFFFF` | `#221E17` | cards / panels / inputs |
| `text`      | `#1A1714` | `#F2ECE0` | primary text |
| `muted`     | `#857B6D` | `#A99F90` | secondary text |
| `faint`     | `#A99F8E` | `#7C7468` | tertiary / disabled |
| `line`      | `#1A1714` | `#3C352B` | borders & rules |
| `track`     | `#EDE7DA` | `#322C22` | progress tracks / dividers |
| shadow var  | `#1A1714` | `#070503` | offset block-shadow color |
| `solid`     | `#1A1714` | `#F3C44C` | primary button surface |
| `solid-hover` | `#2C2820` | `#E0B43F` | primary button hover |
| `solid-fg` (on-solid) | `#F3C44C` | `#1A1714` | text on solid button |
| `placeholder` | `#B7AE9F` | `#6E6658` | input placeholder |

**Fixed colors (constant in both themes):**
- `brand` `#F3C44C` (marquee yellow), `brand-hover` `#E0B43F`, `brand-fg` `#1A1714`
- `ink` `#1A1714`, `cream` `#FBF6EC`, `gold` `#9A7B1E` (eyebrows / meta on cream)
- Status — `success` `#1E8E4E` / `-soft` `#E6F1E9` / `-bright` `#5BD08A` (Available)
- Status — `warning` `#C0780F` / `-soft` `#F8EDD9` / `-bright` `#F0B23D` (Selling Fast)
- Status — `danger` `#C23B2E` / `-soft` `#F7E4E1` / `-bright` `#FF6B5B` (Sold Out)
- `stub` `#E9E3D6` / `stub-ink` `#A89F90` (sold-out ticket stub)
- Comic/avatar swatch rotation: `#F3C44C/#1A1714`, `#E7E0CF/#1A1714`, `#1A1714/#F3C44C`,
  `#E9C9A0/#1A1714`, `#D9CDB6/#1A1714`, `#2B2722/#FBF6EC` (bg/fg pairs)
- Comics heat flame: on `#D8841E`, off `#E6DECB`

**Typography:**
- `font-display` — **Bebas Neue** (marquee headings, ticket times, big numerals)
- `font-sans` — **Archivo** (body & buttons; weights 400/500/600/700/800/900)
- `font-mono` — **JetBrains Mono** (eyebrows, labels, meta; weights 400/500/700)
- Role-based size scale (utilities `text-*`): `eyebrow` 9px/.22em · `meta` 10px/.14em ·
  `label` 12px/.2em · `caption` 13px · `body` 15px · `lead` 19px · display `d-sm` 24px ·
  `d-md` 31px · `d-lg` 46px · `d-xl` 60px · `d-2xl` 64px (display sizes line-height .9–1).
  Other one-off sizes appear inline (e.g. 54/56/62px hero variants) — round to the display scale.
- Letter-spacing scale: `tightcap` .03em · `cap` .06em · `wide` .1em · `wider` .14em ·
  `widest` .2em · `mega` .22em. Uppercase mono labels always carry wide tracking.

**Borders / radius / shadow:**
- Signature border weight **1.5px** → utility `border-hair` (pair with `border-line`).
- Radii: `rounded-field` 9px (inputs) · `rounded-card` 12px · `rounded-panel` 14px ·
  `rounded-pill` 999px. (One-off 10px/11px/16px radii appear; map to nearest.)
- **Hard offset shadows** (no blur), `shadow-block-sm` `2px 3px 0` · `shadow-block` `3px 4px 0` ·
  `shadow-block-md` `4px 5px 0` · `shadow-block-lg` `5px 6px 0`, all in the theme shadow color.
  This blur-less offset is the core depth cue — do not substitute soft shadows.

**Spacing:** standard 4px-ish rhythm; page gutters `40px`, card padding `18–34px`, grid gaps
`22–32px`. No custom spacing scale — Tailwind defaults are fine.

**Recurring motifs to preserve:**
1. Yellow marquee header + dotted **perforation strip** under it.
2. **Ticket stubs** with `2px dashed` seams and punched notch circles.
3. **Block-print** hard offset shadows + 1.5px ink borders on every card.
4. Mono **eyebrow → Bebas headline** section openers.
5. Seat **progress bars** + status pills colored by availability.

## Assets
No external image assets — all imagery is **intentional placeholders** to be replaced with real
content:
- Comic card photos → large initials on a colored swatch (replace with comic headshots).
- Comic-detail banner → diagonal-striped "CELLAR STAGE PHOTO" block (replace with a stage photo).
- Avatars (Reserve stub, Profile, Comic) → initials on swatch backgrounds (replace with user/comic
  avatars).
- Icons used are plain glyphs/text (`⌕`, `‹` `›`, `→`, `↗`, `✓`, `☀`/`☾` for theme) — swap for
  your icon library.
- Fonts load from Google Fonts (Bebas Neue, Archivo, JetBrains Mono).

## Screenshots
Rendered reference images (light mode) live in `screenshots/`:
- `01-home.png` — Home (Relaxed view)
- `02-home-redesign-explorations.png` — the two alternate Home directions (canvas)
- `03-comics.png` — Comics roster + search
- `04-comic-detail.png` — Comic profile
- `05-reserve.png` — Reservation form + ticket stub
- `06-sign-in.png` — Sign In
- `07-profile.png` — Account / notification settings
- `08-updates.png` — Changelog timeline

## Files
```
design_handoff_comedy_cellar/
├── README.md                      ← this file
├── theme.css                      ← Tailwind v4 design tokens (import as stylesheet entry)
├── screenshots/                   ← rendered reference images of each screen
└── designs/                       ← HTML design references (specs, not production code)
    ├── Comedy Cellar Home.dc.html   Home — tonight's shows, calendar, Relaxed/Compact toggle
    ├── Home Redesign.dc.html        Two alternate Home directions (canvas exploration)
    ├── Comics.dc.html               Comic roster grid + search + heat legend
    ├── Comic.dc.html                Single comic profile + upcoming shows
    ├── Reserve.dc.html              Reservation form + ticket stub
    ├── Sign In.dc.html              Auth (Google + email)
    ├── Profile.dc.html              Account: notification settings + profile tabs
    ├── Updates.dc.html              Changelog timeline
    └── support.js                   In-house template runtime (reference only — DO NOT port)
```

### How to read a design file
1. The markup between `<x-dc>…</x-dc>` is the structure + inline styles. `var(--token)` values
   map to the tokens in `theme.css`.
2. `<sc-for list="{{items}}" as="item">` = a `.map()` loop; `<sc-if value="{{x}}">` = conditional
   render. `{{ path }}` are data bindings.
3. The `<script type="text/x-dc">` block (`class Component extends DCLogic { renderVals() {…} }`)
   is the data + handlers. `renderVals()`'s return object is the props/state consumed by the markup.
4. Reproduce that data shape and those handlers in your framework's idiom; ignore `support.js`
   and the injected theme-toggle `<script>`.
