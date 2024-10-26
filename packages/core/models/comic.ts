import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@core/database";
import { comic, InsertComic, SelectComic } from "@core/sql/comic.sql";
import { COMIC_PREFIX } from "@core/common/constants";

export function isComicExternalId(externalId) {
  return externalId.match(new RegExp(COMIC_PREFIX));
}

export async function createComics(data: InsertComic[]) {
  return db.insert(comic).values(data).onConflictDoNothing({
    target: comic.name,
  });
}

export async function getComics() {
  return db
    .select()
    .from(comic)
    .orderBy(sql`lower(${comic.name}) ASC`);
}

export async function getComicByExternalId(
  externalId: SelectComic["externalId"]
) {
  return db.select().from(comic).where(eq(comic.externalId, externalId));
}

export async function getComicByName(name: SelectComic["name"]) {
  return getComicsByNames([name]);
}

export async function getComicsByNames(names: SelectComic["name"][]) {
  return db.select().from(comic).where(inArray(comic.name, names));
}
