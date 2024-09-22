import {
  format,
  startOfDay,
  getDaysInMonth,
  startOfMonth as getStartOfMonth,
  endOfMonth as getEndOfMonth,
} from "date-fns";

export const TODAY = format(new Date(), "yyyy-MM-dd");

const toDayOfWeek = (date: string): string => {
  const [year, month, day] = splitDate(date);
  return format(new Date(year, month - 1, day), "eeeeee");
};

const splitDate = (date: string): [number, number, number] => {
  const splitDate = date.split("-");
  const year = parseInt(splitDate[0], 10);
  const month = parseInt(splitDate[1], 10);
  const day = parseInt(splitDate[2], 10);
  return [year, month, day];
};

export const dayOfWeekToNumber = (dayOfWeek: string): number => {
  const dayOfWeekMap: Record<string, number> = {
    Mo: 1,
    Tu: 2,
    We: 3,
    Th: 4,
    Fr: 5,
    Sa: 6,
    Su: 0,
  };
  return dayOfWeekMap[dayOfWeek];
};

export const getToday = () => {
  return format(startOfDay(new Date()), "yyyy-MM-dd");
};

export const getPreviousMonthsDates = (currentDate: string) => {
  const [currentYear, currentMonth] = splitDate(currentDate);
  const previousMonth = currentMonth - 2;
  const previousMonthDates = getDatesInMonth(
    format(new Date(currentYear, previousMonth, 1), "yyyy-MM-dd")
  );
  return previousMonthDates;
};
export const getNextMonthsDates = (currentDate: string) => {
  const [currentYear, currentMonth] = splitDate(currentDate);
  // JS month values are 0 index based so 12 is december but january in JS
  const nextMonth = currentMonth;
  const nextMonthDates = getDatesInMonth(
    format(new Date(currentYear, nextMonth, 1), "yyyy-MM-dd")
  );
  return nextMonthDates;
};

export const getDatesInMonth = (date: string) => {
  const [currentYear, currentMonth, currentDay] = splitDate(date);
  const asJSDate = new Date(currentYear, currentMonth - 1, currentDay);
  const daysInMonth = getDaysInMonth(asJSDate);
  const startOfMonth = getStartOfMonth(asJSDate);
  const endOfMonth = getEndOfMonth(asJSDate);
  const datesBetweenStartAndEnd = new Array(daysInMonth).fill(0).map((_, i) => {
    return format(new Date(currentYear, currentMonth - 1, i + 1), "yyyy-MM-dd");
  });

  return {
    daysInMonth,
    startOfMonth,
    endOfMonth,
    startDayOfMonth: toDayOfWeek(datesBetweenStartAndEnd[0]),
    endDayOfMonth: toDayOfWeek(
      datesBetweenStartAndEnd[datesBetweenStartAndEnd.length - 1]
    ),
    datesBetweenStartAndEnd,
  };
};
