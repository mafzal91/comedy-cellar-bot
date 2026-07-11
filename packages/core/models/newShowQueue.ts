import { and, asc, eq, getTableColumns, inArray, isNull } from "drizzle-orm";
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

export async function getPendingNewShows(): Promise<PendingNewShow[]> {
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
    .where(isNull(newShowQueue.notifiedAt))
    .orderBy(asc(show.timestamp));
}

// Marks queue rows as handled and returns only the rows this caller actually
// claimed, so overlapping cron runs never announce the same show twice.
export async function claimPendingNewShows(
  queueIds: SelectNewShowQueue["id"][]
) {
  if (!queueIds.length) return [];
  return db
    .update(newShowQueue)
    .set({ notifiedAt: new Date() })
    .where(
      and(inArray(newShowQueue.id, queueIds), isNull(newShowQueue.notifiedAt))
    )
    .returning({ id: newShowQueue.id, showId: newShowQueue.showId });
}
