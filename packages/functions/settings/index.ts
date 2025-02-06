import * as z from "zod";

import {
  getComicNotifications,
  upsertComicNotification,
} from "@core/models/comicNotification";
import {
  getShowNotification,
  upsertShowNotification,
} from "@core/models/showNotification";

import { generateResponse } from "@core/common/generateResponse";
import { getAuthIdFromJwtClaim } from "@core/common/getAuthIdFromJwtClaim";
import { getUserByAuthId } from "@core/models/user";
import { isComicExternalId } from "@core/models/comic";
import qs from "qs";

export async function get(_evt) {
  const queryStringParameters = qs.parse(_evt.rawQueryString);

  const authId = getAuthIdFromJwtClaim(_evt);

  if (!authId) {
    return generateResponse({
      statusCode: 400,
      body: { error: "You must be authenticated to access this resource" },
    });
  }

  const [user] = await getUserByAuthId(authId);

  const queryValidationSchema = z
    .object({
      comicId: z
        .string()
        .refine(isComicExternalId, {
          message: "Invalid Id: Comic Ids start with comic_",
        })
        .optional(),
      offset: z.coerce.number().min(0).default(0),
      limit: z.coerce.number().min(1).max(100).default(20),
    })
    .default({
      offset: 0,
      limit: 20,
    });

  const query = queryValidationSchema.safeParse(queryStringParameters);

  const [comicNotifications, showNotification] = await Promise.all([
    getComicNotifications(user.id),
    getShowNotification(user.id),
  ]);

  const mappedComicNotification = comicNotifications.map((i) => ({
    name: i.comic.name,
    comic: i.comic.img,
    comicId: i.comic.externalId,
    enabled: i.enabled,
  }));

  if (!query.success) {
    const error = query.error.format();
    return generateResponse({
      statusCode: 400,
      body: error,
    });
  }

  return generateResponse({
    statusCode: 200,
    body: {
      comicNotifications: mappedComicNotification,
      showNotification: {
        enabled: showNotification?.[0]?.enabled ?? false,
      },
    },
  });
}

// TODO: move this somewhere else
const comicNotificationPayload = z
  .object({
    comicId: z.string().refine(isComicExternalId, {
      message: "Invalid Id: Comic Ids start with comic_",
    }),
    enabled: z.boolean(),
  })
  .strict()
  .required();
const showNotification = z.object({
  enabled: z.boolean(),
});

export async function update(_evt) {
  const postBody = JSON.parse(_evt.body);

  const authId = getAuthIdFromJwtClaim(_evt);

  if (!authId) {
    return generateResponse({
      statusCode: 400,
      body: { error: "user not found" },
    });
  }
  const [user] = await getUserByAuthId(authId);

  const bodyValidationSchema = z
    .object({
      comicNotifications: z.array(comicNotificationPayload).optional(),
      showNotification: showNotification.optional(),
    })
    .default({
      comicNotifications: [],
      showNotification: null,
    });

  const body = bodyValidationSchema.safeParse(postBody);

  if (!body.success) {
    const error = body.error.format();
    return generateResponse({
      statusCode: 400,
      body: error,
    });
  }

  if (body.data.showNotification) {
    const { showNotification } = body.data;
    await upsertShowNotification({
      userId: user.id,
      enabled: showNotification.enabled,
    });
  }

  if (body.data.comicNotifications?.length) {
    const { comicNotifications } = body.data;
    const mappedComicNotifications = comicNotifications
      .filter(
        (i): i is { comicId: string; enabled: boolean } =>
          i.comicId !== undefined && typeof i.enabled === "boolean"
      )
      .map((value) => ({
        userId: user.id,
        ...value,
      }));
    await upsertComicNotification(mappedComicNotifications);
  }

  return generateResponse({
    statusCode: 200,
    body: JSON.stringify({ ok: "ok" }),
  });
}
