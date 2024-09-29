import { InsertAct, act, SelectAct } from "@core/sql/act.sql";
import { ApiResponse } from "../../types/api";
import { db } from "@core/database";
import { eq } from "drizzle-orm";

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
