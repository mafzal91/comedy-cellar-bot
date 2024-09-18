import { useState, useMemo } from "preact/hooks";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { CalendarButton } from "./CalendarButton";
import {
  getDatesInMonth,
  getPreviousMonthsDates,
  getNextMonthsDates,
  dayOfWeekToNumber,
  getToday,
} from "../utils/date";

type Day = {
  date: string;
  dayOfWeek: string;
  isCurrentMonth?: boolean;
  isToday?: boolean;
  isSelected?: boolean;
};

const GRID_SIZE = 42;

const mapToDay = (days, isCurrentMonth) => {
  return days.map((day) => {
    return {
      date: day,
      dayOfWeek: "",
      isCurrentMonth: isCurrentMonth,
      isToday: false,
      isSelected: false,
    };
  });
};

const getMonthName = (monthNumber) => {
  const date = new Date();
  date.setMonth(monthNumber - 1);

  return date.toLocaleString("en-US", {
    month: "long",
  });
};

export function Calendar({ value, onChange }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = value;
    return parseInt(
      new Date(today).toLocaleDateString("en-US", {
        month: "numeric",
      })
    );
  });

  const days = useMemo(() => {
    const today = new Date();
    today.setMonth(selectedMonth - 1);
    const formatDate = today.toISOString().split("T")[0];

    const currentMonthDates = getDatesInMonth(formatDate);
    const nextMonthDates = getNextMonthsDates(formatDate);
    const previousMonthsDates = getPreviousMonthsDates(formatDate);

    const numericStartOfMonth = dayOfWeekToNumber(
      currentMonthDates.startDayOfMonth
    );

    let previousMonthDatesToDisplay =
      previousMonthsDates.datesBetweenStartAndEnd.slice(
        previousMonthsDates.datesBetweenStartAndEnd.length - numericStartOfMonth
      );
    let nextMonthDatesToDisplay = nextMonthDates.datesBetweenStartAndEnd.slice(
      0,
      GRID_SIZE - (numericStartOfMonth + currentMonthDates.daysInMonth)
    );

    const calendarDays = [
      ...mapToDay(previousMonthDatesToDisplay, false),
      ...mapToDay(currentMonthDates.datesBetweenStartAndEnd, true),
      ...mapToDay(nextMonthDatesToDisplay, false),
    ];
    return calendarDays as Day[];
  }, [selectedMonth, value]);

  const monthString = getMonthName(selectedMonth);
  // set the today date to isToday true
  const todayIndex = days.findIndex((day) => day.date === getToday());
  if (todayIndex !== -1) {
    days[todayIndex].isToday = true;
  }

  const selectDateIndex = days.findIndex((day) => day.date === value);
  if (selectDateIndex !== -1) {
    days[selectDateIndex].isSelected = true;
  }

  const handlePreviousMonth = () => {
    setSelectedMonth((prev) => prev - 1);
  };
  const handleNextMonth = () => {
    setSelectedMonth((prev) => prev + 1);
  };

  const handleClick = (date) => {
    onChange(date);
  };

  return (
    <>
      <div className="flex items-center text-gray-900">
        <button
          type="button"
          onClick={handlePreviousMonth}
          className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Previous month</span>
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex-auto text-sm font-semibold">{monthString}</div>
        <button
          type="button"
          onClick={handleNextMonth}
          className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Next month</span>
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-6 grid grid-cols-7 text-xs leading-6 text-gray-500">
        <div>S</div>
        <div>M</div>
        <div>T</div>
        <div>W</div>
        <div>T</div>
        <div>F</div>
        <div>S</div>
      </div>
      <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-sm shadow ring-1 ring-gray-200">
        {days.map((day, dayIdx) => (
          <CalendarButton
            key={day.date}
            day={day}
            dayIdx={dayIdx}
            days={days}
            onClick={handleClick}
          />
        ))}
      </div>
    </>
  );
}
