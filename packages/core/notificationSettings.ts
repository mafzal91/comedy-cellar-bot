import * as z from "zod";

import {
  getComicNotifications,
  upsertComicNotification,
} from "@core/models/comicNotification";
import {
  getShowNotification,
  upsertShowNotification,
} from "@core/models/showNotification";
import {
  getNewComicNotification,
  upsertNewComicNotification,
} from "@core/models/newComicNotification";
import {
  DEFAULT_FREQUENCY_MINUTES,
  isAllowedFrequencyMinutes,
} from "@core/common/notificationFrequency";
import { isComicExternalId } from "@core/models/comic";

// The notification-preferences read/write shared by the authenticated
// `/api/settings` routes and the token-authorized `/api/alerts/settings`
// routes (the "manage your settings" link in emails). Both surfaces expose the
// same shape so the frontend can render the same form for either.

const comicNotificationPayload = z
  .object({
    comicId: z.string().refine(isComicExternalId, {
      message: "Invalid Id: Comic Ids start with comic_",
    }),
    enabled: z.boolean(),
  })
  .strict()
  .required();

// The DB column stores an arbitrary interval in minutes (future-proofing), but
// the API only accepts the curated UI presets for now — so users can't set an
// off-menu cadence even though the storage layer could hold one.
const frequencyMinutes = z
  .number()
  .int()
  .refine(isAllowedFrequencyMinutes, {
    message: "frequencyMinutes must be one of the supported presets",
  })
  .optional();

const globalNotification = z.object({
  enabled: z.boolean(),
  frequencyMinutes,
});

export const notificationSettingsUpdateSchema = z
  .object({
    comicNotifications: z.array(comicNotificationPayload).optional(),
    showNotification: globalNotification.optional(),
    newComicNotification: globalNotification.optional(),
  })
  .default({ comicNotifications: [] });

export type NotificationSettingsUpdate = z.infer<
  typeof notificationSettingsUpdateSchema
>;

export async function readNotificationSettings(userId: number) {
  const [comicNotifications, showNotification, newComicNotification] =
    await Promise.all([
      getComicNotifications(userId),
      getShowNotification(userId),
      getNewComicNotification(userId),
    ]);

  return {
    comicNotifications: comicNotifications.map((i) => ({
      name: i.comic.name,
      comic: i.comic.img,
      comicId: i.comic.externalId,
      enabled: i.enabled,
    })),
    showNotification: {
      enabled: showNotification?.[0]?.enabled ?? false,
      frequencyMinutes:
        showNotification?.[0]?.frequencyMinutes ?? DEFAULT_FREQUENCY_MINUTES,
    },
    newComicNotification: {
      enabled: newComicNotification?.[0]?.enabled ?? false,
      frequencyMinutes:
        newComicNotification?.[0]?.frequencyMinutes ??
        DEFAULT_FREQUENCY_MINUTES,
    },
  };
}

export async function applyNotificationSettings(
  userId: number,
  data: NotificationSettingsUpdate
) {
  if (data.showNotification) {
    await upsertShowNotification({
      userId,
      enabled: data.showNotification.enabled,
      frequencyMinutes: data.showNotification.frequencyMinutes,
    });
  }

  if (data.newComicNotification) {
    await upsertNewComicNotification({
      userId,
      enabled: data.newComicNotification.enabled,
      frequencyMinutes: data.newComicNotification.frequencyMinutes,
    });
  }

  if (data.comicNotifications?.length) {
    // zod's `.required()` still infers optional keys here; narrow explicitly.
    const rows = data.comicNotifications
      .filter(
        (i): i is { comicId: string; enabled: boolean } =>
          typeof i.comicId === "string" && typeof i.enabled === "boolean"
      )
      .map((value) => ({ userId, ...value }));
    if (rows.length) await upsertComicNotification(rows);
  }
}
