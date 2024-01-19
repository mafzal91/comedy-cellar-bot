import { fetchLineUp } from "./fetchLineUp";

export const handleLineUp = async ({ date }: { date: string }) => {
  const lineUpsData = await fetchLineUp(date);

  return {
    date,
    lineUps: lineUpsData,
  };
};
