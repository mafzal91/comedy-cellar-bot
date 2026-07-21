import { and, eq } from "drizzle-orm";
import { db } from "@core/database";
import {
  newComicNotification,
  SelectNewComicNotification,
  InsertNewComicNotification,
} from "@core/sql/newComicNotification.sql";
import { user } from "@core/sql/user.sql";
import { Resource } from "sst";

const SST_STAGE = Resource.App.stage;

export async function upsertNewComicNotification(
  data: InsertNewComicNotification
) {
  return db
    .insert(newComicNotification)
    .values(data)
    .onConflictDoUpdate({
      target: newComicNotification.userId,
      set: {
        enabled: data.enabled ?? false,
      },
    });
}

export async function getNewComicNotification(
  userId: SelectNewComicNotification["userId"]
) {
  return db
    .select()
    .from(newComicNotification)
    .where(eq(newComicNotification.userId, userId));
}

// Everyone (for the current stage) who opted in to hear about new comics
export async function getNewComicNotificationRecipients() {
  return db
    .select({ email: user.email })
    .from(newComicNotification)
    .innerJoin(user, eq(user.id, newComicNotification.userId))
    .where(
      and(eq(newComicNotification.enabled, true), eq(user.stage, SST_STAGE))
    );
}
