import { InsertComic, SelectComic, comic } from "@core/sql/comic.sql";
import {
  SQL,
  and,
  count,
  eq,
  getTableColumns,
  inArray,
  sql,
} from "drizzle-orm";
import { getLastShow, getUpcomingShow } from "./show";

import { COMIC_PREFIX } from "@core/common/constants";
import { act } from "@core/sql/act.sql";
import { db } from "@core/database";
import { mapOrderToDrizzle } from "@core/common/mapOrderToDrizzle";
import { show } from "@core/sql/show.sql";

function getComicWhereClause({ name }: { name?: string }): SQL[] {
  const where: SQL[] = [];

  if (name) {
    where.push(eq(comic.name, name));
  }

  return where;
}

export function isComicExternalId(externalId) {
  return externalId.match(new RegExp(COMIC_PREFIX));
}

export async function createComics(data: InsertComic[]) {
  return db.insert(comic).values(data).onConflictDoNothing({
    target: comic.name,
  });
}

export async function getComics({
  name,
  offset,
  limit,
  order,
}: {
  name?: string;
  offset?: number;
  limit?: number;
  order?: Record<string, 1 | -1>;
}): Promise<(SelectComic & { showCount: number })[]> {
  const orderBy = mapOrderToDrizzle(order, comic);
  const where = getComicWhereClause({ name });
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
    .where(and(...where))
    .groupBy(comic.id, comic.name)
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  const res = await query;
  return res;
}

export async function getComicsCount({ name }: { name?: string }) {
  const query = db.select({ count: count() }).from(comic);

  const results = await query;

  return results?.[0] ? results[0].count : 0;
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
