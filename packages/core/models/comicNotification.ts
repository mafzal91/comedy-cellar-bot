import { and, asc, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import { db } from "@core/database";
import {
  comicNotification,
  SelectComicNotification,
  InsertComicNotification,
} from "@core/sql/comicNotification.sql";
import { comic, SelectComic } from "@core/sql/comic.sql";
import { user } from "@core/sql/user.sql";
import { Resource } from "sst";

const SST_STAGE = Resource.App.stage;

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

// Everyone (for the current stage) who opted in to hear about any of the
// given comics being booked
export async function getComicNotificationRecipientsForComics(
  comicIds: SelectComic["id"][]
) {
  if (!comicIds.length) return [];
  return db
    .select({ email: user.email, comicId: comicNotification.comicId })
    .from(comicNotification)
    .innerJoin(user, eq(user.id, comicNotification.userId))
    .where(
      and(
        eq(comicNotification.enabled, true),
        inArray(comicNotification.comicId, comicIds),
        eq(user.stage, SST_STAGE)
      )
    );
}
