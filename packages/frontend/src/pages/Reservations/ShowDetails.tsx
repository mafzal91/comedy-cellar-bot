import { LineUp, Show } from "../../types";
import { deriveShowDetails } from "../../utils/deriveShowDetails";
import { useState } from "preact/hooks";
import { Avatar } from "../../components/ui/Avatar";
import { Eyebrow } from "../../components/ui/Eyebrow";
import { LineUpModal } from "./LineUpModal";

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
  const [isOpen, setIsOpen] = useState(false);

  if (lineUp.acts.length === 0) return null;

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="View full lineup"
        className="group flex items-center gap-3 rounded-pill outline-none focus-visible:shadow-[3px_3px_0_var(--color-brand)]"
      >
        <span className="flex">
          {lineUp.acts.map((act) => (
            <span
              key={act.name}
              title={act.name}
              className="-mr-[7px] inline-flex"
            >
              <span className="sr-only">{act.name}</span>
              <Avatar name={act.name} img={act.img} size={30} />
            </span>
          ))}
        </span>
        <span className="font-mono text-meta uppercase tracking-wider text-muted group-hover:text-text">
          View lineup
        </span>
      </button>

      {isOpen && (
        <LineUpModal lineUp={lineUp} onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
}
