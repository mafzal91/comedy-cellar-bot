# UI Contract — "Vintage Marquee" re-skin

Published by **Wave 0A**. Every screen/primitive agent codes against **this file**, not
against another agent's finished pixels. Import paths + prop signatures + token utilities
below are stable; restyle changes are internal-only and **additive** to props.

> **Ownership rule:** edit only your assigned files; import (read) anything freely.
> Do **not** edit `src/index.tsx`, `src/style.css`, `src/theme.css`, `index.html`,
> `src/utils/api.ts`, `src/utils/clerk.ts`, `src/types.ts`. Screen-local types →
> `src/pages/<Screen>/types.ts`. Need a new shared primitive? Flag for Phase 2, don't
> create it in a screen folder.

---

## Token cheat-sheet (from `src/theme.css`)

Dark mode: `<html data-theme="dark">` flips the theme-aware tokens. Use tokens, never
raw hex or stock Tailwind grays — hardcoded colors won't flip in dark mode.

### Color utilities
| Utility | Meaning |
| --- | --- |
| `bg-bg` | page background (warm cream / near-black) |
| `bg-surface` | cards / panels / inputs |
| `text-text` `text-muted` `text-faint` | primary / secondary / tertiary text |
| `border-line` | borders & rules (pair with `border-hair`) |
| `bg-track` | progress tracks / dividers |
| `placeholder:text-placeholder` | input placeholder |
| `bg-solid` `hover:bg-solid-hover` `text-solid-fg` | primary button (theme-aware) |
| `bg-brand` `hover:bg-brand-hover` `text-brand-fg` | marquee yellow (constant both themes) |
| `bg-ink` `text-ink` / `bg-cream` `text-cream` | literal warm ink / cream (theme-independent) |
| `text-gold` | eyebrow / meta accent on cream |
| status: `success` `warning` `danger` (+ `-soft` tint bg, `-bright` dark-mode bar) | Available / Selling Fast / Sold Out |
| `bg-stub` `text-stub-ink` | sold-out ticket-stub surface |

### Borders / radius / shadow
- `border-hair` → 1.5px signature border (use **with** `border-line`).
- `rounded-field` (9px) · `rounded-card` (12px) · `rounded-panel` (14px) · `rounded-pill` (999px).
- `shadow-block-sm` · `shadow-block` · `shadow-block-md` · `shadow-block-lg` — hard, blur-less offset.

### Type
- `font-display` (Bebas Neue) · `font-sans` (Archivo) · `font-mono` (JetBrains Mono).
- Role sizes: `text-eyebrow` `text-meta` `text-label` `text-caption` `text-body` `text-lead`
  `text-d-sm` `text-d-md` `text-d-lg` `text-d-xl` `text-d-2xl`.
- Tracking: `tracking-tightcap` `tracking-cap` `tracking-wide` `tracking-wider` `tracking-widest` `tracking-mega`.

---

## Existing shared primitives (restyled in place — APIs stable, additive only)

```tsx
// src/components/Button.tsx
<Button size?="xs|sm|md|lg|xl" type?="button|submit|reset" disabled? {...buttonAttrs} />
//   Phase 0D adds: variant?="solid|outline|reserve" (default solid). size stays.

// src/components/Card.tsx  — compound
<Card><CardHeader/><CardBody/><CardFooter/></Card>

// src/components/Input.tsx
<Input {...inputAttrs} />                          // spreads onto <input>

// src/components/Link.tsx
<Link href target? rel? {...anchorAttrs} />        // 0D adds yellow-underline variant

// src/components/Checkbox.tsx
<Checkbox label displayLabel description checked? defaultChecked? onChange?=(checked:boolean)=>void />

// src/components/Spinner.tsx
<Spinner size={number} className? />

// src/components/PageLoader.tsx
<PageLoader />

// src/components/Image.tsx  — NOTE export name is `Img`
import { Img } from "../components/Image";
<Img src ... />                                     // spreads onto <img>, strips size from src

// src/components/Header.tsx — renders <Perforation/> under the bar. Keeps Clerk auth-link logic.
```

---

## NEW UI kit — `src/components/ui/` (one file = one agent). Import: `../components/ui/<Name>`

Prop signatures below are the **contract**. Build to them.

```tsx
Eyebrow.tsx        <Eyebrow>{text}</Eyebrow>                       // mono uppercase gold
PageHeader.tsx     <PageHeader eyebrow? title subline? />          // eyebrow + Bebas H1 + subline
Pill.tsx           <Pill>{children}</Pill>
StatusPill.tsx     <StatusPill status="available|selling-fast|sold-out" />
ProgressBar.tsx    <ProgressBar pct={0..100} status="available|selling-fast|sold-out" />
SegmentedToggle.tsx <SegmentedToggle options={{label,value}[]} value onChange=(value)=>void />
Avatar.tsx         <Avatar name={string} size?={number} />        // initials on rotated swatch
FlameMeter.tsx     <FlameMeter level={0..4} />                     // comics heat
TicketStub.tsx     <TicketStub>{children}</TicketStub>            // dashed seam + notch circles
TicketCard.tsx     <TicketCard>{children}</TicketCard>            // base surface card
```

- `src/utils/swatches.ts` — 6-pair avatar swatch rotation (see `plan/README.md`).
  `Avatar` picks a pair by hashing `name`.

## Theme runtime (Wave 0B)
```tsx
// src/hooks/useTheme.ts
const { theme, toggle } = useTheme();   // theme: "light"|"dark"; persists localStorage["cc-theme"]
// src/components/ThemeToggle.tsx
<ThemeToggle />                          // round ☀/☾ button; mounted at root in Phase 2
```
