const GRID = "grid-cols-[62px_minmax(0,1fr)_104px_88px_108px]";

function CompactRowLoader() {
  return (
    <div
      className={`grid ${GRID} animate-pulse items-center gap-[13px] rounded-[10px] border-hair border-line bg-surface py-[7px] pl-[7px] pr-3.5 shadow-block-sm`}
    >
      {/* Time stub */}
      <div className="h-11 rounded-[7px] bg-track" />

      {/* Title + venue */}
      <div className="min-w-0 space-y-1.5">
        <div className="h-4 w-44 max-w-full rounded bg-track" />
        <div className="h-3 w-32 max-w-full rounded bg-track" />
      </div>

      {/* Seats + progress */}
      <div className="space-y-1.5">
        <div className="h-3 w-16 rounded bg-track" />
        <div className="h-1.5 rounded-pill bg-track" />
      </div>

      {/* Status */}
      <div className="h-4 w-16 justify-self-center rounded-pill bg-track" />

      {/* Action */}
      <div className="h-8 w-24 justify-self-end rounded-pill bg-track" />
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
      <div
        className={`grid ${GRID} items-center gap-[13px] px-[7px] pb-2 pr-3.5`}
      >
        <span />
        <span className="font-mono text-meta uppercase tracking-wide text-faint">
          Show
        </span>
        <span className="font-mono text-meta uppercase tracking-wide text-faint">
          Seats
        </span>
        <span className="justify-self-center font-mono text-meta uppercase tracking-wide text-faint">
          Status
        </span>
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
