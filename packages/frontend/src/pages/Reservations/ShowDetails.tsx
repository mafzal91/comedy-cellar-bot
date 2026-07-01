import { LineUp, Show } from "../../types";
import { deriveShowDetails } from "../../utils/deriveShowDetails";
import { Avatar } from "../../components/ui/Avatar";
import { Eyebrow } from "../../components/ui/Eyebrow";

export const ShowDetails = (props: { show: Show; lineUp: LineUp }) => {
  const { roomName, max, description } = props.show;

  const { dateTime, date, time, reservedSeats } = deriveShowDetails(props.show);

  const showInfo = [
    {
      label: "DATE",
      value: (
        <time dateTime={dateTime.toISOString()}>
          {date} · {time}
        </time>
      ),
    },
    {
      label: "ROOM",
      value: roomName,
    },
    {
      label: "SEATS",
      value: `${reservedSeats} / ${max}`,
    },
  ];

  return (
    <div>
      <Eyebrow>Your Show</Eyebrow>
      <h2 className="mt-1.5 font-display text-d-md leading-[0.95] text-text">
        {description}
      </h2>

      <dl className="mt-5 flex flex-col gap-3">
        {showInfo.map((info) => (
          <div
            key={info.label}
            className="flex gap-2.5 font-mono text-meta text-text"
          >
            <dt className="text-gold">{info.label}</dt>
            <dd>{info.value}</dd>
          </div>
        ))}
      </dl>

      {props.lineUp && <LineUpDetails lineUp={props.lineUp} />}
    </div>
  );
};

function LineUpDetails(props: { lineUp: LineUp }) {
  const { lineUp } = props;

  return (
    <div className="mt-5 flex">
      {lineUp.acts.map((act) => (
        <span
          key={act.name}
          title={act.name}
          className="-mr-[7px] inline-flex"
        >
          <span className="sr-only">{act.name}</span>
          <Avatar name={act.name} size={30} />
        </span>
      ))}
    </div>
  );
}
