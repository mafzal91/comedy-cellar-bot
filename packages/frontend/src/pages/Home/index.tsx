import { LineUp, Show } from "../../types";
import { fetchLineUp, fetchShows } from "../../utils/api";

import { Calendar } from "../../components/Calendar";
import { Event } from "../../components/Event";
import { EventLoader } from "../../components/EventLoader";
import { getToday } from "../../utils/date";
import { useEffect } from "preact/hooks";
import { useLocation } from "preact-iso";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const { query, route } = useLocation();

  useEffect(() => {
    // I shouldn't have to check pathname here bc the home component should unmount when the path changes but its not and IDK why
    if (window.location.pathname === "/" && !query.date) {
      const today = getToday();
      route(`?date=${today}`, true);
    }
  }, [query.date]);

  if (!query.date) {
    return null;
  }

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

  const findLineUp = (timestamp: number) => {
    return lineUpData.data?.find((lineUp) => lineUp.timestamp === timestamp);
  };

  const handleDateChange = (date: string) => {
    route(`?date=${date}`);
  };

  return (
    <>
      <h2 className="text-base font-semibold leading-6 text-gray-900">
        Upcoming Shows
      </h2>
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-16">
        <div className="mt-10 text-center lg:col-start-1 lg:col-end-5 lg:row-start-1 lg:mt-9">
          <Calendar value={query.date} onChange={handleDateChange} />
        </div>
        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200 lg:col-span-7 xl:col-span-8 ">
          <div className="px-4 py-5 sm:p-4">
            {showData.isLoading ? (
              <Loader />
            ) : (
              <ol className="divide-y divide-gray-100 text-sm leading-6">
                {showData.data && showData.data.length ? (
                  showData.data.map((show) => (
                    <li
                      key={show.id}
                      data-timestamp={show.timestamp}
                      className="relative xl:static py-4 first:pt-0 last:pb-0"
                    >
                      <Event
                        show={show}
                        lineUp={
                          (!lineUpData.isLoading &&
                            findLineUp(show.timestamp)) ?? {
                            reservationUrl: "",
                            timestamp: 0,
                            acts: [],
                          }
                        }
                        isLineUpLoading={lineUpData.isLoading}
                      />
                    </li>
                  ))
                ) : (
                  <li className="relative flex space-x-6 xl:static py-4 first:pt-0 last:pb-0 ">
                    <div className="flex space-x-3 md:space-x-6">
                      <h3 className="font-semibold text-gray-900">
                        No shows found for this date
                      </h3>
                    </div>
                  </li>
                )}
              </ol>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Loader() {
  return (
    <ol className="divide-y divide-gray-100 text-sm leading-6">
      {new Array(10).fill(0).map((_, index) => (
        <li
          key={index}
          className="relative flex space-x-6 xl:static py-4 first:pt-0 last:pb-0 "
        >
          <EventLoader />
        </li>
      ))}
    </ol>
  );
}
