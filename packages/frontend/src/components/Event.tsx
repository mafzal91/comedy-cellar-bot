import { useState } from "preact/hooks";
import clsx from "clsx";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/20/solid";

import { Link } from "./Link";
import { Act } from "./Act";
import { StatusPill } from "./ui/StatusPill";
import { ProgressBar } from "./ui/ProgressBar";
import { Show, LineUp } from "../types";
import { getShowView } from "../pages/Home/types";

type EventItemProps = {
  show: Show;
  lineUp: LineUp;
  isLineUpLoading: boolean;
};

export function Event(props: EventItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isLineUpLoading } = props;
  const { description, timestamp, reservationUrl } = props.show;
  const { acts } = props.lineUp;

  const view = getShowView(props.show);

  return (
    <>
      <article className="group flex overflow-hidden rounded-card border-hair border-line bg-surface shadow-block transition hover:-translate-x-px hover:-translate-y-px hover:shadow-block-lg">
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
        <div className="min-w-0 flex-1 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <h3
              className="min-w-0 font-sans text-lead font-extrabold text-text"
              title={description}
            >
              {view.title}
            </h3>
            <StatusPill status={view.status} className="shrink-0" />
          </div>

          <div className="mb-3 mt-2.5 flex items-center gap-2">
            <p className="min-w-0 truncate font-mono text-meta text-muted">
              {view.venue} <span className="text-faint">·</span> {view.capLabel}
            </p>
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {view.reservable && (
                <Link
                  href={reservationUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open reservation page in a new tab"
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
                aria-expanded={isExpanded}
                aria-label={isExpanded ? "Hide lineup" : "Show lineup"}
                onClick={() => setIsExpanded(!isExpanded)}
                className="grid size-8 place-items-center rounded-full border-hair border-line text-muted outline-none transition hover:bg-track hover:text-text disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {isExpanded ? (
                  <ChevronUpIcon className="size-4" aria-hidden="true" />
                ) : (
                  <ChevronDownIcon className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex-1">
              <ProgressBar pct={view.pct} status={view.status} />
            </div>
            {view.reservable ? (
              <Link
                href={`/reservations/${timestamp}`}
                className="inline-flex shrink-0 items-center rounded-pill bg-solid px-4 py-2 font-sans text-caption font-bold text-solid-fg no-underline transition hover:bg-brand hover:text-brand-fg hover:no-underline"
              >
                Reserve Tickets &rarr;
              </Link>
            ) : (
              <span className="shrink-0 font-mono text-[11px] text-faint">
                Reservations closed
              </span>
            )}
          </div>
        </div>
      </article>

      {isExpanded && (
        <div className="mt-2.5 rounded-card border-hair border-line bg-surface p-4 shadow-block-sm">
          <ul role="list" className="divide-y divide-line">
            {acts.length > 0 ? (
              acts.map((act, index) => (
                <li
                  key={index}
                  className="flex gap-x-4 py-3 first:pt-0 last:pb-0"
                >
                  <Act {...act} />
                </li>
              ))
            ) : (
              <li className="py-1">
                <h3 className="font-sans text-caption font-semibold text-text">
                  No acts found for this show
                </h3>
              </li>
            )}
          </ul>
        </div>
      )}
    </>
  );
}
