import clsx from "clsx";

export interface FlameMeterProps {
  level: number;
  className?: string;
}

const FLAME_ON = "#D8841E";
const FLAME_OFF = "#E6DECB";

/** Bar heights: short / medium / tall. */
const BAR_HEIGHTS = ["6px", "9px", "12px"];

/**
 * Comics heat meter — three vertical bars indicating a comic's upcoming-show
 * heat tier. Bar i is lit (flame-on) when i <= level. Colors are
 * theme-constant per design handoff.
 */
export function FlameMeter({ level, className }: FlameMeterProps) {
  const clamped = Math.min(3, Math.max(0, Math.round(level)));

  return (
    <div
      className={clsx("inline-flex items-end gap-0.5", className)}
      role="img"
      aria-label={`${clamped} of 3 heat`}
    >
      {BAR_HEIGHTS.map((height, i) => (
        <span
          key={i}
          style={{
            width: "4px",
            height,
            backgroundColor: i < clamped ? FLAME_ON : FLAME_OFF,
          }}
          className="rounded-[1px]"
        />
      ))}
    </div>
  );
}
