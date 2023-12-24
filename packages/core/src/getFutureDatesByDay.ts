import {
  startOfDay,
  addDays,
  eachDayOfInterval,
  format,
  isBefore,
  isToday,
} from "date-fns";

export const getFutureDatesByDay = (numberOfDays: number): string[] => {
  if (numberOfDays <= 0) {
    throw new Error("Number of days must be greater than 0");
  }

  // Get the current date
  const currentDate = new Date();

  // Calculate the start and end dates for the specified number of days in advance
  const startOfNextDay = startOfDay(currentDate); // Start of the current day
  const endOfFutureDays = addDays(startOfNextDay, numberOfDays - 1); // Calculate the end date

  // Get an array of dates for the specified number of days
  const dayDates = eachDayOfInterval({
    start: startOfNextDay,
    end: endOfFutureDays,
  });

  // Filter out dates in the past and format them as YYYY-MM-DD
  const filteredDates = dayDates.filter(
    (date) => !isBefore(date, currentDate) || isToday(date)
  );
  const formattedDates = filteredDates.map((date) =>
    format(date, "yyyy-MM-dd")
  );

  return formattedDates;
};
