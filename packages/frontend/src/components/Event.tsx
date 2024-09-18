import { useState } from "preact/hooks";
import { format, isPast } from "date-fns";
import {
  CalendarIcon,
  MapPinIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/20/solid";
import { Availablity } from "./Availablity";
import { Link } from "./Link";
import { Act } from "./Act";
import { Show, LineUp } from "../types";
import { WARNING_OCCUPANCY_RATE } from "../utils/constants";

type EventItemProps = {
  show: Show;
  lineUp: LineUp;
  isLineUpLoading: boolean;
};

export function Event(props: EventItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isLineUpLoading } = props;
  const {
    showName,
    description,
    soldout,
    roomName,
    timestamp,
    occupancyRate,
    reservationUrl,
    totalGuests,
    max,
  } = props.show;
  const { acts } = props.lineUp;
  const dateTime = new Date(timestamp * 1000);
  const dateTimeString = dateTime.toISOString();
  const date = format(dateTime, "MMMM do");
  const time = format(dateTime, "h:mm a");
  const isEventOver = isPast(dateTime);
  const reserverdSeats = totalGuests > max ? max : totalGuests;

  return (
    <>
      <div className="flex space-x-3 md:space-x-6">
        <div className="hidden sm:flex flex-col items-center justify-center">
          <Availablity
            soldout={soldout}
            isEventOver={isEventOver}
            isNearingCapacity={
              occupancyRate > WARNING_OCCUPANCY_RATE && occupancyRate < 1
            }
          />
        </div>

        <div className="flex-auto">
          <div className="flex">
            <h3 className="font-semibold text-gray-900" title={description}>
              {showName}
            </h3>
          </div>
          <dl className="mt-2 flex flex-col text-gray-500 xl:flex-row">
            <div className="flex items-start space-x-2">
              <dt className="mt-0.5">
                <span className="sr-only">Date</span>
                <CalendarIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </dt>
              <dd>
                <time dateTime={dateTimeString}>
                  {date} at {time}
                </time>
              </dd>
            </div>
            <div className="flex items-start space-x-2 xl:ml-2 xl:mt-0 xl:border-l xl:border-gray-400 xl:border-opacity-50 xl:pl-2">
              <dt className="mt-0.5">
                <span className="sr-only">Location</span>
                <MapPinIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </dt>
              <dd>{roomName}</dd>
            </div>
            <div className="flex items-start space-x-2 xl:ml-2 xl:mt-0 xl:border-l xl:border-gray-400 xl:border-opacity-50 xl:pl-2">
              <dt className="mt-0.5">
                <span className="sr-only">Occupancy Rate</span>
                <UsersIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </dt>
              <dd>
                {reserverdSeats}/{max}
              </dd>
            </div>
            <div className="sm:hidden flex items-start xl:ml-2 xl:mt-0 xl:border-l xl:border-gray-400 xl:border-opacity-50 xl:pl-2">
              <span className="sr-only">Availability</span>
              <Availablity
                soldout={soldout}
                isEventOver={isEventOver}
                isNearingCapacity={
                  occupancyRate > WARNING_OCCUPANCY_RATE && occupancyRate < 1
                }
              />
            </div>
          </dl>

          {!isEventOver && !soldout && (
            <div className="mt-2">
              <Link href={`/reservations/${timestamp}`}>Reserve Tickets</Link>
            </div>
          )}
        </div>
        <div className="mt-0.5 flex items-center">
          {!isEventOver && !soldout && (
            <Link
              target={"_blank"}
              rel="noreferrer noopener"
              href={reservationUrl}
            >
              <ArrowTopRightOnSquareIcon
                className="-ml-0.5 h-5 w-5"
                aria-hidden="true"
              />
            </Link>
          )}
          <button
            className="px-2 py-1 text-xs font-semibold text-gray-900 ring-gray-300 border-0"
            disabled={isLineUpLoading}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUpIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            ) : (
              <ChevronDownIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-4">
          <ul role="list" className="divide-y divide-gray-100">
            {acts.length > 0 ? (
              acts.map((act, index) => (
                <li
                  key={index}
                  className="flex gap-x-4 py-4 first:pt-0 last:pb-0 even:bg-gray-50"
                >
                  <Act {...act} />
                </li>
              ))
            ) : (
              <li className="flex gap-x-4 py-4 first:pt-0 last:pb-0 even:bg-gray-50">
                <div className="flex-auto">
                  <div className="flex">
                    <h3 className="font-semibold text-gray-900">
                      No acts found for this show
                    </h3>
                  </div>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}
    </>
  );
}
