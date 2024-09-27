import { text, serial, varchar, timestamp, pgTable } from "drizzle-orm/pg-core";
import { createExternalId } from "../common/createExternalId";
import { COMIC_PREFIX } from "../common/constants";

export const comic = pgTable("comic", {
  id: serial("id").notNull().primaryKey(),
  externalId: varchar("externalId", { length: 128 })
    .$defaultFn(() => createExternalId(COMIC_PREFIX))
    .notNull()
    .unique(),
  img: text("img").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type SelectComic = typeof comic.$inferSelect;
export type InsertComic = typeof comic.$inferInsert;
