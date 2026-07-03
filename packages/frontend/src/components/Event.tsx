import clsx from "clsx";
import {
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/20/solid";

import { Link } from "./Link";
import { Act } from "./Act";
import { ProgressBar } from "./ui/ProgressBar";
import { Show, LineUp } from "../types";
import { getShowView } from "../pages/Home/types";

type EventItemProps = {
  show: Show;
  lineUp: LineUp;
  isLineUpLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
};

export function Event(props: EventItemProps) {
  const { isLineUpLoading, isOpen, onToggle } = props;
  const { description, timestamp, reservationUrl } = props.show;
  const { acts } = props.lineUp;

  const view = getShowView(props.show);

  const lineupNote = isLineUpLoading
    ? "…"
    : acts.length > 0
      ? `${acts.length} comics`
      : "lineup TBA";
  const lineupHeading =
    acts.length > 0 ? `Tonight's Lineup · ${acts.length} acts` : "Lineup";

  const handleToggle = () => {
    if (isLineUpLoading) return;
    onToggle();
  };

  return (
    <article className="group overflow-hidden rounded-card border-hair border-line bg-surface shadow-block transition hover:-translate-x-px hover:-translate-y-px hover:shadow-block-lg">
      {/* Clickable header: time stub + body */}
      <div className="flex cursor-pointer" onClick={handleToggle}>
        {/* Time stub */}
        <div
          className={clsx(
            "relative flex w-28 shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-line",
            view.closed ? "bg-stub" : "bg-brand"
          )}
        >
          <time
            dateTime={view.dateTimeString}
            className={clsx(
              "font-display text-d-md leading-none",
              view.closed ? "text-stub-ink" : "text-brand-fg"
            )}
          >
            {view.time}
          </time>
          <span
            className={clsx(
              "font-mono text-[11px] tracking-wide",
              view.closed ? "text-stub-ink" : "text-brand-fg"
            )}
          >
            {view.ampm}
          </span>
          {view.soldOut && (
            <span className="absolute bottom-3 rotate-[-8deg] rounded-[3px] border-hair border-danger bg-surface px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-danger">
              SOLD
            </span>
          )}
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1 px-5 py-4 transition-colors hover:bg-track">
          <div className="sm:flex sm:items-start sm:justify-between sm:gap-3">
            <div className="hidden shrink-0 items-center gap-2.5 sm:order-2 sm:flex">
              {view.reservable && (
                <Link
                  href={reservationUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open reservation page in a new tab"
                  variant="plain"
                  onClick={(e) => e.stopPropagation()}
                  className="grid size-8 place-items-center rounded-full border-hair border-line text-muted no-underline transition hover:bg-track hover:text-text hover:no-underline"
                >
                  <ArrowTopRightOnSquareIcon
                    className="size-4"
                    aria-hidden="true"
                  />
                </Link>
              )}
              <button
                type="button"
                disabled={isLineUpLoading}
                aria-expanded={isOpen}
                aria-label={isOpen ? "Hide lineup" : "Show lineup"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="grid size-8 place-items-center rounded-full border-hair border-line text-muted outline-none transition hover:bg-track hover:text-text disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <ChevronDownIcon
                  className={clsx(
                    "size-4 transition-transform",
                    isOpen && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
            </div>
            <h3
              className="min-w-0 font-sans text-lead font-extrabold text-text sm:order-1"
              title={description}
            >
              {view.title}
            </h3>
          </div>

          <div className="mb-3 mt-2.5 flex items-center gap-2">
            <p className="min-w-0 truncate font-mono text-meta text-muted">
              {view.venue} <span className="text-faint">·</span> {view.capLabel}{" "}
              <span className="text-faint">·</span> {lineupNote}
            </p>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="hidden min-w-0 flex-1 sm:block">
              <ProgressBar pct={view.pct} status={view.status} />
            </div>
            <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
              {view.reservable ? (
                <Link
                  href={`/reservations/${timestamp}`}
                  variant="plain"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex shrink-0 items-center rounded-pill bg-solid px-4 py-2 font-sans text-caption font-bold text-solid-fg no-underline transition hover:bg-brand hover:text-brand-fg hover:no-underline"
                >
                  Reserve Tickets &rarr;
                </Link>
              ) : (
                <span className="shrink-0 font-mono text-[11px] text-faint">
                  Reservations closed
                </span>
              )}
              <div className="flex items-center gap-2 sm:hidden">
                {view.reservable && (
                  <Link
                    href={reservationUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="Open reservation page in a new tab"
                    variant="plain"
                    onClick={(e) => e.stopPropagation()}
                    className="grid size-8 place-items-center rounded-full border-hair border-line text-muted no-underline transition hover:bg-track hover:text-text hover:no-underline"
                  >
                    <ArrowTopRightOnSquareIcon
                      className="size-4"
                      aria-hidden="true"
                    />
                  </Link>
                )}
                <button
                  type="button"
                  disabled={isLineUpLoading}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? "Hide lineup" : "Show lineup"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                  }}
                  className="grid size-8 place-items-center rounded-full border-hair border-line text-muted outline-none transition hover:bg-track hover:text-text disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <ChevronDownIcon
                    className={clsx(
                      "size-4 transition-transform",
                      isOpen && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fused lineup panel */}
      {isOpen && (
        <div className="animate-lineup-in border-t-2 border-dashed border-line bg-bg px-[22px] pb-5 pt-[18px]">
          <h4 className="mb-3.5 font-mono text-meta uppercase tracking-wider text-gold">
            {lineupHeading}
          </h4>
          {acts.length > 0 ? (
            <ul role="list">
              {acts.map((act, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3.5 border-b border-track py-[11px] last:border-b-0"
                >
                  <Act {...act} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-3">
              <span className="grid size-[34px] shrink-0 place-items-center rounded-full border-hair border-dashed border-faint font-sans text-body text-faint">
                ?
              </span>
              <div>
                <p className="font-sans text-[15px] font-extrabold text-text">
                  Lineup not announced yet
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-faint">
                  Acts are usually posted the morning of the show.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
