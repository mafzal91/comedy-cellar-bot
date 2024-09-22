import { format, isPast } from "date-fns";

export const deriveShowDetails = (show) => {
  if (!show || !show.timestamp) {
    // Handle the case where `show` might be undefined or missing required fields
    console.error("Invalid 'show' object passed to deriveShowDetails.");
    return {};
  }

  const { timestamp, totalGuests, max } = show;

  const dateTime = new Date(timestamp * 1000);
  const date = format(dateTime, "MMMM do");
  const time = format(dateTime, "h:mm a");
  const isEventOver = isPast(dateTime);
  const reservedSeats = totalGuests > max ? max : totalGuests;

  return { dateTime, date, time, isEventOver, reservedSeats };
};
