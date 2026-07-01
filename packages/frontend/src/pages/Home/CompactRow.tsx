import clsx from "clsx";

import { Link } from "../../components/Link";
import { StatusPill } from "../../components/ui/StatusPill";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Show } from "../../types";
import { getShowView } from "./types";

const GRID = "grid-cols-[62px_minmax(0,1fr)_104px_88px_108px]";

/**
 * Dense one-line variant of a show row for the "Compact" view mode. Same data
 * and reserve routing as the relaxed `Event` card, laid out as a grid.
 */
export function CompactRow({ show }: { show: Show }) {
  const view = getShowView(show);

  return (
    <div
      className={clsx(
        "grid items-center gap-[13px] rounded-[10px] border-hair border-line bg-surface py-[7px] pl-[7px] pr-3.5 shadow-block-sm transition hover:-translate-x-px hover:-translate-y-px hover:shadow-block",
        GRID
      )}
    >
      {/* Time stub */}
      <div
        className={clsx(
          "rounded-[7px] border-hair border-line py-[5px] text-center",
          view.closed ? "bg-stub" : "bg-brand"
        )}
      >
        <div
          className={clsx(
            "font-display text-[21px] leading-[0.95]",
            view.closed ? "text-stub-ink" : "text-brand-fg"
          )}
        >
          {view.time}
        </div>
        <div
          className={clsx(
            "font-mono text-[9px]",
            view.closed ? "text-stub-ink" : "text-brand-fg"
          )}
        >
          {view.ampm}
        </div>
      </div>

      {/* Title + venue */}
      <div className="min-w-0">
        <div
          className="truncate font-sans text-caption font-bold text-text"
          title={show.description}
        >
          {view.title}
        </div>
        <div className="truncate font-mono text-[11px] text-muted">
          {view.venue}
        </div>
      </div>

      {/* Seats + progress */}
      <div>
        <div className="mb-1 font-mono text-meta text-muted">
          {view.capLabel}
        </div>
        <ProgressBar pct={view.pct} status={view.status} />
      </div>

      {/* Status */}
      <StatusPill status={view.status} className="justify-self-center" />

      {/* Action */}
      <div className="justify-self-end">
        {view.reservable ? (
          <Link
            href={`/reservations/${show.timestamp}`}
            className="inline-flex items-center whitespace-nowrap rounded-pill bg-solid px-3.5 py-2 font-sans text-[12px] font-bold text-solid-fg! no-underline transition hover:bg-brand hover:text-brand-fg! hover:no-underline"
          >
            Reserve &rarr;
          </Link>
        ) : (
          <span className="whitespace-nowrap font-mono text-meta text-faint">
            Closed
          </span>
        )}
      </div>
    </div>
  );
}
