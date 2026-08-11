import { asc, eq, getTableColumns, gt, inArray, lte } from "drizzle-orm";
import { db } from "@core/database";
import {
  newShowQueue,
  SelectNewShowQueue,
} from "@core/sql/newShowQueue.sql";
import { show, SelectShow } from "@core/sql/show.sql";
import { room, SelectRoom } from "@core/sql/room.sql";

export type PendingNewShow = {
  queueId: SelectNewShowQueue["id"];
  queuedAt: SelectNewShowQueue["createdAt"];
  show: SelectShow;
  room: SelectRoom | null;
};

export function enqueueNewShows(showIds: SelectShow["id"][]) {
  if (!showIds.length) return Promise.resolve([]);
  return db
    .insert(newShowQueue)
    .values(showIds.map((showId) => ({ showId })))
    .onConflictDoNothing({ target: newShowQueue.showId })
    .returning({ id: newShowQueue.id });
}

// Upcoming queued shows, newest-cadence-agnostic. Rows are retained (not
// cleared once announced) so weekly/monthly subscribers can still receive a
// show that "immediately" subscribers already saw — per-user delivery is gated
// by each subscriber's cursor, not by a global notifiedAt flag. Only shows that
// have not started yet are returned; past shows are pruned by prunePastShows.
export async function getPendingNewShows(
  now: Date = new Date()
): Promise<PendingNewShow[]> {
  const nowInSeconds = Math.floor(now.getTime() / 1000);
  return db
    .select({
      queueId: newShowQueue.id,
      queuedAt: newShowQueue.createdAt,
      show: getTableColumns(show),
      room: getTableColumns(room),
    })
    .from(newShowQueue)
    .innerJoin(show, eq(show.id, newShowQueue.showId))
    .leftJoin(room, eq(room.id, show.roomId))
    .where(gt(show.timestamp, nowInSeconds))
    .orderBy(asc(show.timestamp));
}

// A show that has already started is useless to every cadence, so drop its
// queue row to keep the table bounded.
export async function prunePastShows(now: Date = new Date()) {
  const nowInSeconds = Math.floor(now.getTime() / 1000);
  const staleShowIds = db
    .select({ id: show.id })
    .from(show)
    .where(lte(show.timestamp, nowInSeconds));
  await db.delete(newShowQueue).where(inArray(newShowQueue.showId, staleShowIds));
}
