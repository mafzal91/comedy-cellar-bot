import clsx from "clsx";

export type ProgressBarStatus = "available" | "selling-fast" | "sold-out";

export interface ProgressBarProps {
  pct: number;
  status: ProgressBarStatus;
  className?: string;
}

const FILL_CLASS: Record<ProgressBarStatus, string> = {
  available: "bg-success",
  "selling-fast": "bg-warning",
  "sold-out": "bg-danger",
};

export function ProgressBar({ pct, status, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, pct));

  return (
    <div
      className={clsx(
        "w-full h-1.5 rounded-pill bg-track overflow-hidden",
        className,
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={clsx("h-full rounded-pill", FILL_CLASS[status])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
