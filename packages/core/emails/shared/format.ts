import { formatInTimeZone } from "date-fns-tz";

import { TIME_ZONE } from "./constants";

export function formatTime(timestamp: number) {
  return formatInTimeZone(timestamp * 1000, TIME_ZONE, "h:mm a");
}

export function formatDateHeading(timestamp: number) {
  return formatInTimeZone(timestamp * 1000, TIME_ZONE, "EEEE, MMMM d");
}

export function formatDateShort(timestamp: number) {
  return formatInTimeZone(timestamp * 1000, TIME_ZONE, "MMM d");
}
