---
name: cellar-frontend-design-system
description: The "vintage marquee" design system and frontend conventions for packages/frontend - token architecture in src/theme.css, the CONTRACT.md rules (tokens-never-raw-hex, ownership, additive props), Tailwind v4 CSS-first quirks, Preact-not-React compat wiring, the ui/ component kit, and the dark/light theme runtime. Use when styling or adding any frontend screen/component, when colors don't flip in dark mode, when a Tailwind utility mysteriously doesn't exist, when touching theme.css/style.css/CONTRACT.md/authAppearance.ts, or when a react library misbehaves under preact/compat.
---

# Cellar Frontend Design System — "Vintage Marquee"

The frontend (`packages/frontend`) is a Preact + Vite + Tailwind CSS v4 single-page app
styled as a "vintage marquee / ticket-stub": warm cream paper, heavy ink lines, one
marquee-yellow accent, Bebas Neue display type, hard blur-less "block-print" shadows,
full light + dark mode. This skill is the map to that system and its sharp edges.

**When NOT to use this skill:** build/install problems → `cellar-build-and-env`;
what `sst dev` / deploys actually do → `cellar-run-and-operate`; frontend env vars
(`VITE_*` chain, sst-env.d.ts) → `cellar-config-and-secrets`; diagnosing live
misbehavior (infinite loading, blank pages) → `cellar-debugging-playbook`; whether a
change may ship and which gates apply → `cellar-change-control`.

## 1. Authority chain (who rules on what)

| Rank | Document | Role |
|---|---|---|
| 1 | `packages/frontend/src/components/ui/CONTRACT.md` | **The law.** Frozen UI contract published by "Wave 0A" of the July-2026 redesign. Token cheat-sheet, prop signatures, ownership rule. Where this skill and CONTRACT.md disagree, CONTRACT.md wins. |
| 2 | `plan/README.md`, `plan/theme.css`, `plan/designs/*.dc.html`, `plan/IMPLEMENTATION_PLAN.md` | Historical design handoff + multi-agent re-skin plan (checked into main as scaffolding). Consult for pixel intent and rationale; NOT live config. |
| 3 | This skill | Summary + gotchas. Cites, never overrides. |

CONTRACT.md's three core rules, quoted:

1. **Tokens, never raw hex** — "Dark mode: `<html data-theme="dark">` flips the
   theme-aware tokens. Use tokens, never raw hex or stock Tailwind grays — hardcoded
   colors won't flip in dark mode." (CONTRACT.md:17-18)
2. **Ownership rule** — "edit only your assigned files; import (read) anything freely.
   Do **not** edit `src/index.tsx`, `src/style.css`, `src/theme.css`, `index.html`,
   `src/utils/api.ts`, `src/utils/clerk.ts`, `src/types.ts`. Screen-local types →
   `src/pages/<Screen>/types.ts`. Need a new shared primitive? Flag for Phase 2, don't
   create it in a screen folder." (CONTRACT.md:7-11)
3. **Additive props** — "Import paths + prop signatures + token utilities below are
   stable; restyle changes are internal-only and **additive** to props." (CONTRACT.md:4-5)

The ownership rule was written to let parallel AI agents re-skin without merge
collisions (`plan/IMPLEMENTATION_PLAN.md`, "The single rule that makes that safe").
Post-redesign it survives as change discipline: those seven files are the shared
foundation; treat edits to them as foundation changes needing extra review.

Sanctioned exceptions to rule 1, already in tree: `Perforation.tsx:7-9` hardcodes
brand `#F3C44C` / ink `#1A1714` because those are theme-CONSTANT by design (comment
in file says so); `Input.tsx:14` uses `focus:shadow-[3px_3px_0_#F3C44C]` (brand focus
ring); `FlameMeter.tsx:8-9` uses `#D8841E`/`#E6DECB`; `utils/swatches.ts:10-17` is a
deliberate theme-constant palette; `authAppearance.ts:20` `colorRing: "#F3C44C"`.
Pattern: hardcoding is legal ONLY for theme-constant brand/ink/cream values, ideally
with a comment saying why.

## 2. Token architecture (`src/theme.css`) — two layers

**Layer 1 — runtime CSS variables.** Plain vars on `:root` (light values,
theme.css:30-44) overridden by `html[data-theme="dark"]` (theme.css:46-60). These are
"the ONLY things that flip between light & dark" (theme.css:27). Flipping happens by
CSS cascade at runtime — no rebuild, no class swap on every node.

**Layer 2 — Tailwind namespace mapping.** `@theme inline { --color-bg: var(--bg); … }`
(theme.css:66+) maps the runtime vars into Tailwind v4 token namespaces, which is what
generates utilities like `bg-bg`. The `inline` keyword is load-bearing: it keeps the
`var()` reference live in emitted CSS instead of baking in the light value at build
time (theme.css:62-65). Remove `inline` and dark mode silently dies.

### Token inventory (as of 2026-07-07; utilities in CONTRACT.md's cheat-sheet)

| Group | Tokens | Theme-aware? |
|---|---|---|
| Surfaces | `bg` (cream `#FBF6EC` → near-black `#16130E`), `surface`, `track`, `stub`/`stub-ink` | bg/surface/track flip; stub pair constant |
| Text | `text` (`#1A1714` → `#F2ECE0`), `muted`, `faint`, `placeholder` | flips |
| Lines/shadow | `line`, `shadow` (block-shadow color) | flips |
| Primary button | `solid` / `solid-hover` / `solid-fg` — in dark mode `--solid` becomes brand yellow (`theme.css:55` "the primary surface IS the brand") | flips |
| Brand | `brand` `#F3C44C` / `brand-hover` / `brand-fg`; literals `ink` `#1A1714`, `cream` `#FBF6EC`, `gold` `#9A7B1E` | constant |
| Status triads | `success` / `warning` / `danger`, each with `-soft` (tint bg) and `-bright` (dark-mode variant), theme.css:90-99 | constant values; use `-bright` via `dark:` where needed (e.g. Badge.tsx:20) |
| Fonts | `font-display` Bebas Neue, `font-sans` Archivo, `font-mono` JetBrains Mono (theme.css:106-108; loaded from Google Fonts in index.html:12-16) | n/a |
| Type roles | `text-eyebrow` 9px → `text-d-2xl` 64px, with baked-in line-height/letter-spacing per role (theme.css:111-129) | n/a |
| Tracking | `tracking-tightcap` 0.03em → `tracking-mega` 0.22em | n/a |
| Radii | `rounded-field` 9px (inputs) / `rounded-card` 12px / `rounded-panel` 14px / `rounded-pill` 999px (theme.css:140-143) | n/a |
| Shadows | `shadow-block-sm|block|block-md|block-lg` — hard offsets like `3px 4px 0 var(--shadow)`, zero blur (theme.css:146-149) | color flips via `--shadow` |
| Animation | `animate-lineup-in` (theme.css:152-163) | n/a |

One-off hook: `[data-theme="dark"] .calendar-dark-shadow { --shadow: #F3C44C }`
(theme.css:175-177) gives the Calendar a yellow shadow in dark mode only — an example
of overriding a layer-1 var locally instead of adding a new token.

## 3. Tailwind v4 quirks encoded in this repo

Tailwind v4 is "CSS-first": configuration lives in CSS, not JS.

- **There is NO `tailwind.config.js`** and there must not be one.
  `postcss.config.js` is just `{ plugins: { '@tailwindcss/postcss': {} } }`.
- **Import order**: `src/style.css` is the entry — `@import 'tailwindcss'` then
  `@import './theme.css'` (style.css:1-5). `src/theme.css` deliberately does NOT
  re-import tailwindcss ("that would double preflight", theme.css:16-21). Beware:
  the handoff copy `plan/theme.css` DOES `@import "tailwindcss"` because it was
  designed as a standalone entry — do not copy that line back into src.
- **Dark variant is attribute-driven**:
  `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));`
  (theme.css:24). `dark:` utilities key off `data-theme="dark"`, not
  `prefers-color-scheme` and not a `.dark` class.
- **`@utility border-hair { border-width: 1.5px }`** (theme.css:170-172) exists
  because v4 has no border-width theme namespace. It sets only the WIDTH — always
  pair with a color, canonically `border-hair border-line` (CONTRACT.md:37).
- **v3 border-color compat shim** in style.css:17-25: v4 changed the default border
  color to `currentcolor`; the `@layer base` block restores v3's gray default.
  Removing it subtly recolors every un-colored border in the app.
- **Arbitrary values referencing vars** are the escape hatch in use:
  `shadow-[3px_3px_0_var(--shadow)]`, `focus:shadow-[3px_3px_0_#F3C44C]` (Input.tsx:14).

## 4. Preact, not React

The app runs Preact 10 (`preact` ^10.28.2, resolved 10.29.3 as of 2026-07-07) but
consumes React-ecosystem libraries — `@tanstack/react-query`, `@heroicons/react` —
through `preact/compat`, Preact's React-API shim. Auth uses **headless
`@clerk/clerk-js`** (no React bindings; lazy singleton in `src/utils/clerk.ts`).

Compat aliasing is DUAL and both halves must stay in sync:

| Layer | Mechanism | File |
|---|---|---|
| Bundling (runtime) | `@preact/preset-vite` plugin aliases react → preact/compat | `vite.config.ts:8` |
| Typechecking | `paths: { "react": ["./node_modules/preact/compat/"], "react-dom": [...] }` + `jsxImportSource: "preact"` | `tsconfig.json:11-19` |

Routing and code-splitting are `preact-iso` (`LocationProvider`, `Router`, `lazy` —
every page is lazy-loaded, src/index.tsx:30-41). The frontend lockfile shows a
phantom `react@19.2.7` peer resolution (packages/frontend/pnpm-lock.yaml) — that is
lockfile bookkeeping, not a bundled React.

**Risk note:** any new react library that touches React internals (reconciler
internals, `react-dom` portals/flushSync edge cases, React 18+ concurrent APIs) may
break under compat. Prefer preact-native or framework-agnostic libs; if you must add
a react lib, smoke-test it in the running app (not just `tsc`) before relying on it.

## 5. Component inventory (as of 2026-07-07)

Prop signatures are frozen by CONTRACT.md — defer to it; this is the map.

**Shared primitives — `src/components/`** (restyled in place, APIs stable):
`Button` (variant `solid|outline|reserve`, size `xs..xl`, Button.tsx:7), `Card`
compound (`Card/CardHeader/CardBody/CardFooter`; filters children by component type,
Card.tsx:17-29 — wrapping children in fragments breaks it), `Input`, `Link` (variant
`default|underline|plain`, Link.tsx:9), `Checkbox`, `Spinner` (see gotcha §8),
`PageLoader`, `EventLoader`, `Image.tsx` whose export is named **`Img`** (strips the
`-70x70` thumbnail suffix from comic photo URLs via `utils/helpers.ts`), `Redirect`,
`Header` (brand-yellow marquee bar + Clerk-aware nav suffix), `Perforation`
(ticket-edge dotted band under the header), `Calendar`/`CalendarButton`, `Event`
(relaxed show card: yellow time stub, dashed seam, rotated SOLD stamp Event.tsx:70-71),
`SearchInput` (400ms debounce, ≥2-char gate), `ThemeToggle`, `Act`, `Disclaimer`,
`BuyMeCoffee`.

**UI kit — `src/components/ui/`** (one file per primitive, born in the redesign):

| Component | Contract |
|---|---|
| `Badge` | **THE base chip.** Mono uppercase pill, `tone: neutral|success|warning|danger|muted`, optional heroicon, `whitespace-nowrap` (Badge.tsx:41-53). Every chip in the app should be a Badge, not a hand-rolled span (Badge.tsx:35-40 docstring). |
| `StatusPill` | Thin domain wrapper over Badge. `status: available|selling-fast|sold-out|ended` → label/tone/icon table (StatusPill.tsx:25-33). `withIcon` / `iconOnly` (iconOnly keeps an `sr-only` label). Note: `ended` was added after CONTRACT.md froze the original three — additive, allowed. |
| `ProgressBar` | `pct` 0-100 + `status`, `role="progressbar"` with aria values (ProgressBar.tsx:31). |
| `SegmentedToggle` | Generic `<T extends string>` options/value/onChange (SegmentedToggle.tsx:15). Used for Home relaxed/compact view (persisted `localStorage["cc-view-mode"]`, pages/Home/index.tsx:23) and Profile tabs. |
| `Avatar` | Photo if `img`, else initials on a deterministic color swatch: `utils/swatches.ts` has 6 theme-constant bg/fg pairs; `getSwatch(name)` = charcode sum mod 6; font size = 0.4 × size (Avatar.tsx:43). |
| `Eyebrow`, `PageHeader`, `Pill`, `FlameMeter`, `TicketStub`, `TicketCard` | See CONTRACT.md:88-98 for signatures. FlameMeter renders comic "heat"; TicketStub is the dashed-seam + notch motif; TicketCard the base surface card. |

Show availability logic lives in ONE place: `getShowView()` in
`src/pages/Home/types.ts:39` (sold-out / ended / selling-fast when occupancy >
`WARNING_OCCUPANCY_RATE` = 0.8 from `utils/constants.ts:1` / available). Do not
re-derive status in components — consume `ShowView`.

## 6. Theme runtime

- `src/hooks/useTheme.ts`: `theme: "light"|"dark"`, persisted in
  `localStorage["cc-theme"]` (useTheme.ts:5). Initial value: localStorage → existing
  `document.documentElement.dataset.theme` → `"light"` (useTheme.ts:7-23).
  `toggle()` sets `data-theme` on `<html>` AND writes localStorage (useTheme.ts:37-50).
- `<ThemeToggle />` is a fixed bottom-right sun/moon button mounted once at app root
  (src/index.tsx:97).
- `index.html:2` hardcodes `<html lang="en" data-theme="light">`. There is **no
  `prefers-color-scheme` detection anywhere** (the `color-scheme` meta is commented
  out, index.html:8) — dark mode is strictly opt-in via the toggle, and dark-mode
  users can see a light flash before their stored choice applies. This is a known
  open item, not a bug to hotfix casually; changing boot behavior touches
  foundation-owned `index.html` (§1 rule 2).
- **Clerk widget theming** (sign-in/up/profile are Clerk-rendered DOM, not ours):
  `src/pages/Auth/authAppearance.ts` themes Clerk via its appearance API using the
  layer-1 runtime vars (`colorPrimary: "var(--solid)"` etc.) so Clerk flips with the
  theme; card chrome is stripped with `!` (important) Tailwind classes
  (authAppearance.ts:25-27). What the appearance API can't reach is patched in
  `src/pages/Auth/Auth.css`: three `[data-theme="dark"] .cl-*` selectors with
  `!important`. **This is fragile by construction** — `.cl-*` class names are Clerk
  internals and can change on any `@clerk/clerk-js` upgrade (commit 6192496 already
  replaced an earlier, more fragile `.cl-internal-*` override). After any Clerk bump,
  eyeball /sign-in and /sign-up in BOTH themes.

## 7. Checklist: adding a screen or component correctly

1. Read `src/components/ui/CONTRACT.md` first. If a primitive you need exists,
   import it; do NOT create a lookalike in your screen folder (§1 rule 2).
2. New shared primitive genuinely needed → create it in `src/components/ui/` as its
   own file AND add its signature to CONTRACT.md in the same change.
3. Colors: token utilities only (`bg-surface`, `text-muted`, `border-line`,
   status tokens). Raw hex only for theme-constant brand/ink/cream with a comment (§1).
4. Borders: `border-hair border-line` (width + color, always together).
5. Chips → `Badge`; availability chips → `StatusPill`; status coloring from
   `getShowView()`, never recomputed.
6. Screen-local types go in `src/pages/<Screen>/types.ts`.
7. New route: pages are foundation-wired in `src/index.tsx` via `preact-iso` `lazy()`
   (index.tsx:30-41) — adding a route means editing a foundation-owned file; flag it
   as such in review.
8. Test BOTH themes (toggle bottom-right) and mobile width (~375px). Mobile overflow
   is this repo's most recurring frontend bug class (§8).
9. Equal-height card grids: the established pattern is `h-full flex flex-col` on the
   card inside a `list-none h-full` item (ComicItem.tsx:11-14) — reuse it.
10. Run the verification trio (§9), then route the change through
    `cellar-change-control` gates (frontend class) before any deploy.

## 8. Known gotchas

| Gotcha | Detail | Evidence |
|---|---|---|
| Spinner dynamic classes | `Spinner` builds `h-${size} w-${size}` at runtime (Spinner.tsx:9). Tailwind v4 statically scans source for class strings — dynamically composed names are only generated if the same literal appears elsewhere. Sizes that happen to work do so by luck. If a Spinner renders unsized, this is why. Fix pattern when touching it: inline `style={{width,height}}` (like Avatar) or a fixed class map. | Spinner.tsx:8-12 |
| `/gallery` ships to prod | The kitchen-sink page rendering every primitive in both themes is a routable prod route (index.tsx:71) despite its "not a production route" docstring (pages/Gallery/index.tsx:26-32). USE it: it is the fastest visual regression check for primitives. Removing it from prod routing is an open candidate, not done. | index.tsx:71 |
| Vendored `vitePluginEjs` | `packages/frontend/vitePluginEjs.ts` is a vendored copy of vite-plugin-ejs (not an npm dep). Its ONLY job: render index.html with `isDev` so the Google Analytics gtag snippet is wrapped in `<% if(!isDev){ %>` and ships in prod builds only (index.html:18-28). Delete/break it and index.html's EJS tags render literally. | vitePluginEjs.ts:37-61 |
| Mobile overflow recurrences | Same bug class fixed at least 6 times across project life: b697c94 (2024-10-11 header), 7ea6a4b (footer), 9ce39a1 (spacing), 2fd6b30 (2026-07-02, PR #60 show cards/auth), 6192496 (badge wrapping — hence Badge's `whitespace-nowrap`), c8d9918 (2026-07-03 comic identity row pulled −66px over banner). Every layout change: check ~375px width for horizontal scroll. | `git show <sha>` |
| Compound Card filtering | `Card` filters children by `child.type === CardHeader` etc. (Card.tsx:17-29); children wrapped in fragments or conditionals that change type are silently dropped. | Card.tsx:17-29 |
| Image export name | `src/components/Image.tsx` exports `Img`, not `Image` (CONTRACT.md:74-76 freezes this). | Image.tsx |
| Post-freeze contract drift | Implementations have grown additive props beyond CONTRACT.md's frozen signatures (Badge `tone/icon` absent from contract; StatusPill `ended|withIcon|iconOnly`; Avatar `img`; SegmentedToggle generic param). Additive = legal, but CONTRACT.md hasn't been updated since Wave 0A — when in doubt, source code is current truth for props, CONTRACT.md for rules. | Badge.tsx:26-33 vs CONTRACT.md:87-98 |
| Redesign polish tail | The big-bang reskin (75029b8, PR #59) needed 4 fix rounds within ~24h (PRs #60, #61, 6192496, c8d9918) — mobile + auth edges. Lesson: big visual changes demand the §9 visual pass, not just CI. | git log |

## 9. Verification (what "done" means for frontend changes)

All three CI gates, run exactly as CI does (from `packages/frontend`, its own pnpm
workspace root — see `cellar-build-and-env` for the two-workspace trap):

```bash
cd /home/user/comedy-cellar-bot/packages/frontend
pnpm install --frozen-lockfile   # only if deps changed / fresh clone
pnpm exec eslint src             # expect: no output, exit 0
pnpm exec tsc --noEmit           # clean-tree exit 0; CI-faithful for @clerk/types since #63 — see caveat
pnpm build                       # vite build; succeeds ~10s; a >500kB clerk-js
                                 # chunk warning is expected and pre-existing
```

(Commands mirror `.github/workflows/frontend-ci.yml:45-54`. **CI history (as of 2026-07-13):**
CI was RED on every run until PR #63 (commit `1fea669`, merged 2026-07-12) declared
`@clerk/types`; the frontend-ci.yml run is now GREEN — the first-ever passing run. The old
failure was `TS2307: Cannot find module '@clerk/types'` — `useAuth.ts:2` imports
`@clerk/types`, which was NOT a declared dependency in `packages/frontend/package.json`
(only `@clerk/clerk-js` was), so it resolved locally as a **phantom dependency** (a repo-root
`pnpm install` hoisted it where a directory walk-up finds it) but CI's
`pnpm install --frozen-lockfile` inside `packages/frontend` only could not. #63 added
`"@clerk/types": "^4.101.25"` (package.json:11), so a clean-tree local `tsc` is now
CI-faithful for that check. **The OTHER `tsc` trap is UNCHANGED and still real:**
`tsconfig.json` has `include: ["**/*"]` + `checkJs`, so running `tsc` AFTER a `pnpm build`
typechecks minified `dist/assets/*.js` and fails with dozens of bogus errors — always
typecheck on a clean tree (`rm -rf dist` first) and BEFORE build. The CI history and both
traps are owned by **`cellar-validation-and-qa` §2** and **`cellar-build-and-env`** — defer
there. There are STILL zero automated tests in this repo and NO backend CI — the frontend
CI trio is the only automation, so the visual pass below is not optional.)

Visual pass (no automation exists for this):

- [ ] `/gallery` renders every primitive sanely in light AND dark (bottom-right toggle).
- [ ] Changed screens checked in both themes — anything that doesn't flip is a raw-hex
      violation of §1 rule 1.
- [ ] Mobile ~375px: no horizontal scroll on changed screens (§8 recurrences).
- [ ] If Clerk was touched or bumped: /sign-in, /sign-up, /profile in both themes.

To view locally: `pnpm dev` from repo root needs AWS creds (SST); the SST-free path is
`cp .env.template .env.local` (fill values) then `npx vite` inside packages/frontend
(documented in packages/frontend/.env.template:1-7; details in `cellar-build-and-env`).

Then classify and gate the change via **cellar-change-control** — frontend changes are
the lightest class, but prod deploys remain owner-only decisions.

## Provenance and maintenance

Verified 2026-07-07 against working tree at commit 0f277a2 (branch
claude/skill-library-continuity-4m3x56, == main + skill checkpoints) by reading:
`packages/frontend/src/components/ui/CONTRACT.md`, `src/theme.css`, `src/style.css`,
`index.html`, `vite.config.ts`, `tsconfig.json`, `vitePluginEjs.ts`, `postcss.config.js`,
`eslint.config.mjs`, `package.json`, `pnpm-lock.yaml` (resolved versions: preact
10.29.3, tailwindcss 4.3.1, vite 7.3.6, phantom react 19.2.7), `src/index.tsx`,
`src/hooks/useTheme.ts`, `src/utils/swatches.ts`, `src/pages/Auth/{authAppearance.ts,Auth.css}`,
`src/pages/Home/{index.tsx,types.ts,CompactRow.tsx}`, `src/pages/Gallery/index.tsx`,
`src/pages/Comics/ComicItem.tsx`, components `Spinner/Badge/StatusPill/SegmentedToggle/
Avatar/Perforation/Input/Card/Button/Link/ThemeToggle/FlameMeter/ProgressBar/Event`,
`plan/README.md`, `plan/IMPLEMENTATION_PLAN.md`, `plan/theme.css`,
`.github/workflows/frontend-ci.yml`; commits verified via `git show --stat`
(2fd6b30, 6192496, c8d9918, 64b3ee2, 75029b8). CI trio run locally and passing.

Reconciled 2026-07-13 against commit 5ceaf98: CI is now GREEN on `main` — PR #63
(commit 1fea669, merged 2026-07-12) declared `@clerk/types` (package.json:11), fixing
the former phantom-dep TS2307 failure (see §9 and `cellar-validation-and-qa`). The
stale-`dist` `tsc` trap and the zero-automated-tests / no-backend-CI facts are unchanged.
(This skill is frontend-only; the #62 show-notification feature added no `packages/frontend`
surface — it touches `packages/core`, `packages/functions`, `infra/`, and `migrations/`.)

| May drift | Re-verify with |
|---|---|
| CONTRACT.md rules/signatures | `cat packages/frontend/src/components/ui/CONTRACT.md` |
| Token names/values | `grep -n "color\|radius\|shadow-block\|text-" packages/frontend/src/theme.css` |
| Resolved dep versions | `grep -E "^  (preact|tailwindcss|vite)@" packages/frontend/pnpm-lock.yaml` |
| Route list / gallery in prod | `grep -n "Route path" packages/frontend/src/index.tsx` |
| Spinner still dynamic-class | `grep -n 'h-\${size}' packages/frontend/src/components/Spinner.tsx` |
| Light default / no prefers-color-scheme | `grep -n "data-theme\|color-scheme" packages/frontend/index.html` |
| Clerk override fragility | `cat packages/frontend/src/pages/Auth/Auth.css` (count of `.cl-*` !important patches) |
| CI gate commands | `sed -n '40,60p' .github/workflows/frontend-ci.yml` |
| @clerk/types declared (keeps CI green) | `grep -n "@clerk/types" packages/frontend/package.json` — expect present (`^4.101.25`, since #63); its absence would re-break CI with TS2307 |
| theme.css not importing tailwind | `grep -n "tailwindcss" packages/frontend/src/{style,theme}.css` |
