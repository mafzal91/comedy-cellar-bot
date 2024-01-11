import { fetchLineUp } from "./fetchLineUp";

export const handleLineUp = async ({ date }: { date: string }) => {
  const lineUpsData = fetchLineUp(date);

  return {
    date,
    lineUp: lineUpsData,
  };
};
