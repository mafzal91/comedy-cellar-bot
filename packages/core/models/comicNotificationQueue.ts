import { and, asc, eq, getTableColumns, inArray, isNull } from "drizzle-orm";
import { db } from "@core/database";
import {
  comicNotificationQueue,
  SelectComicNotificationQueue,
} from "@core/sql/comicNotificationQueue.sql";
import { act, SelectAct } from "@core/sql/act.sql";
import { show, SelectShow } from "@core/sql/show.sql";
import { room, SelectRoom } from "@core/sql/room.sql";
import { comic, SelectComic } from "@core/sql/comic.sql";

export type PendingComicAct = {
  queueId: SelectComicNotificationQueue["id"];
  queuedAt: SelectComicNotificationQueue["createdAt"];
  comicId: SelectComic["id"];
  comicName: SelectComic["name"];
  comicImg: SelectComic["img"];
  show: SelectShow;
  room: SelectRoom | null;
};

export function enqueueComicActs(actIds: SelectAct["id"][]) {
  if (!actIds.length) return Promise.resolve([]);
  return db
    .insert(comicNotificationQueue)
    .values(actIds.map((actId) => ({ actId })))
    .onConflictDoNothing({ target: comicNotificationQueue.actId })
    .returning({ id: comicNotificationQueue.id });
}

export async function getPendingComicActs(): Promise<PendingComicAct[]> {
  return db
    .select({
      queueId: comicNotificationQueue.id,
      queuedAt: comicNotificationQueue.createdAt,
      comicId: comic.id,
      comicName: comic.name,
      comicImg: comic.img,
      show: getTableColumns(show),
      room: getTableColumns(room),
    })
    .from(comicNotificationQueue)
    .innerJoin(act, eq(act.id, comicNotificationQueue.actId))
    .innerJoin(show, eq(show.id, act.showId))
    .innerJoin(comic, eq(comic.id, act.comicId))
    .leftJoin(room, eq(room.id, show.roomId))
    .where(isNull(comicNotificationQueue.notifiedAt))
    .orderBy(asc(show.timestamp));
}

// Marks queue rows as handled and returns only the rows this caller actually
// claimed, so overlapping cron runs never announce the same act twice.
export async function claimPendingComicActs(
  queueIds: SelectComicNotificationQueue["id"][]
) {
  if (!queueIds.length) return [];
  return db
    .update(comicNotificationQueue)
    .set({ notifiedAt: new Date() })
    .where(
      and(
        inArray(comicNotificationQueue.id, queueIds),
        isNull(comicNotificationQueue.notifiedAt)
      )
    )
    .returning({ id: comicNotificationQueue.id });
}
