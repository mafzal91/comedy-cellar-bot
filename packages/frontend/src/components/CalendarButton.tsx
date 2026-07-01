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
          "absolute size-8 rounded-full transition-colors",
          isToday && "border-hair border-line bg-brand",
          isSelected && !isToday && "bg-solid",
          !isToday &&
            !isSelected &&
            "group-hover:bg-track group-focus-visible:bg-track"
        )}
      />
      <time
        dateTime={day.date}
        className={clsx(
          "relative font-sans text-[13px] font-semibold",
          isToday && "text-brand-fg",
          isSelected && !isToday && "text-solid-fg",
          !isToday && !isSelected && isCurrentMonth && "text-text",
          !isToday && !isSelected && !isCurrentMonth && "text-faint"
        )}
      >
        {extractDay(day.date)}
      </time>
    </button>
  );
}
