import clsx from "clsx";

type CalendarButtonProps = {
  day: {
    date: string;
    isCurrentMonth?: boolean;
    isToday?: boolean;
    isSelected?: boolean;
  };
  dayIdx: number;
  days: {
    date: string;
    isCurrentMonth?: boolean;
    isToday?: boolean;
    isSelected?: boolean;
  }[];
  onClick: (date: string) => void;
};

function extractDay(date: string): string {
  return date.split("-").pop().replace(/^0/, "");
}

export function CalendarButton({
  day,
  dayIdx,
  days,
  onClick,
}: CalendarButtonProps) {
  return (
    <button
      key={day.date}
      type="button"
      className={clsx(
        "py-1.5 hover:bg-gray-100 focus:z-10",
        day.isCurrentMonth ? "bg-white" : "bg-gray-50",
        (day.isSelected || day.isToday) && "font-semibold",
        day.isSelected && "text-white",
        day.isSelected && day.isToday && "text-black",
        !day.isSelected &&
          day.isCurrentMonth &&
          !day.isToday &&
          "text-gray-900",
        !day.isSelected &&
          !day.isCurrentMonth &&
          !day.isToday &&
          "text-gray-400",
        day.isToday && !day.isSelected && "text-primary",
        dayIdx === 0 && "rounded-tl-lg",
        dayIdx === 6 && "rounded-tr-lg",
        dayIdx === days.length - 7 && "rounded-bl-lg",
        dayIdx === days.length - 1 && "rounded-br-lg"
      )}
      onClick={() => {
        onClick(day.date);
      }}
    >
      <time
        title={dayIdx + ""}
        dateTime={day.date}
        className={clsx(
          "mx-auto flex h-7 w-7 items-center justify-center rounded-full",
          day.isSelected && day.isToday && "bg-primary",
          day.isSelected && !day.isToday && "bg-gray-900"
        )}
      >
        {extractDay(day.date)}
      </time>
    </button>
  );
}
