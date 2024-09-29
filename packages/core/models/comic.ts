import { eq } from "drizzle-orm";
import { db } from "@core/database";
import { comic, InsertComic, SelectComic } from "@core/sql/comic.sql";
import { COMIC_PREFIX } from "@core/common/constants";

export function isComicExternalId(externalId) {
  return externalId.match(new RegExp(COMIC_PREFIX));
}

export async function createComics(
  data: (InsertComic & { website?: string; description?: string })[]
) {
  return db.insert(comic).values(data).onConflictDoNothing({
    target: comic.name,
  });
}

export async function getComics() {
  return db.select().from(comic);
}

export async function getComicByExternalId(
  externalId: SelectComic["externalId"]
) {
  return db.select().from(comic).where(eq(comic.externalId, externalId));
}
