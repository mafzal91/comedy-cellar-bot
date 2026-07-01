import { format, isPast } from "date-fns";

import type { Show } from "../../types";
import type { StatusPillStatus } from "../../components/ui/StatusPill";
import { WARNING_OCCUPANCY_RATE } from "../../utils/constants";

/** View mode for the Upcoming Shows list. */
export type ViewMode = "relaxed" | "compact";

/** Availability status shared by StatusPill + ProgressBar. */
export type ShowStatus = StatusPillStatus; // "available" | "selling-fast" | "sold-out" | "ended"

/**
 * Presentation view-model derived from a `Show`. All display-only fields — the
 * underlying `Show` data and the reserve/expand behavior stay untouched.
 */
export type ShowView = {
  time: string; // "1:30"
  ampm: string; // "PM"
  title: string;
  venue: string;
  reservedSeats: number;
  max: number;
  capLabel: string; // "176 / 190"
  pct: number; // 0..100 occupancy
  status: ShowStatus;
  soldOut: boolean;
  isEventOver: boolean;
  reservable: boolean; // reservations open (mirrors the existing gate)
  closed: boolean; // reservations closed (past or sold out)
  dateTimeString: string; // ISO for <time dateTime>
};

/**
 * Derive the ticket-stub view-model from a `Show`. Mirrors the existing
 * availability/reserve logic in `Event` (soldout, occupancy warning, isPast)
 * so behavior is unchanged — this only maps those flags to display tokens.
 */
export function getShowView(show: Show): ShowView {
  const {
    showName,
    soldout,
    roomName,
    timestamp,
    occupancyRate,
    totalGuests,
    max,
  } = show;

  const dateTime = new Date(timestamp * 1000);
  const reservedSeats = totalGuests > max ? max : totalGuests;
  const isEventOver = isPast(dateTime);
  const isNearingCapacity =
    occupancyRate > WARNING_OCCUPANCY_RATE && occupancyRate < 1;
  const pct = max > 0 ? Math.round((reservedSeats / max) * 100) : 0;

  let status: ShowStatus = "available";
  if (soldout) {
    status = "sold-out";
  } else if (isEventOver) {
    status = "ended";
  } else if (isNearingCapacity) {
    status = "selling-fast";
  }

  const reservable = !isEventOver && !soldout;

  return {
    time: format(dateTime, "h:mm"),
    ampm: format(dateTime, "a"),
    title: showName,
    venue: roomName,
    reservedSeats,
    max,
    capLabel: `${reservedSeats} / ${max}`,
    pct,
    status,
    soldOut: soldout,
    isEventOver,
    reservable,
    closed: !reservable,
    dateTimeString: dateTime.toISOString(),
  };
}
