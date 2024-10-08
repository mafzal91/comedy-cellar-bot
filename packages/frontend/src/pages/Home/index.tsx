import { useEffect, useState } from "preact/hooks";
import { useQuery } from "react-query";
import { Calendar } from "../../components/Calendar";
import { Event } from "../../components/Event";
import { EventLoader } from "../../components/EventLoader";
import { TODAY } from "../../utils/date";
import { fetchShows, fetchLineUp } from "../../utils/api";
import { Show, LineUp } from "../../types";
import { useLocation, useRoute } from "preact-iso";

export default function Home() {
  const { query } = useRoute();
  console.log(query);
  // TODO: make selected date the timestamp and not the formated string YYYY-MM-DD

  useEffect(() => {
    if (!query?.date) {
      history.replaceState(null, "", `?date=${TODAY}`);
    }
  }, [query]);

  // const [selectedDate, setSelectedDate] = useState(query.date);

  const showData = useQuery<Show[]>(
    ["shows", query.date],
    async () => {
      const showData = await fetchShows({ date: query.date });

      return showData.shows;
    },
    {
      enabled: !!query.date,
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

  const lineUpData = useQuery<LineUp[]>(
    ["lineUps", query.date],
    async () => {
      const lineUpsData = await fetchLineUp({ date: query.date });
      return lineUpsData.lineUps;
    },
    {
      enabled: !!query.date,
      refetchOnWindowFocus: false,
      retry: false,
    }
  );

  const handleDateChange = (date) => {
    console.log(date);
    history.replaceState(null, "", `?date=${date}`);
  };

  const findLineUp = (timestamp: number) => {
    return lineUpData.data.find((lineUp) => lineUp.timestamp === timestamp);
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

        <div className="mt-4 overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-200 lg:col-span-7 xl:col-span-8 ">
          <div className="px-4 py-5 sm:p-4">
            {showData.isLoading ? (
              <Loader />
            ) : (
              <ol className="divide-y divide-gray-100 text-sm leading-6">
                {showData.data.length ? (
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
