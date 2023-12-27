import { ApiHandler } from "sst/node/api";
import {
  format,
  startOfDay,
  getDaysInMonth,
  startOfMonth as getStartOfMonth,
  endOfMonth as getEndOfMonth,
} from "date-fns";
import { getFutureDatesByDay } from "../../../core/src/getFutureDatesByDay";
import { mobileDateButton } from "../../../views/mobileDateButton";

const splitDate = (date: string): [number, number, number] => {
  const splitDate = date.split("-");
  const year = parseInt(splitDate[0], 10);
  const month = parseInt(splitDate[1], 10);
  const day = parseInt(splitDate[2], 10);
  return [year, month, day];
};

const toDayOfWeek = (date: string): string => {
  const [year, month, day] = splitDate(date);
  return format(new Date(year, month - 1, day), "eeeeee");
};

const getDatesInMonth = (date: string) => {
  const [currentYear, currentMonth, currentDay] = splitDate(date);
  const asJSDate = new Date(currentYear, currentMonth - 1, currentDay);
  const daysInMonth = getDaysInMonth(asJSDate);
  const startOfMonth = getStartOfMonth(asJSDate);
  const endOfMonth = getEndOfMonth(asJSDate);
  const datesBetweenStartAndEnd = new Array(daysInMonth).fill(0).map((_, i) => {
    return format(new Date(currentYear, currentMonth - 1, i + 1), "yyyy-MM-dd");
  });
  console.log({
    daysInMonth,
    startOfMonth,
    endOfMonth,
    datesBetweenStartAndEnd,
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

// export const handler = ApiHandler(async (_evt) => {
//   const date =
//     _evt?.queryStringParameters?.date ||
//     format(startOfDay(new Date()), "yyyy-MM-dd");
//   let futureDates = getFutureDatesByDay(7);

//   const dates = futureDates.map((futureDate) => {
//     return {
//       date: futureDate,
//       isToday: futureDate === date,
//       dayOfWeek: toDayOfWeek(futureDate),
//     };
//   });

//   const html = dates.map((date) => mobileDateButton(date)).join("");

//   return {
//     statusCode: 200,
//     headers: {
//       "Content-Type": "text/html",
//     },
//     body: html,
//   };
// });

const dayOfWeekToNumber = (dayOfWeek: string): number => {
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

const getPreviousMonthsDates = (currentDate: string) => {
  const [currentYear, currentMonth] = splitDate(currentDate);
  const previousMonth = currentMonth - 2;
  const previousMonthDates = getDatesInMonth(
    format(new Date(currentYear, previousMonth, 1), "yyyy-MM-dd")
  );
  return previousMonthDates;
};
const getNextMonthsDates = (currentDate: string) => {
  const [currentYear, currentMonth] = splitDate(currentDate);
  // JS month values are 0 index based
  const nextMonth = currentMonth;
  const nextMonthDates = getDatesInMonth(
    format(new Date(currentYear, nextMonth, 1), "yyyy-MM-dd")
  );
  return nextMonthDates;
};

export const handler = ApiHandler(async (_evt) => {
  const date =
    _evt?.queryStringParameters?.date ||
    format(startOfDay(new Date()), "yyyy-MM-dd");

  let datesOfMonth = getDatesInMonth(date);
  console.log(datesOfMonth);

  const numericStartOfMonth = dayOfWeekToNumber(datesOfMonth.startDayOfMonth);
  const numericEndOfMonth = dayOfWeekToNumber(datesOfMonth.endDayOfMonth);
  const gridSize = 42;

  let previousMonthsDates = getPreviousMonthsDates(date);
  let nextMonthDates = getNextMonthsDates(date);

  let previousMonthDatesToDisplay =
    previousMonthsDates.datesBetweenStartAndEnd.slice(
      previousMonthsDates.datesBetweenStartAndEnd.length - numericStartOfMonth
    );
  let nextMonthDatesToDisplay = nextMonthDates.datesBetweenStartAndEnd.slice(
    0,
    gridSize - (numericStartOfMonth + datesOfMonth.daysInMonth)
  );

  console.log({ previousMonthsDates, previousMonthDatesToDisplay });
  console.log(
    "--------------------",
    gridSize - (numericStartOfMonth + datesOfMonth.daysInMonth)
  );
  console.log({ nextMonthDates, nextMonthDatesToDisplay });
  let gridCalendarDates = [
    ...previousMonthDatesToDisplay,
    ...datesOfMonth.datesBetweenStartAndEnd,
    ...nextMonthDatesToDisplay,
  ];
  console.log(gridCalendarDates, gridCalendarDates.length);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: "",
  };
});
