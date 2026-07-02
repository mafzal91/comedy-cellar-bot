import { LineUp, Show } from "../../types";
import { fetchLineUp, fetchShows } from "../../utils/api";

import { Calendar } from "../../components/Calendar";
import { Event } from "../../components/Event";
import { EventLoader } from "../../components/EventLoader";
import { PageHeader } from "../../components/ui/PageHeader";
import { SegmentedToggle } from "../../components/ui/SegmentedToggle";
import { CompactLoader } from "./CompactLoader";
import { CompactRow, GRID } from "./CompactRow";
import type { ViewMode } from "./types";
import { getToday } from "../../utils/date";
import { format, isPast } from "date-fns";
import { useEffect, useState } from "preact/hooks";
import { useLocation } from "preact-iso";
import { useQuery } from "@tanstack/react-query";

const VIEW_OPTIONS: { label: string; value: ViewMode }[] = [
  { label: "Relaxed", value: "relaxed" },
  { label: "Compact", value: "compact" },
];

const VIEW_MODE_STORAGE_KEY = "cc-view-mode";

function getInitialViewMode(): ViewMode {
  if (typeof window === "undefined") {
    return "relaxed";
  }

  const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  if (stored === "relaxed" || stored === "compact") {
    return stored;
  }

  return "relaxed";
}

function formatEyebrowDate(date: string): string {
  const [year, month, day] = date.split("-").map((part) => parseInt(part, 10));
  if (!year || !month || !day) return "";
  return format(new Date(year, month - 1, day), "EEEE · MMMM d, yyyy");
}

export default function Home() {
  const { query, route } = useLocation();
  const [mode, setMode] = useState<ViewMode>(() => getInitialViewMode());
  const [openShows, setOpenShows] = useState<Record<string, boolean>>({});

  const toggleShow = (timestamp: string) => {
    setOpenShows((prev) => ({ ...prev, [timestamp]: !prev[timestamp] }));
  };

  const handleModeChange = (next: ViewMode) => {
    setMode(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
    }
  };

  useEffect(() => {
    // I shouldn't have to check pathname here bc the home component should unmount when the path changes but its not and IDK why
    if (window.location.pathname === "/" && !query.date) {
      const today = getToday();
      route(`?date=${today}`, true);
    }
  }, [query.date, route]);

  const showData = useQuery<Show[]>({
    queryKey: ["shows", query.date],
    queryFn: async () => {
      const showData = await fetchShows({ date: query.date });
      return showData.shows;
    },
    enabled: !!query.date,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Fetch lineups based on the selected date
  const lineUpData = useQuery<LineUp[]>({
    queryKey: ["lineUps", query.date],
    queryFn: async () => {
      const lineUpsData = await fetchLineUp({ date: query.date });
      return lineUpsData.lineUps;
    },
    enabled: !!query.date,
    refetchOnWindowFocus: false,
    retry: false,
  });

  if (!query.date) {
    return null;
  }

  const findLineUp = (timestamp: number) => {
    return lineUpData.data?.find((lineUp) => lineUp.timestamp === timestamp);
  };

  const handleDateChange = (date: string) => {
    route(`?date=${date}`);
  };

  const shows = showData.data ?? [];
  const showCount = shows.length;
  const roomCount = new Set(shows.map((show) => show.roomId)).size;
  const availableCount = shows.filter(
    (show) => !show.soldout && !isPast(new Date(show.timestamp * 1000))
  ).length;

  const subline = showData.isLoading ? (
    "Loading tonight's lineup…"
  ) : (
    <>
      {showCount} {showCount === 1 ? "show" : "shows"} across {roomCount}{" "}
      {roomCount === 1 ? "room" : "rooms"} —{" "}
      <span className="font-bold text-success">
        {availableCount} still available
      </span>
    </>
  );

  return (
    <div className="mx-auto w-full max-w-[1180px] bg-bg text-text">
      <PageHeader
        eyebrow={formatEyebrowDate(query.date)}
        title="Tonight at the Cellar"
        subline={subline}
      />

      <div className="mt-7 grid grid-cols-1 items-start gap-8 md:grid-cols-[288px_1fr]">
        {/* Calendar */}
        <aside>
          <Calendar value={query.date} onChange={handleDateChange} />
        </aside>

        {/* Shows list */}
        <section>
          <div className="mb-[18px] flex items-end justify-between gap-4">
            <h2 className="font-display text-d-sm tracking-cap text-text">
              Upcoming Shows
            </h2>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-meta uppercase tracking-wide text-faint">
                View
              </span>
              <SegmentedToggle<ViewMode>
                options={VIEW_OPTIONS}
                value={mode}
                onChange={handleModeChange}
              />
            </div>
          </div>

          {showData.isLoading ? (
            mode === "relaxed" ? (
              <Loader />
            ) : (
              <CompactLoader />
            )
          ) : shows.length ? (
            mode === "relaxed" ? (
              <ol className="flex flex-col gap-[15px]">
                {shows.map((show) => (
                  <li key={show.id} data-timestamp={show.timestamp}>
                    <Event
                      show={show}
                      lineUp={
                        findLineUp(show.timestamp) ?? {
                          reservationUrl: "",
                          timestamp: 0,
                          acts: [],
                        }
                      }
                      isLineUpLoading={lineUpData.isLoading}
                      isOpen={!!openShows[String(show.timestamp)]}
                      onToggle={() => toggleShow(String(show.timestamp))}
                    />
                  </li>
                ))}
              </ol>
            ) : (
              <div>
                <div className={`grid ${GRID} items-center px-[8px] pb-2 pr-3.5`}>
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
                  {shows.map((show) => (
                    <li key={show.id} data-timestamp={show.timestamp}>
                      <CompactRow
                        show={show}
                        lineUp={
                          findLineUp(show.timestamp) ?? {
                            reservationUrl: "",
                            timestamp: 0,
                            acts: [],
                          }
                        }
                        isLineUpLoading={lineUpData.isLoading}
                        isOpen={!!openShows[String(show.timestamp)]}
                        onToggle={() => toggleShow(String(show.timestamp))}
                      />
                    </li>
                  ))}
                </ol>
              </div>
            )
          ) : (
            <div className="rounded-card border-hair border-line bg-surface p-8 text-center shadow-block">
              <h3 className="font-display text-d-sm text-text">
                No shows found for this date
              </h3>
              <p className="mt-1 font-sans text-caption text-muted">
                Try picking another date on the calendar.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <ol className="flex flex-col gap-[15px]">
      {new Array(8).fill(0).map((_, index) => (
        <li key={index}>
          <EventLoader />
        </li>
      ))}
    </ol>
  );
}
