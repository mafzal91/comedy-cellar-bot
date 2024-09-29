import { text, serial, varchar, timestamp, pgTable } from "drizzle-orm/pg-core";
import { createExternalId } from "../common/createExternalId";
import { COMIC_PREFIX } from "../common/constants";
import { Comic } from "@types/database";

export const comic = pgTable("comic", {
  id: serial("id").notNull().primaryKey(),
  externalId: varchar("externalId", { length: 128 })
    .$defaultFn(() => createExternalId(COMIC_PREFIX))
    .notNull()
    .unique(),
  img: text("img").notNull(),
  name: text("name").notNull().unique(),
  description: text("description"),
  website: text("website"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type SelectComic = typeof comic.$inferSelect;
export type InsertComic = typeof comic.$inferInsert;

export const isValidComic = (comic: any): comic is Comic => {
  return !!comic.name && !!comic.img;
};
