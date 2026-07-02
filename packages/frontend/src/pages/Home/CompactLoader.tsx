import { GRID } from "./CompactRow";

function CompactRowLoader() {
  return (
    <div
      className={`grid ${GRID} animate-pulse items-center rounded-lg border-hair border-line bg-surface py-1.75 pl-1.75 pr-3.5 shadow-block-sm`}
    >
      {/* Time stub */}
      <div className="h-11 rounded-[7px] bg-track" />

      {/* Title + venue */}
      <div className="min-w-0 space-y-1.5">
        <div className="h-4 w-44 max-w-full rounded bg-track" />
        <div className="h-3 w-32 max-w-full rounded bg-track" />
        {/* Mobile-only availability badge */}
        <div className="h-4 w-24 rounded-pill bg-track sm:hidden" />
      </div>

      {/* Seats + progress */}
      <div className="hidden space-y-1.5 sm:block">
        <div className="h-3 w-16 rounded bg-track" />
        <div className="h-1.5 rounded-pill bg-track" />
      </div>

      {/* Status */}
      <div className="hidden h-4 w-16 justify-self-center rounded-pill bg-track sm:block" />

      {/* Action */}
      <div className="h-8 w-16 justify-self-end rounded-pill bg-track sm:w-24" />

      {/* Chevron */}
      <div className="size-3 justify-self-center rounded bg-track" />
    </div>
  );
}

/**
 * Skeleton for the "Compact" view mode: mirrors the column-header row plus
 * `CompactRow`'s grid geometry so the layout doesn't jump when data lands.
 */
export function CompactLoader() {
  return (
    <div>
      <div className={`grid ${GRID} items-center px-1.75 pb-2 pr-3.5`}>
        <span />
        <span className="font-mono text-meta uppercase tracking-wide text-faint">
          Show
        </span>
        <span className="hidden font-mono text-meta uppercase tracking-wide text-faint sm:block">
          Seats
        </span>
        <span className="hidden justify-self-center font-mono text-meta uppercase tracking-wide text-faint sm:block">
          Status
        </span>
        <span />
        <span />
      </div>
      <ol className="flex flex-col gap-[9px]">
        {new Array(8).fill(0).map((_, index) => (
          <li key={index}>
            <CompactRowLoader />
          </li>
        ))}
      </ol>
    </div>
  );
}
