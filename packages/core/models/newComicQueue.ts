import { asc, eq, getTableColumns, gte, lt } from "drizzle-orm";
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

// Comics queued more than this long ago are dropped. Must comfortably exceed
// the longest cadence (monthly, 30 days) so a monthly subscriber never misses a
// comic that was queued between two of their digests.
export const COMIC_QUEUE_RETENTION_DAYS = 45;

export function enqueueNewComics(comicIds: SelectComic["id"][]) {
  if (!comicIds.length) return Promise.resolve([]);
  return db
    .insert(newComicQueue)
    .values(comicIds.map((comicId) => ({ comicId })))
    .onConflictDoNothing({ target: newComicQueue.comicId })
    .returning({ id: newComicQueue.id });
}

// Comics still within the retention window, cadence-agnostic. Rows are retained
// (not cleared once announced) so weekly/monthly subscribers can still receive
// a comic that "immediately" subscribers already saw — per-user delivery is
// gated by each subscriber's cursor, not by a global notifiedAt flag.
export async function getPendingNewComics(
  now: Date = new Date()
): Promise<PendingNewComic[]> {
  const cutoff = new Date(
    now.getTime() - COMIC_QUEUE_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );
  return db
    .select({
      queueId: newComicQueue.id,
      queuedAt: newComicQueue.createdAt,
      comic: getTableColumns(comic),
    })
    .from(newComicQueue)
    .innerJoin(comic, eq(comic.id, newComicQueue.comicId))
    .where(gte(newComicQueue.createdAt, cutoff))
    .orderBy(asc(newComicQueue.createdAt));
}

// Drop comic queue rows older than the retention window to keep the table
// bounded; nothing needs them once every cadence has had a chance to send.
export async function pruneOldComics(now: Date = new Date()) {
  const cutoff = new Date(
    now.getTime() - COMIC_QUEUE_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );
  await db.delete(newComicQueue).where(lt(newComicQueue.createdAt, cutoff));
}
