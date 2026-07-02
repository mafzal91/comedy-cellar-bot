# ESLint baseline — frontend

First captured **2026-07-01**, right after ESLint v9 flat config (`eslint.config.mjs`)
was introduced. Lint had never run on this package before, so these are
**pre-existing** findings surfaced by turning linting on — none were introduced by
the vintage-marquee redesign.

## How to revisit (nothing is lost)

The config is committed, so the full, current findings regenerate on demand:

```bash
cd packages/frontend
pnpm exec eslint src                     # human-readable, grouped by file
pnpm exec eslint src -f compact          # path:line:col  message  (rule)   ← easy to grep
pnpm exec eslint src --fix               # auto-fix the mechanically-fixable subset
```

As findings get fixed, this count should drop. Treat the number below as the
starting line; re-run to see progress.

## Baseline count

**42 problems — 32 errors, 10 warnings.** (`5 errors + 2 warnings` are
`--fix`-able.)

## Approximate breakdown by rule

> Rule tallies below are from the setup run's report and are approximate
> (they sum to ~37 of 42; re-run `-f compact` for the authoritative per-line list).

| Rule | ~Count | Triage |
|---|---|---|
| `no-unused-vars` | 12 | Real — dead vars/imports. Mostly mechanical. |
| `no-undef` (`'React' is not defined`) | 10 | **Likely config-noise.** Preact uses the automatic JSX runtime (`jsxImportSource: preact`); `React`-in-scope rules shouldn't fire. Fix by tuning `eslint.config.mjs` (disable `react/react-in-jsx-scope` + adjust `no-undef`/globals), not by editing code. |
| `react-hooks/exhaustive-deps` | 5 | Case-by-case — some intentional (already have eslint-disable elsewhere). |
| `react/self-closing-comp` | 4 | Cosmetic, `--fix`-able. |
| `react-hooks/rules-of-hooks` | 3 | **Priority — possible real bugs.** Hooks called after early `return`s (e.g. `Reservations/index.tsx` `useEffect` sits below `if (…) return`). Verify before "fixing". |
| `react/no-danger` | 1 | Review (dangerouslySetInnerHTML). |
| `react/jsx-no-target-blank` | 1 | Real-ish — add `rel="noopener"`. `--fix`-able. |
| `no-duplicate-imports` | 1 | Mechanical. |

## Suggested triage order

1. **`react-hooks/rules-of-hooks` (3)** — inspect first; conditional hook calls can
   cause real runtime bugs. Fix by hoisting hooks above early returns.
2. **`no-undef` React (10)** — one config tweak in `eslint.config.mjs` likely clears
   most; removes noise so the real signal stands out.
3. **`--fix`-ables** — `self-closing-comp`, `jsx-no-target-blank`, some imports.
4. **`no-unused-vars` (12)** — mechanical cleanup.
5. **`exhaustive-deps` (5)** — case-by-case; annotate intentional omissions.
