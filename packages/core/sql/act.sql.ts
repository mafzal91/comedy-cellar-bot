import {
  serial,
  varchar,
  timestamp,
  pgTable,
  integer,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";
import { createExternalId } from "../common/createExternalId";
import { ACT_PREFIX } from "../common/constants";
import { show } from "./show.sql";
import { comic } from "./comic.sql";
import { relations } from "drizzle-orm";

// An act is a many to many relational table between comics and shows. a comic can have many shows and a show can have many comics
export const act = pgTable(
  "act",
  {
    id: serial("id").notNull().primaryKey(),
    externalId: varchar("externalId", { length: 128 })
      .$defaultFn(() => createExternalId(ACT_PREFIX))
      .notNull()
      .unique(),
    showId: integer("showId")
      .references(() => show.id)
      .notNull(),
    comicId: integer("comicId")
      .references(() => comic.id)
      .notNull(),
    enabled: boolean("enabled"),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    uniqueComicShow: uniqueIndex("uniqueComicShow").on(
      table.comicId,
      table.showId
    ),
  })
);

export const actRelations = relations(act, ({ one }) => ({
  show: one(show, {
    fields: [act.showId],
    references: [show.id],
  }),
  comic: one(comic, {
    fields: [act.comicId],
    references: [comic.id],
  }),
}));

export type SelectAct = typeof act.$inferSelect;
export type InsertAct = typeof act.$inferInsert;
