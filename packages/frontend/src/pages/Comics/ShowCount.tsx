import clsx from "clsx";

import { FlameMeter } from "../../components/ui/FlameMeter";

/**
 * Maps an upcoming-show count to the design's heat tier (0–3):
 * 0 shows → 0 · 1–4 → 1 · 5–8 → 2 · 9+ → 3.
 */
export function heatTier(showCount: number): number {
  if (showCount <= 0) return 0;
  if (showCount <= 4) return 1;
  if (showCount <= 8) return 2;
  return 3;
}

/**
 * Per-comic heat indicator: a FlameMeter plus an "{n} upcoming" / "No shows"
 * label.
 */
export function ShowCount({ showCount }: { showCount: number }) {
  const count = showCount ?? 0;
  const hasShows = count > 0;

  return (
    <div className="flex items-center gap-[7px]">
      <FlameMeter level={heatTier(count)} />
      <span
        className={clsx(
          "font-mono text-meta",
          hasShows ? "text-gold" : "text-faint",
        )}
      >
        {hasShows ? `${count} upcoming` : "No shows"}
      </span>
    </div>
  );
}

const LEGEND_ITEMS: { level: number; label: string }[] = [
  { level: 0, label: "No shows" },
  { level: 1, label: "1–4 shows" },
  { level: 2, label: "5–8 shows" },
  { level: 3, label: "9+ shows" },
];

/**
 * Heat legend row for the Comics toolbar: an "Upcoming shows" label followed
 * by the four FlameMeter tiers.
 */
export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-[22px] gap-y-2">
      <span className="font-mono uppercase text-meta tracking-wider text-faint">
        Upcoming shows
      </span>
      {LEGEND_ITEMS.map((item) => (
        <div key={item.level} className="flex items-center gap-2">
          <FlameMeter level={item.level} />
          <span className="font-mono text-[11px] text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
