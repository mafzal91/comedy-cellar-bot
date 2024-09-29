import { eq, sql } from "drizzle-orm";
import { db } from "@core/database";
import { ApiResponse } from "@types/api";
import { show, InsertShow, SelectShow } from "@core/sql/show.sql";
import { SHOW_PREFIX } from "@core/common/constants";

const COMEDY_CELLAR_RESERVATION_URL =
  "https://www.comedycellar.com/reservation/?showid=";

const roomDictionary: Record<number, string> = {
  1: "MacDougal St",
  2: "Village Underground",
  3: "Fat Black Pussycat",
  5: "Unknown",
};

export class Show {
  id: number;
  time: string;
  description: string;
  forwardUrl: string;
  max: number;
  special: boolean;
  roomId: number;
  cover: number;
  note: string | null;
  mint: boolean;
  weekday: number;
  totalGuests: number;
  venueMin: number;
  venueMax: number;
  available: number;
  timestamp: number;

  constructor(data: ApiResponse.Show) {
    this.id = data.id;
    this.time = data.time;
    this.description = data.description;
    this.forwardUrl = data.forwardUrl;
    this.max = data.max;
    this.special = data.special;
    this.roomId = data.roomId;
    this.cover = data.cover;
    this.note = data.note;
    this.mint = data.mint;
    this.weekday = data.weekday;
    this.totalGuests = data.totalGuests;
    this.venueMin = data.venueMin;
    this.venueMax = data.venueMax;
    this.available = data.available;
    this.timestamp = data.timestamp;
  }

  get roomName() {
    return roomDictionary[this.roomId];
  }

  get showName() {
    const timePattern = /\d{1,2}:\d{2}?[ap]?m?/i;

    // Use replace() with the regex pattern to remove the time
    const stringWithoutTime = this.description.replace(timePattern, "").trim();
    return this.description;
  }

  get soldout() {
    return this.totalGuests >= this.max;
  }

  get occupancyRate() {
    return this.totalGuests / this.max;
  }

  get reservationUrl() {
    return `${COMEDY_CELLAR_RESERVATION_URL}${this.timestamp}`;
  }

  // Serialize the object to JSON
  toJSON() {
    return {
      id: this.id,
      time: this.time,
      showName: this.showName,
      description: this.description,
      forwardUrl: this.forwardUrl,
      // soldout from comedy cellar api is not accurate, so we use our own calculation
      soldout: this.soldout,
      occupancyRate: this.occupancyRate,
      max: this.max,
      special: this.special,
      roomId: this.roomId,
      cover: this.cover,
      note: this.note,
      mint: this.mint,
      weekday: this.weekday,
      totalGuests: this.totalGuests,
      venueMin: this.venueMin,
      venueMax: this.venueMax,
      available: this.available,
      timestamp: this.timestamp,
      roomName: this.roomName,
      reservationUrl: this.reservationUrl,
    };
  }
}

export function isShowExternalId(externalId) {
  return externalId.match(new RegExp(SHOW_PREFIX));
}

export function createShows(data: InsertShow[]) {
  return db
    .insert(show)
    .values(data)
    .onConflictDoUpdate({
      target: show.id,
      set: {
        description: sql.raw(`EXCLUDED."${show.description.name}"`),
        cover: sql.raw(`EXCLUDED."${show.cover.name}"`),
        note: sql.raw(`EXCLUDED."${show.note.name}"`),
        roomId: sql.raw(`EXCLUDED."${show.roomId.name}"`),
      },
    });
}

export function createShow(data: InsertShow) {
  return createShows([data]);
}

export async function getShows() {
  return db.select().from(show);
}

export async function getShowByExternalId(
  externalId: SelectShow["externalId"]
) {
  return db.select().from(show).where(eq(show.externalId, externalId));
}
