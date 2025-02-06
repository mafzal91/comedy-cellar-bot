import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

import { COMIC_PREFIX } from "../common/constants";
import { act } from "./act.sql";
import { comicNotification } from "./comicNotification.sql";
import { comicToUser } from "./comicToUser.sql";
import { createExternalId } from "../common/createExternalId";

export const comic = pgTable(
  "comic",
  {
    id: serial("id").notNull().primaryKey(),
    externalId: varchar("externalId", { length: 128 })
      .$defaultFn(() => createExternalId(COMIC_PREFIX))
      .notNull()
      .unique(),
    img: text("img").notNull(),
    name: text("name").notNull().unique(),
    description: text("description"),
    website: text("website"),
    enabled: boolean("enabled"),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    nameUniqueIndex: uniqueIndex("nameUniqueIndex").on(
      sql`lower(${table.name})`
    ),
  })
);

export const comicRelations = relations(comic, ({ many }) => ({
  acts: many(act),
  comicNotifications: many(comicNotification),
  comicToUsers: many(comicToUser),
}));

export type SelectComic = typeof comic.$inferSelect;
export type InsertComic = typeof comic.$inferInsert &
  Partial<Pick<SelectComic, "website" | "description">>;

export const isValidComic = (comic: any): comic is InsertComic => {
  return !!comic.name && !!comic.img;
};
