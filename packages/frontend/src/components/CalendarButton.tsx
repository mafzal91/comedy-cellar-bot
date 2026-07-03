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

export function CalendarButton({ day, onClick }: CalendarButtonProps) {
  const { isToday, isSelected, isCurrentMonth } = day;

  return (
    <button
      type="button"
      onClick={() => {
        onClick(day.date);
      }}
      aria-pressed={isSelected}
      className="group relative flex h-[2.375rem] items-center justify-center rounded-full outline-none focus:z-10 focus-visible:z-10 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span
        aria-hidden="true"
        className={clsx(
          "absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors",
          isSelected && "bg-solid",
          isToday && !isSelected && "border-2 border-solid",
          !isToday &&
            !isSelected &&
            "group-hover:bg-track group-focus-visible:bg-track"
        )}
      />
      <time
        dateTime={day.date}
        className={clsx(
          "relative grid size-8 place-items-center font-sans text-[13px] font-semibold tabular-nums",
          isSelected && "text-solid-fg",
          isToday && !isSelected && "text-text",
          !isToday && !isSelected && isCurrentMonth && "text-text",
          !isToday && !isSelected && !isCurrentMonth && "text-faint"
        )}
      >
        {extractDay(day.date)}
      </time>
    </button>
  );
}
