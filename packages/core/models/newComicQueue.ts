import { and, asc, eq, getTableColumns, inArray, isNull } from "drizzle-orm";
import { db } from "@core/database";
import {
  newComicQueue,
  SelectNewComicQueue,
} from "@core/sql/newComicQueue.sql";
import { comic, SelectComic } from "@core/sql/comic.sql";

export type PendingNewComic = {
  queueId: SelectNewComicQueue["id"];
  queuedAt: SelectNewComicQueue["createdAt"];
  comic: SelectComic;
};

export function enqueueNewComics(comicIds: SelectComic["id"][]) {
  if (!comicIds.length) return Promise.resolve([]);
  return db
    .insert(newComicQueue)
    .values(comicIds.map((comicId) => ({ comicId })))
    .onConflictDoNothing({ target: newComicQueue.comicId })
    .returning({ id: newComicQueue.id });
}

export async function getPendingNewComics(): Promise<PendingNewComic[]> {
  return db
    .select({
      queueId: newComicQueue.id,
      queuedAt: newComicQueue.createdAt,
      comic: getTableColumns(comic),
    })
    .from(newComicQueue)
    .innerJoin(comic, eq(comic.id, newComicQueue.comicId))
    .where(isNull(newComicQueue.notifiedAt))
    .orderBy(asc(newComicQueue.createdAt));
}

// Marks queue rows as handled and returns only the rows this caller actually
// claimed, so overlapping cron runs never announce the same comic twice.
export async function claimPendingNewComics(
  queueIds: SelectNewComicQueue["id"][]
) {
  if (!queueIds.length) return [];
  return db
    .update(newComicQueue)
    .set({ notifiedAt: new Date() })
    .where(
      and(inArray(newComicQueue.id, queueIds), isNull(newComicQueue.notifiedAt))
    )
    .returning({ id: newComicQueue.id, comicId: newComicQueue.comicId });
}
