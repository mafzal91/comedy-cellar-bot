import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export const parseTimestampString = ({
  timestamp,
  timeZone = "America/New_York",
}: {
  timestamp: string;
  timeZone?: string;
}) => {
  const unixTimestamp = +timestamp;
  const jsTimestamp = unixTimestamp * 1000;

  // Convert the JS timestamp to a Date object in the specified timezone
  const zonedDate = toZonedTime(new Date(jsTimestamp), timeZone);

  const date = format(zonedDate, "yyyy-MM-dd");
  const time = format(zonedDate, "HH:mm:ss");
  const timezone = format(zonedDate, "zzzz");

  // console.log({ timezone, date, time, jsTimestamp, unixTimestamp });
  return { date, time, jsTimestamp, unixTimestamp };
};

export function removeSizeFromUrl(url: string): string {
  // Use a regular expression to remove '-70x70' before the file extension
  // return url.replace(/-70x70(?=\.\w+)$/, "");
  return url.replace(/-70x70(?=\.\w+$)/, "");
}
