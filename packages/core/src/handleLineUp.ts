import { fetchLineUp } from "./fetchLineUp";
import { LineUp } from "./models/lineUp";

export const handleLineUp = async ({ date }: { date: string }) => {
  const lineUpsData = await fetchLineUp(date);

  const lineUps = (lineUpsData ?? []).map((lineUp) => new LineUp(lineUp));

  return {
    date,
    lineUps: lineUps,
  };
};
