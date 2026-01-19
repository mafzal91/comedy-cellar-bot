import {
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/outline";
import { LineUp, Show } from "../../types";
import { deriveShowDetails } from "../../utils/deriveShowDetails";

export const ShowDetails = (props: { show: Show; lineUp: LineUp }) => {
  const { roomName, max } = props.show;

  const { dateTime, date, time, isEventOver, reservedSeats } =
    deriveShowDetails(props.show);

  const showInfo = [
    {
      label: "Show Name",
      value: props.show.description,
      icon: MicrophoneIcon,
    },
    {
      label: "Date",
      value: (
        <time dateTime={dateTime.toISOString()}>
          {date} at {time}
        </time>
      ),
      icon: CalendarIcon,
    },
    {
      label: "Location",
      value: roomName,
      icon: MapPinIcon,
    },
    {
      label: "Occupancy Rate",
      value: `${reservedSeats}/${max}`,
      icon: UserGroupIcon,
    },
  ];

  return (
    <>
      <dl className="space-y-5">
        {showInfo.map((info) => (
          <div key={info.label} className="flex rounded-lg items-center">
            <dt className="shrink-0">
              <div className="flow-root">
                <span className="sr-only">{info.label}</span>
                {<info.icon className="h-6 w-6" />}
              </div>
            </dt>
            <dd className="ml-5">
              <span className="text-sm font-medium text-gray-900">
                {info.value}
              </span>
            </dd>
          </div>
        ))}
        <div>
          <span className="sr-only">Line Up</span>
          {props.lineUp && <LineUpDetails lineUp={props.lineUp} />}
        </div>
      </dl>
    </>
  );
};

function LineUpDetails(props: { lineUp: LineUp }) {
  const { lineUp } = props;

  return (
    <div className="flex -space-x-2 overflow-hidden">
      {lineUp.acts.map((act) => (
        <img
          key={act.name}
          className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
          src={act.img}
          alt={act.name}
          title={act.name}
        />
      ))}
    </div>
  );
}
