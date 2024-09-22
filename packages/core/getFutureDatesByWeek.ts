import { getFutureDatesByDay } from "./getFutureDatesByDay";

export const getFutureDatesByWeek = (numberOfWeeks: number): string[] => {
  if (numberOfWeeks <= 0) {
    throw new Error("Number of weeks must be greater than 0");
  }
  const numberOfDays = numberOfWeeks * 7;

  return getFutureDatesByDay(numberOfDays);
};
