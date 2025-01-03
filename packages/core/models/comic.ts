import {
  asc,
  between,
  desc,
  eq,
  getTableColumns,
  inArray,
  sql,
} from "drizzle-orm";
import { db } from "@core/database";
import { comic, InsertComic, SelectComic } from "@core/sql/comic.sql";
import { COMIC_PREFIX } from "@core/common/constants";
import { getLastShow, getUpcomingShow } from "./show";
import { show } from "@core/sql/show.sql";
import { act } from "@core/sql/act.sql";

export function isComicExternalId(externalId) {
  return externalId.match(new RegExp(COMIC_PREFIX));
}

export async function createComics(data: InsertComic[]) {
  return db.insert(comic).values(data).onConflictDoNothing({
    target: comic.name,
  });
}

export async function getComics(): Promise<
  (SelectComic & { showCount: number })[]
> {
  const [[lastShow], [nextShow]] = await Promise.all([
    getLastShow(),
    getUpcomingShow(),
  ]);

  const lastShowTimestamp = lastShow.timestamp;
  const nextShowTimestamp = nextShow.timestamp;

  const query = db
    .select({
      ...getTableColumns(comic),
      showCount: sql<number>`COUNT(${show.id})`,
    })
    .from(comic)
    .leftJoin(act, eq(comic.id, act.comicId))
    .leftJoin(
      show,
      (s) =>
        sql`${act.showId} = ${show.id} AND ${show.timestamp} BETWEEN ${nextShowTimestamp} AND ${lastShowTimestamp}`
    )
    .groupBy(comic.id, comic.name)
    .orderBy(comic.id);

  const res = await query;
  return res;
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
