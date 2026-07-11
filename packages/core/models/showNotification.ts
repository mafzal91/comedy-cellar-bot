import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@core/database";
import {
  showNotification,
  SelectShowNotification,
  InsertShowNotification,
} from "@core/sql/showNotification.sql";
import { user } from "@core/sql/user.sql";
import { Resource } from "sst";

const SST_STAGE = Resource.App.stage;

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

// Everyone (for the current stage) who opted in to hear about new shows
export async function getShowNotificationRecipients() {
  return db
    .select({ email: user.email })
    .from(showNotification)
    .innerJoin(user, eq(user.id, showNotification.userId))
    .where(
      and(eq(showNotification.enabled, true), eq(user.stage, SST_STAGE))
    );
}
