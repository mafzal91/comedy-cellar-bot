import { format } from "date-fns";

export const parseTimestampString = (timestamp: string) => {
  const unixTimestamp = +timestamp;
  const jsTimestamp = unixTimestamp * 1000;

  const date = format(new Date(jsTimestamp), "yyyy-MM-dd");
  const time = format(new Date(jsTimestamp), "HH:mm:ss");

  return { date, time, jsTimestamp, unixTimestamp };
};
