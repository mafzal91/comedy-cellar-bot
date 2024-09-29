import { InsertAct, act, SelectAct } from "@core/sql/act.sql";
import { PgDialect } from "drizzle-orm/pg-core";

import { ApiResponse } from "../../types/api";
import { db } from "@core/database";
import { eq, sql } from "drizzle-orm";
import { show } from "@core/sql/show.sql";
import { comic } from "@core/sql/comic.sql";
const pgDialect = new PgDialect();

const COMEDY_CELLAR_URL = "https://www.comedycellar.com";

// TODO: rename to act
export class Lineup {
  timestamp?: number;
  reservationUrl?: string;
  acts: {
    img?: string;
    name?: string;
    description?: string;
    website?: string;
  }[];

  constructor(data: ApiResponse.LineUp[0]) {
    this.timestamp = data.timestamp;
    this.reservationUrl = `${COMEDY_CELLAR_URL}/${data.reservationUrl}`;
    this.acts = data.acts.map((act) => ({
      ...act,
      img: `${COMEDY_CELLAR_URL}/${act.img}`,
      description: act.description?.toLowerCase() || "",
    }));
  }

  // Serialize the object to JSON
  toJSON() {
    return {
      timestamp: this.timestamp,
      reservationUrl: this.reservationUrl,
      acts: this.acts,
    };
  }
}

export function createActs(data: InsertAct[]) {
  return db
    .insert(act)
    .values(data)
    .onConflictDoNothing({
      target: [act.showId, act.comicId],
    });
}

export function createAct(data: InsertAct) {
  return createActs([data]);
}

export async function getActsByShowId(showId: SelectAct["showId"]) {
  return db.select().from(act).where(eq(act.showId, showId));
}

export async function getActsByComicId(comicId: SelectAct["showId"]) {
  return db.select().from(act).where(eq(act.comicId, comicId));
}

export async function getLineupByExternalId(
  externalId: SelectAct["externalId"]
) {
  return db.select().from(act).where(eq(act.externalId, externalId));
}

// WIP
// export async function createActsFromRawData({
//   timestamp,
//   comicName,
// }: {
//   timestamp: number;
//   comicName: string[];
// }) {
//   const query = sql`INSERT INTO ${act} (${act.comicId.name}, ${act.showId.name}) SELECT ${comic.id}, ${show.id} FROM ${show} JOIN ${comic} ON ${comic.name} IN ${comicName} WHERE ${show.timestamp} = ${timestamp}`;
//   console.log(pgDialect.sqlToQuery(query));

//   return db.insert()

//   // return null;
//   return db.execute(query);
// }
