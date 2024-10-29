import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@core/database";
import {
  showNotification,
  SelectShowNotification,
  InsertShowNotification,
} from "@core/sql/showNotification.sql";

export async function upsertShowNotification(data: InsertShowNotification) {
  return db
    .insert(showNotification)
    .values(data)
    .onConflictDoUpdate({
      target: showNotification.userId,
      set: {
        enabled: data.enabled ?? false,
      },
    });
}

export async function getShowNotification(
  userId: SelectShowNotification["id"]
) {
  return db
    .select()
    .from(showNotification)
    .where(eq(showNotification.userId, userId));
}
