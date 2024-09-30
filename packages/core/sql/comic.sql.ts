import {
  text,
  serial,
  varchar,
  timestamp,
  pgTable,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createExternalId } from "../common/createExternalId";
import { COMIC_PREFIX } from "../common/constants";
import { relations, sql } from "drizzle-orm";
import { act } from "./act.sql";

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
}));

export type SelectComic = typeof comic.$inferSelect;
export type InsertComic = typeof comic.$inferInsert &
  Partial<Pick<SelectComic, "website" | "description">>;

export const isValidComic = (comic: any): comic is InsertComic => {
  return !!comic.name && !!comic.img;
};
