import clsx from "clsx";
import type { ComponentChildren } from "preact";

/**
 * Icon component shape — every glyph in the app comes from
 * `@heroicons/react/20/solid`, which all share this exact type.
 */
export type BadgeIcon = typeof import("@heroicons/react/20/solid").CheckCircleIcon;

/** Semantic color intent for a badge. */
export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "muted";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "text-stub-ink bg-stub border-hair",
  success: "text-success bg-success-soft border-success dark:text-success-bright",
  warning: "text-warning bg-warning-soft border-warning",
  danger: "text-danger bg-danger-soft border-danger",
  muted: "text-faint border-line",
};

type BadgeProps = {
  /** Color intent. Defaults to `neutral`. */
  tone?: BadgeTone;
  /** Optional leading glyph (a heroicons 20/solid component). */
  icon?: BadgeIcon;
  className?: string;
  children?: ComponentChildren;
};

/**
 * Reusable pill/chip: mono, uppercase, hairline border, tone-colored, with an
 * optional leading icon. The shared primitive behind `StatusPill` (show
 * availability) and the comic-notification badges — pass a `tone` + `icon`
 * rather than restyling from scratch so every chip in the app matches.
 */
export function Badge({ tone = "neutral", icon: Icon, className, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-pill border-hair px-2 py-0.5 font-mono text-meta uppercase tracking-wider",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}
