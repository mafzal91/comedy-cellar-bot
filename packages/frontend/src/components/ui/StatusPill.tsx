import clsx from "clsx";

export type StatusPillStatus =
  | "available"
  | "selling-fast"
  | "sold-out"
  | "ended";

type StatusPillProps = {
  status?: StatusPillStatus;
  className?: string;
};

const STATUS_CONFIG: Record<StatusPillStatus, { label: string; classes: string }> = {
  available: {
    label: "Available",
    classes: "text-success bg-success-soft border-success",
  },
  "selling-fast": {
    label: "Selling Fast",
    classes: "text-warning bg-warning-soft border-warning",
  },
  "sold-out": {
    label: "Sold Out",
    classes: "text-danger bg-danger-soft border-danger",
  },
  ended: {
    label: "Show Ended",
    classes: "text-stub-ink bg-stub border-hair",
  },
};

/**
 * Uppercase mono status chip colored by availability (theme-constant tokens).
 */
export function StatusPill({ status = "available", className }: StatusPillProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={clsx(
        "inline-flex items-center font-mono uppercase text-meta tracking-wider rounded-pill border-hair px-2 py-0.5",
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
