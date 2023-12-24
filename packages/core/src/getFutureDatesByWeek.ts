import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isBefore,
  isToday,
} from "date-fns";

export const getFutureDatesByWeek = (numberOfWeeks: number): string[] => {
  if (numberOfWeeks <= 0) {
    throw new Error("Number of weeks must be greater than 0");
  }

  // Get the current date
  const currentDate = new Date();

  // Calculate the start and end dates for the specified number of weeks in advance
  const startOfNextWeek = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start of next week (Monday)
  const endOfFutureWeeks = new Date(startOfNextWeek);
  endOfFutureWeeks.setDate(startOfNextWeek.getDate() + numberOfWeeks * 7); // Calculate the end date

  // Get an array of dates for the specified number of weeks
  const weekDates = eachDayOfInterval({
    start: startOfNextWeek,
    end: endOfFutureWeeks,
  });

  // Filter out dates in the past and format them as YYYY-MM-DD
  const filteredDates = weekDates.filter(
    (date) => !isBefore(date, currentDate) || isToday(date)
  );
  const formattedDates = filteredDates.map((date) =>
    format(date, "yyyy-MM-dd")
  );

  return formattedDates;
};
