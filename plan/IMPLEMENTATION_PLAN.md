# Parallel Re-skin Plan — Comedy Cellar "Vintage Marquee" Redesign

## Context
The design handoff in this `plan/` folder specifies a full visual redesign of the Comedy Cellar
frontend in a "vintage marquee / ticket-stub" aesthetic (cream paper, ink borders, marquee-yellow
accent, Bebas Neue display type, hard offset block-shadows, light+dark). The app
(`packages/frontend`, Preact + preact-iso + Tailwind v4 + Clerk + TanStack Query) **already has all
8 screens, the routes, the shared components, and live data wiring** to a fully-built backend. So
this is a **visual re-skin in place** — not a rebuild and not new backend work.

The goal of this plan is to let **many agents work in parallel without ever editing the same file**,
with an explicit foundation-first dependency and a final "connect the pieces" pass. The single rule
that makes that safe:

> **Ownership rule:** an agent may **edit only the files in its assigned set**; it may **import
> (read) any other file freely**. Imports never collide. Two agents never share an editable file.

Confirmed decisions: re-skin in place (keep routes + data wiring) · migrate to CSS-first
`theme.css` (port `padPlugin`/forms via `@plugin`/`@utility`) · ship light+dark+toggle now ·
maximize parallelism (split large screens into per-file sub-agents).

### Why the work partitions cleanly (from exploration)
- **Routes already match** the design: `/`, `/comics`, `/comics/:id`, `/reservations/:timestamp`,
  `/profile`, `/sign-in`, `/updates`. Defined in `packages/frontend/src/index.tsx:59-77`.
  Keep current route names (README's `/account`, `/reserve/:showId` are just suggestions).
- **Data is fully available** — `src/utils/api.ts` already exposes `fetchShows`, `fetchLineUp`,
  `fetchShowByTimestamp`, `fetchShowsNew`, `fetchComics`, `fetchComicById`, `createReservation`,
  `fetchSettings`, `updateSettings` against existing endpoints. **No API/backend changes.**
- **Collision surface = shared components only.** Component-usage grep gives a clean split:
  - Used by **2+ screens** → **foundation-owned**: `Button`, `Card`, `Input`, `Link`, `Spinner`,
    `PageLoader`, `Image`, `Checkbox`, `Header`.
  - **Single-consumer** → that screen's agent: `Calendar`/`CalendarButton`/`Event`/`EventLoader`/
    `Act`/`Availablity` → Home; `SearchInput` → Comics; `Disclaimer` → Reservations.

---

## Strategy: 3 phases with barriers

```
Phase 0  FOUNDATION   ── hard barrier ──▶  Phase 1  SCREENS  ── barrier ──▶  Phase 2  INTEGRATION
(tokens, theme, chrome,                    (8 screens, each split          (root wiring, footer,
 shared primitives)                         into per-file sub-agents)        dark-mode pass, build)
```

- **Phase 0 must merge before Phase 1 starts** — every file uses the token utilities + primitives.
- **Within each phase, every listed file = one independent agent** (subject to the sub-barrier in 0A).
- **The contract de-couples agents:** Phase 0 publishes `src/components/ui/CONTRACT.md` (import
  paths + prop signatures + token cheat-sheet). Screen agents code against the contract, so an
  assembler can be written against a primitive's prop shape before that primitive is pixel-final.

### Cross-phase collision guards (apply to ALL screen agents)
- **Do NOT edit** `src/index.tsx`, `src/style.css`, `src/theme.css`, `index.html`,
  `src/utils/api.ts`, `src/utils/clerk.ts`, or `src/types.ts`. These are foundation/integration-owned.
- **Screen-local types** go in `src/pages/<Screen>/types.ts`, never in global `src/types.ts`.
- **Need a new shared primitive mid-flight?** Don't create it in a screen folder — flag it for
  Phase 2 / foundation. Screen folders only hold screen-specific code.

---

## Phase 0 — FOUNDATION (blocking)

### 0A — Build system & tokens  ⚠️ FIRST, sub-barrier before all other 0/1 work (1 agent)
Everything imports these utilities, so this lands before 0B–0D.
- **NEW** `src/theme.css` — copy handoff `plan/theme.css` verbatim (Tailwind v4 `@theme inline`
  tokens, `@custom-variant dark`, `border-hair` utility, light/dark `:root` vars).
- **Rewrite** `src/style.css` → `@import "./theme.css";` then port the two existing extras:
  `@plugin "@tailwindcss/forms";` and re-express `padPlugin`'s `pad-x`/`pad-y` as `@utility`
  blocks (or migrate the ~2 usages). Keep the v4 border-compat `@layer base`. Add
  `body { background: var(--bg); color: var(--text); }`.
- **Edit** `index.html` — add Google Fonts (`Bebas Neue`, `Archivo` 400–900, `JetBrains Mono`
  400/500/700); set default `data-theme` on `<html>`; drop the hardcoded `bg-gray-50` body class.
- **Edit** `tailwind.config.js` — remove the now-duplicated `theme.extend.colors.primary` and the
  `@config` pointer in `style.css`; keep only what CSS-first can't express (likely nothing →
  reduce to `content` or delete and rely on v4 auto-detection).
- **Publish** `src/components/ui/CONTRACT.md` — the primitive import paths + prop signatures +
  a token utility cheat-sheet (`bg-bg`, `bg-surface`, `text-text/muted/faint`, `border-line` +
  `border-hair`, `shadow-block{,-sm,-md,-lg}`, `font-display/sans/mono`, `text-d-xl/d-lg/eyebrow/
  label`, status colors, `rounded-{field,card,panel,pill}`).

### 0B — Theme runtime (parallel after 0A; 2 files)
- **NEW** `src/hooks/useTheme.ts` — read/write `localStorage["cc-theme"]` (`"dark"`/`"light"`),
  apply `data-theme` to `<html>`, expose `{theme, toggle}`.
- **NEW** `src/components/ThemeToggle.tsx` — round toggle button (☀/☾ glyphs), brand styling.

### 0C — Shared chrome (parallel after 0A; 2 files)
- **Rewrite** `src/components/Header.tsx` — full-width `bg-brand` marquee bar: wordmark
  `COMEDY CELLAR` (Bebas) + `EST. NYC 1981` mono tag; nav links (active=700, inactive=500/.78);
  Sign In **pill** (`text-brand` on `bg-ink`, `rounded-pill`). **Keep the existing Clerk
  `useEffect`/`clerk.load()` auth-link logic** (`Header.tsx:18-29`).
- **NEW** `src/components/Perforation.tsx` — 14px dotted ticket-edge strip (the
  `radial-gradient` motif). Rendered directly under the bar (Header renders it).

### 0D — Shared primitives (parallel after 0A; each file = 1 agent)
**Restyle existing shared components in place** (stable prop APIs — additive only):
- `src/components/Button.tsx` — solid / outline / "reserve" variants; `rounded-pill`; hover fills
  yellow with ink text; keep `size` prop.
- `src/components/Card.tsx` — `bg-surface border-hair border-line rounded-panel shadow-block-md`.
- `src/components/Input.tsx` — `border-hair rounded-field`, focus `box-shadow:3px 3px 0 #F3C44C`.
- `src/components/Link.tsx` — add yellow 2px underline variant.
- `src/components/Checkbox.tsx` — 24px square that fills yellow + shows ✓ (used by Profile & Reserve).
- `src/components/Spinner.tsx`, `src/components/PageLoader.tsx`, `src/components/Image.tsx` — minor
  token recolor (ink/cream); Image likely unchanged.

**NEW UI kit** in `src/components/ui/` (one file per primitive → one agent each):
- `Eyebrow.tsx` (mono uppercase gold) · `PageHeader.tsx` (eyebrow + Bebas H1 + subline) ·
  `Pill.tsx` · `StatusPill.tsx` (Available/Selling Fast/Sold Out) · `ProgressBar.tsx` (seat bar,
  color per status) · `SegmentedToggle.tsx` (Relaxed/Compact + Profile tabs) · `Avatar.tsx`
  (initials on swatch) · `FlameMeter.tsx` (comics heat) · `TicketStub.tsx` (dashed seam + notch
  circles) · `TicketCard.tsx` (base surface card).
- **NEW** `src/utils/swatches.ts` — the 6-pair avatar swatch rotation from the README.

---

## Phase 1 — SCREENS (all parallel after the Phase 0 barrier)
Per screen: **one assembler agent owns `index.tsx`**; each sibling sub-component file is its own
agent. Assembler codes against sub-component prop contracts (named in the plan). Every file below
is a distinct, non-overlapping owner.

### Home — `src/pages/Home/` (+ its single-consumer components) — ~7 agents
- `src/components/Calendar.tsx` — surface panel, prev/next 28px chips, 7-col grid, weekday initials.
- `src/components/CalendarButton.tsx` — day cell; today = 32px yellow disc; out-of-month faint.
- `src/components/Event.tsx` — **Relaxed** ticket card: 112px time stub (`border-right:2px dashed`,
  yellow or stub-gray), rotated SOLD stamp, title, `StatusPill`, venue·cap meta, `ProgressBar`,
  Reserve pill → `/reservations/:timestamp`.
- **NEW** `src/pages/Home/CompactRow.tsx` — compact dense-grid row variant.
- `src/components/EventLoader.tsx` — skeleton in new style.
- `src/components/Act.tsx` + `src/components/Availablity.tsx` — lineup act + status (one agent).
- `src/pages/Home/index.tsx` (assembler) — `PageHeader`, 2-col grid `288px 1fr`, Relaxed/Compact
  `SegmentedToggle` (local `mode`), keep `fetchShows`/`fetchLineUp`; derive view-model
  (pct, status, colors). Move shared `src/utils/deriveShowDetails.ts` work here if Home-only.

### Comics — `src/pages/Comics/` (+ SearchInput) — ~4 agents
- `src/components/SearchInput.tsx` — pill `⌕` search input (keep debounce).
- `src/pages/Comics/ComicItem.tsx` — card: 170px swatch photo placeholder + Bebas initials +
  "PHOTO" tag, name, `FlameMeter` + count, 3-line-clamp blurb. Link → `/comics/:id`.
- `src/pages/Comics/ShowCount.tsx` — heat legend row (4 flame tiers).
- `src/pages/Comics/index.tsx` (assembler) — `PageHeader`, toolbar card, `grid repeat(4,1fr)`,
  live search, empty state, keep infinite scroll (`useObserver`); add `?q=` URL sync.

### Comic detail — `src/pages/Comic/` — ~4 agents
- `src/pages/Comic/ComicBannerImage.tsx` — diagonal-striped "CELLAR STAGE PHOTO" banner placeholder.
- `src/pages/Comic/UpcomingShows.tsx` — date-stub rows (day Bebas + month mono) + meta + Reserve pill.
- `src/pages/Comic/ComicNotification.tsx` — Website ↗ / notify button restyle (keep auth gating).
- `src/pages/Comic/index.tsx` (assembler) — profile `TicketCard`, banner, identity row pulled up
  `-66px` (132px `Avatar`), about paragraph; keep `fetchComicById`.

### Reservations — `src/pages/Reservations/` (+ Disclaimer) — ~5 agents
- `src/pages/Reservations/Helpers.tsx` — `Field`/`Section` form primitives (`border-hair`,
  `rounded-field`, focus glow).
- `src/pages/Reservations/ShowDetails.tsx` — right **ticket stub** (`TicketStub`): eyebrow, title,
  DATE/ROOM/SEATS list, overlapping `Avatar` stack, House Rules, disclaimer + reserve link.
- `src/components/Disclaimer.tsx` — House Rules content styling.
- `src/pages/Reservations/{FormError,FormSuccess,PageError,NetworkError}.tsx` — restyle (one agent).
- `src/pages/Reservations/index.tsx` (assembler) — ticket-shaped card `grid 1.45fr 1fr` with notch
  circles; left form sections; solid submit pill; keep `createReservation` wiring.

### Profile — `src/pages/Profile/` — ~3 agents
- `src/pages/Profile/profileTabs.tsx` — `SegmentedToggle` (Settings / Profile).
- `src/pages/Profile/profileSettings.tsx` — Global Notifications card (custom `Checkbox` + Save)
  + Comic Notifications list (`Avatar` + Enabled/Muted toggle pills); keep `fetchSettings`/
  `updateSettings`.
- `src/pages/Profile/index.tsx` (assembler) — `PageHeader`, tabs, `useAuth`. **Note:** the Profile
  tab currently mounts Clerk's `mountUserProfile`; keep that mount but restyle the surrounding
  card/eyebrow (don't rebuild account management as a static card).

### Auth — `src/pages/Auth/` — ~2 agents
- `src/pages/Auth/PageWrapper.tsx` — centered card wrapper (eyebrow + Bebas H1 + subline + "Secured
  by Clerk" footnote).
- `src/pages/Auth/{SignIn,SignUp,SignOut}.tsx` — keep Clerk widget mounts; theme Clerk `appearance`
  to match + style the wrapper. (Design's custom Google/email form → realized via Clerk's themed
  widget, not a hand-rolled form.)

### Updates — `src/pages/Updates/index.tsx` — 1 agent
- Vertical timeline: dashed left rail, dots (yellow if `isNew`), cards. Keep `Updates/data.ts`.

### Misc — `src/pages/Terms/index.tsx`, `src/pages/NotFound/index.tsx` — 1 agent
- Minor reskin: `PageHeader` + surface card.

### Skipped
- **`Home Redesign.dc.html`** — exploration canvas, not a route. The Relaxed/Compact toggle on Home
  already subsumes both directions. Do not build.

---

## Phase 2 — INTEGRATION ("connect the pieces", sequential after Phase 1)
Single owner; touches the global wiring that screens were forbidden from editing.
- **`src/index.tsx`** — mount `useTheme`/ThemeProvider at root; render `<ThemeToggle/>`; set the
  page body wrapper to `bg-bg min-h-screen` with design gutters (`~34px 40px 60px`); restyle the
  footer + `BuyMeCoffee` link; confirm the route table (no new routes needed). Ensure `<Perforation/>`
  sits under `<Header/>`.
- **Cross-screen nav check** — Reserve CTAs → `/reservations/:timestamp`; comic cards → `/comics/:id`;
  "‹ All comics" / "‹ Back to shows" back links resolve.
- **Dark-mode pass** — toggle every screen, verify token flip + contrast; fix any hardcoded colors
  that slipped past the token utilities.
- **Cleanup** — remove dead styles / the old `tailwind.config.js` theme if fully migrated; reconcile
  any prop-API drift from restyled primitives.
- **Build & lint gate** — see Verification.

---

## Parallelization summary (agent waves)
1. **Wave 0A** (1 agent): tokens + build + publish CONTRACT.md. *Barrier.*
2. **Wave 0B–0D** (~18 agents): theme runtime, chrome, all shared primitives. *Barrier.*
3. **Wave 1** (~27 agents): all screen assemblers + sub-components, fully parallel. *Barrier.*
4. **Wave 2** (1 agent, sequential steps): integration + dark-mode + build/lint.

No two agents in the same wave share an editable file. Assemblers depend only on **contracts**, not
on the other agents finishing pixel work.

---

## Verification
- **Typecheck/build:** `cd packages/frontend && pnpm install && pnpm build` (Vite + tsc) — must pass
  after each wave; the build gate at the end of Phase 2 is authoritative.
- **Lint:** `pnpm exec eslint src` (config `eslint-config-preact`).
- **Run locally:** `pnpm dev` (`sst dev vite`); `.env.local` provides `VITE_API_URL` +
  `VITE_CLERK_PUBLISHABLE_KEY` so live data + auth render.
- **Visual fidelity:** compare each route against `plan/screenshots/*.png` (01-home … 08-updates).
- **Dark mode:** toggle bottom-right control; confirm `data-theme="dark"` flips every token and
  persists across reload (`localStorage["cc-theme"]`).
- **Smoke flows:** Home → Reserve CTA → form; Comics search + `?q=` → Comic detail; Profile
  notification toggles persist via `updateSettings`.

## Open notes / divergences to honor during re-skin
- **Auth & Profile account** stay on **Clerk's mounted widgets** (themed via `appearance`), not the
  hand-rolled Google/email form or static account card shown in the mocks. Restyle the chrome around
  them; don't replace Clerk.
- **Route names kept** as the app's current ones (`/profile`, `/reservations/:timestamp`); README's
  `/account` and `/reserve/:showId` are non-binding suggestions.
- **No backend work** — all data/endpoints already exist.
