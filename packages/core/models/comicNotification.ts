import { asc, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import { db } from "@core/database";
import {
  comicNotification,
  SelectComicNotification,
  InsertComicNotification,
} from "@core/sql/comicNotification.sql";
import { comic, SelectComic } from "@core/sql/comic.sql";

type ComicMap = {
  [key: string]: number;
};

type OverrideInsertComicNotification = Omit<
  InsertComicNotification,
  "comicId"
> & {
  comicId: SelectComic["externalId"]; // should start with comic_*
};

export async function upsertComicNotification(
  data: OverrideInsertComicNotification[]
) {
  const externalComicIds = data.map((i) => i.comicId);
  const comicIds = await db
    .select()
    .from(comic)
    .where(inArray(comic.externalId, externalComicIds));

  // @ts-ignore
  const comicIdToIdMap = comicIds.reduce<ComicMap>(
    (acc: ComicMap, comic: SelectComic) => {
      acc[comic.externalId] = comic.id;
      return acc;
    },
    {}
  );

  const mappedData = data.map((item) => ({
    userId: item.userId,
    comicId: comicIdToIdMap[item.comicId],
    enabled: item.enabled,
  }));

  return db
    .insert(comicNotification)
    .values(mappedData)
    .onConflictDoUpdate({
      target: [comicNotification.userId, comicNotification.comicId],
      set: {
        // @ts-ignore
        enabled: sql.raw(`excluded.enabled`),
      },
    });
}

export async function getComicNotifications(
  userId: SelectComicNotification["id"]
) {
  return db
    .select({
      ...getTableColumns(comicNotification),
      comic: getTableColumns(comic),
    })
    .from(comicNotification)
    .where(eq(comicNotification.userId, userId))
    .innerJoin(comic, eq(comic.id, comicNotification.comicId));
}
