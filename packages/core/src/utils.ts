import { format } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

export const parseTimestampString = ({
  timestamp,
  timeZone = "Etc/GMT+5",
}: {
  timestamp: string;
  timeZone?: string;
}) => {
  const unixTimestamp = +timestamp;
  const jsTimestamp = unixTimestamp * 1000;

  // Convert the JS timestamp to a Date object in the specified timezone
  const zonedDate = utcToZonedTime(new Date(jsTimestamp), timeZone);

  const date = format(zonedDate, "yyyy-MM-dd");
  const time = format(zonedDate, "HH:mm:ss");
  const timezone = format(zonedDate, "zzzz");

  console.log({ timezone, date, time, jsTimestamp, unixTimestamp });
  return { date, time, jsTimestamp, unixTimestamp };
};
