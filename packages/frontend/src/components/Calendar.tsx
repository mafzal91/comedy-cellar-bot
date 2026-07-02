import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import {
  dayOfWeekToNumber,
  getDatesInMonth,
  getNextMonthsDates,
  getPreviousMonthsDates,
  getToday,
} from "../utils/date";
import { useMemo, useState } from "preact/hooks";

import { CalendarButton } from "./CalendarButton";

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
      isCurrentMonth,
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
      }),
      10
    );
  });

  const [selectedYear, setSelectedYear] = useState(() => {
    const today = value;
    return parseInt(
      new Date(today).toLocaleDateString("en-US", {
        year: "numeric",
      }),
      10
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
    ] as Day[];

    // set the today date to isToday true
    const todayIndex = calendarDays.findIndex((day) => day.date === getToday());
    if (todayIndex !== -1) {
      calendarDays[todayIndex].isToday = true;
    }

    const selectDateIndex = calendarDays.findIndex((day) => day.date === value);
    if (selectDateIndex !== -1) {
      calendarDays[selectDateIndex].isSelected = true;
    }

    return calendarDays;
  }, [selectedMonth, value]);

  const monthString = getMonthName(selectedMonth);

  const handlePreviousMonth = () => {
    setSelectedMonth((prev) => {
      if (prev === 1) {
        setSelectedYear((year) => year - 1);
        return 12;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => {
      if (prev === 12) {
        setSelectedYear((year) => year + 1);
        return 1;
      }
      return prev + 1;
    });
  };

  const handleClick = (date) => {
    onChange(date);
  };

  const weekdayInitials = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="border-hair border-line rounded-panel bg-surface p-[1.125rem] shadow-block-md">
      <div className="mb-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePreviousMonth}
          className="flex size-7 items-center justify-center rounded-full border-hair border-line text-text outline-none transition hover:bg-track focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span className="sr-only">Previous month</span>
          <ChevronLeftIcon className="size-4" aria-hidden="true" />
        </button>
        <span className="font-display text-d-sm tracking-cap text-text">
          {monthString} {selectedYear}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="flex size-7 items-center justify-center rounded-full border-hair border-line text-text outline-none transition hover:bg-track focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span className="sr-only">Next month</span>
          <ChevronRightIcon className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-7">
        {weekdayInitials.map((name, index) => (
          <span
            key={index}
            className="text-center font-mono text-[11px] text-faint"
          >
            {name}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7">
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
    </div>
  );
}
