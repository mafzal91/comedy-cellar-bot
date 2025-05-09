import { fetchLineUp } from "./fetchLineUp";
import { Lineup } from "./models/act";

export const handleLineUp = async ({ date }: { date: string }) => {
  const lineUpsData = await fetchLineUp(date);

  const lineUps = (lineUpsData ?? []).map((lineUp) => new Lineup(lineUp));

  return {
    date,
    lineUps: lineUps,
  };
};
