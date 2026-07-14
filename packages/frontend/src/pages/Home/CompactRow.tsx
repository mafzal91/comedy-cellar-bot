import clsx from "clsx";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

import { Link } from "../../components/Link";
import { StatusPill } from "../../components/ui/StatusPill";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Avatar } from "../../components/ui/Avatar";
import { LineUp, Show } from "../../types";
import { getShowView } from "./types";

export const GRID = "grid-cols-[54px_minmax(0,1fr)_auto_20px] gap-2.5 sm:grid-cols-[62px_minmax(0,1fr)_104px_88px_108px_26px] sm:gap-4";

type CompactRowProps = {
  show: Show;
  lineUp: LineUp;
  isLineUpLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
};

/**
 * Dense one-line variant of a show row for the "Compact" view mode. Same data
 * and reserve routing as the relaxed `Event` card, laid out as a grid. The
 * whole row toggles a fused lineup panel (pill chips) below the row.
 */
export function CompactRow({
  show,
  lineUp,
  isLineUpLoading,
  isOpen,
  onToggle,
}: CompactRowProps) {
  const view = getShowView(show);
  const { acts } = lineUp;

  const lineupNote = isLineUpLoading
    ? "…"
    : acts.length > 0
      ? `${acts.length} comics`
      : "lineup TBA";
  const lineupHeading =
    acts.length > 0 ? `Tonight's Lineup · ${acts.length} acts` : "Lineup";

  return (
    <div className="overflow-hidden rounded-[10px] border-hair border-line bg-surface shadow-block-sm transition hover:-translate-x-px hover:-translate-y-px hover:shadow-block">
      {/* Row */}
      <div
        onClick={isLineUpLoading ? undefined : onToggle}
        className={clsx(
          "grid cursor-pointer items-center py-[7px] pl-[7px] pr-3.5 transition-colors hover:bg-track",
          GRID
        )}
      >
        {/* Time stub */}
        <div
          className={clsx(
            "flex flex-col items-center justify-center rounded-[8px] border-hair border-line py-[5px] text-center",
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

        {/* Title + venue + lineup note */}
        <div className="min-w-0">
          <div
            className="truncate font-sans text-caption font-bold text-text"
            title={show.description}
          >
            {view.title}
          </div>
          <div className="truncate font-mono text-[11px] text-muted">
            {view.venue} · {lineupNote}
          </div>

          {/* Mobile-only availability badge (seats bar + desktop pill are sm+) */}
          <div className="mt-1.5 sm:hidden">
            <StatusPill status={view.status} iconOnly className="py-0" />
          </div>
        </div>

        {/* Seats + progress */}
        <div className="hidden sm:block">
          <div className="mb-1 font-mono text-meta text-muted">
            {view.capLabel}
          </div>
          <ProgressBar pct={view.pct} status={view.status} />
        </div>

        {/* Status */}
        <div className="hidden justify-self-center sm:block">
          <StatusPill status={view.status} />
        </div>

        {/* Action */}
        <div className="justify-self-end">
          {view.reservable ? (
            <Link
              href={`/reservations/${show.timestamp}`}
              onClick={(event: MouseEvent) => event.stopPropagation()}
              className="inline-flex items-center whitespace-nowrap rounded-pill bg-solid px-2.5 py-1.5 font-sans text-[11px] font-bold text-solid-fg! no-underline transition hover:bg-brand hover:text-brand-fg! hover:no-underline sm:px-3.5 sm:py-2 sm:text-[12px]"
            >
              Reserve &rarr;
            </Link>
          ) : (
            <span className="whitespace-nowrap font-mono text-meta text-faint">
              Closed
            </span>
          )}
        </div>

        {/* Chevron */}
        <button
          type="button"
          disabled={isLineUpLoading}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Hide lineup" : "Show lineup"}
          onClick={(event: MouseEvent) => {
            event.stopPropagation();
            onToggle();
          }}
          className="grid cursor-pointer place-items-center justify-self-center outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <ChevronDownIcon
            aria-hidden="true"
            className={clsx(
              "size-3.5 text-text transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Fused lineup panel */}
      {isOpen && (
        <div className="animate-lineup-in border-t-[1.5px] border-dashed border-line bg-bg px-4 pb-[15px] pt-3.5">
          <div className="mb-[11px] font-mono text-meta uppercase tracking-wider text-gold">
            {lineupHeading}
          </div>
          {acts.length > 0 ? (
            <ul role="list" className="flex flex-wrap gap-[9px]">
              {acts.map((act, index) => (
                <li
                  key={index}
                  className="flex items-center gap-[9px] rounded-pill border-hair border-line bg-surface py-[5px] pl-[5px] pr-3.5 shadow-[1.5px_2px_0_var(--shadow)]"
                >
                  {act.img ? (
                    <img
                      src={act.img}
                      alt={`Image of ${act.name}`}
                      className="size-[30px] shrink-0 rounded-full border-hair border-line bg-track object-cover"
                    />
                  ) : (
                    <Avatar name={act.name} size={30} />
                  )}
                  <a
                    href={act.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-nowrap font-sans text-caption font-bold text-text hover:underline"
                  >
                    {act.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-sans text-caption font-semibold text-faint">
              No acts announced yet — check back for the lineup.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
