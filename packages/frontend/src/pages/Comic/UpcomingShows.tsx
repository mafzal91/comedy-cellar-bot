import { Comic as ComicType, ListApiRes, ShowDb } from "../../types";

import { fetchShowsNew } from "../../utils/api";
import { useMemo } from "preact/hooks";
import { useQuery } from "@tanstack/react-query";

type ResultObject = {
  date: string;
  shows: ShowDb[];
};
function organizeShowsByDate(data: ListApiRes<ShowDb>): ResultObject[] {
  const showsByDate: { [date: string]: ShowDb[] } = {};

  data.results.forEach((show) => {
    // Convert the timestamp to a date string in 'MM-DD-YYYY' format
    const showDate = new Date(show.timestamp * 1000).toLocaleDateString(
      "en-US",
      {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }
    );

    // Group shows by date
    if (!showsByDate[showDate]) {
      showsByDate[showDate] = [];
    }

    showsByDate[showDate].push(show);
  });

  // Convert the showsByDate object to an array of { date, shows }
  return Object.entries(showsByDate).map(([date, shows]) => ({
    date,
    shows,
  }));
}

export function UpcomingShows({ comicId }: { comicId: string }) {
  const filter = useMemo(
    () => ({
      comicId,
      date: {
        start: +new Date(),
      },
      offset: 0,
      limit: 20,
    }),
    [comicId]
  );
  const { data, isFetching } = useQuery<ListApiRes<ShowDb>>({
    queryKey: ["comicShows", filter],
    queryFn: async () => {
      const comic = await fetchShowsNew(filter);

      return comic;
    },
    refetchOnWindowFocus: false,
    retry: false,
  });

  const shows = useMemo(() => {
    if (!data?.results) {
      return [];
    }
    return organizeShowsByDate(data);
  }, [data]);

  return (
    <div className="mt-8">
      <h2 className="mb-4 font-display text-d-sm tracking-cap text-text">
        Upcoming Shows
      </h2>

      {isFetching ? (
        <div className="flex flex-col gap-3">
          {new Array(4).fill(0).map((_, i) => (
            <ShowItemSkeleton key={i} />
          ))}
        </div>
      ) : shows.length ? (
        <ol className="flex flex-col gap-3">
          {shows.map(({ shows }) =>
            shows.map((show) => <ShowItem key={show.externalId} show={show} />)
          )}
        </ol>
      ) : (
        <p className="font-mono text-caption text-muted">No upcoming shows</p>
      )}
    </div>
  );
}

function ShowItem({ show }: { show: ShowDb }) {
  const dt = new Date(show.timestamp * 1000);
  const day = dt.toLocaleDateString("en-US", { day: "2-digit" });
  const mon = dt
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const meta = `${dt.toLocaleDateString("en-US", {
    weekday: "short",
  })} · ${dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} · ${dt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  return (
    <li className="flex items-stretch overflow-hidden rounded-card border-hair border-line bg-bg shadow-block transition hover:-translate-x-px hover:-translate-y-px hover:shadow-block-lg">
      <div className="flex w-24 shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-line bg-brand py-3.5">
        <span className="font-display text-d-md leading-none text-brand-fg">
          {day}
        </span>
        <span className="font-mono text-meta tracking-wide text-brand-fg">
          {mon}
        </span>
      </div>
      <div className="flex flex-1 items-center justify-between gap-4 px-5 py-3.5">
        <div className="min-w-0">
          <p className="font-sans text-[17px] font-extrabold text-text">
            {show.description}
          </p>
          <p className="mt-0.5 font-mono text-caption text-muted">{meta}</p>
        </div>
        <a
          href={`/reservations/${show.timestamp}`}
          className="shrink-0 rounded-pill bg-solid px-4 py-2 font-sans text-caption font-bold text-solid-fg transition hover:bg-brand hover:text-brand-fg"
        >
          Reserve →
        </a>
      </div>
    </li>
  );
}

function ShowItemSkeleton() {
  return (
    <div className="flex animate-pulse items-stretch overflow-hidden rounded-card border-hair border-line bg-bg shadow-block">
      <div className="w-24 shrink-0 border-r-2 border-dashed border-line bg-track" />
      <div className="flex flex-1 items-center px-5 py-3.5">
        <div className="h-4 w-2/3 rounded-field bg-track" />
      </div>
    </div>
  );
}
