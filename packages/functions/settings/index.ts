import { generateResponse } from "@core/common/generateResponse";
import { getAuthIdFromJwtClaim } from "@core/common/getAuthIdFromJwtClaim";
import { getUserByAuthId } from "@core/models/user";
import {
  applyNotificationSettings,
  notificationSettingsUpdateSchema,
  readNotificationSettings,
} from "@core/notificationSettings";

export async function get(_evt) {
  const authId = getAuthIdFromJwtClaim(_evt);

  if (!authId) {
    return generateResponse({
      statusCode: 400,
      body: { error: "You must be authenticated to access this resource" },
    });
  }

  const [user] = await getUserByAuthId(authId);

  if (!user) {
    return generateResponse({
      statusCode: 404,
      body: { error: "user not found" },
    });
  }

  return generateResponse({
    statusCode: 200,
    body: await readNotificationSettings(user.id),
  });
}

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

  if (!user) {
    return generateResponse({
      statusCode: 404,
      body: { error: "user not found" },
    });
  }

  const body = notificationSettingsUpdateSchema.safeParse(postBody);

  if (!body.success) {
    const error = body.error.format();
    return generateResponse({
      statusCode: 400,
      body: error,
    });
  }

  await applyNotificationSettings(user.id, body.data);

  return generateResponse({
    statusCode: 200,
    body: JSON.stringify({ ok: "ok" }),
  });
}
