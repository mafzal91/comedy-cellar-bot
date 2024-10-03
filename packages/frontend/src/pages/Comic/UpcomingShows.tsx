import { useQuery } from "react-query";
import { Comic as ComicType, ShowDb, ListApiRes } from "../../types";
import { fetchShowsNew } from "../../utils/api";
import { Spinner } from "../../components/Spinner";
import { useMemo } from "preact/hooks";

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
  const { data, isFetching } = useQuery<ListApiRes<ShowDb>>(
    ["comicShows", filter],
    async () => {
      const comic = await fetchShowsNew(filter);

      return comic;
    },
    {
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

  const shows = useMemo(() => {
    if (!data?.results) {
      return [];
    }
    return organizeShowsByDate(data);
  }, [data]);

  return (
    <div className="mx-auto mt-4 max-w-5xl py-4 sm:px-6 lg:px-8 space-y-2">
      <h2 className="text-sm font-medium">Upcoming shows:</h2>

      {isFetching ? (
        <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {new Array(4).fill(0).map((i) => (
            <ShowItemSkeleton />
          ))}
        </div>
      ) : shows.length ? (
        <ol className=" space-y-3">
          {shows.map(({ date, shows }) => (
            <li className="">
              <h3 className="text-sm font-medium text-gray-500 underline">
                {date}
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {shows.map((show) => (
                  <ShowItem show={show} />
                ))}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        // TODO: fix UI on this
        <span>No upcoming shows</span>
      )}
    </div>
  );
}

function ShowItem({ show }: { show: ShowDb }) {
  return (
    <div
      key={show.externalId}
      className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-pink-500 focus-within:ring-offset-2 hover:border-gray-400"
    >
      <div className="min-w-0 flex-1">
        <a
          href={`/reservations/${show.timestamp}`}
          className="focus:outline-none"
        >
          <span aria-hidden="true" className="absolute inset-0" />
          <p className="text-sm font-medium text-gray-900">
            {show.description}
          </p>
          {/* TODO: Add more information about show here */}
          {/* <p className="truncate text-sm text-gray-500">{comic.role}</p> */}
        </a>
      </div>
    </div>
  );
}

function ShowItemSkeleton() {
  return (
    <div className="animate-pulse  relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-pink-500 focus-within:ring-offset-2 hover:border-gray-400">
      <div className="min-w-0 flex-1">
        <div class="h-4 bg-gray-300	rounded col-span-4 xl:col-span-2" />
      </div>
    </div>
  );
}
