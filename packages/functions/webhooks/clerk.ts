import { Resource } from "sst";
import {
  SessionJSON,
  UserJSON,
  WebhookEvent,
  createClerkClient,
} from "@clerk/backend";

import { verifyClerkWebhook } from "@core/verifyClerkWebhook";
import {
  createUser,
  deleteUserByAuthId,
  getUserByAuthId,
} from "@core/models/user";

/**
 * Handles the 'session created' webhook event by checking if the user exists
 * and creating a new user if necessary.
 *
 * @async
 * @function sessionCreated
 * @param {WebhookEvent} evt - The webhook event containing session data.
 * @returns {Promise<void>} Resolves when the user handling logic completes.
 */
async function sessionCreated(evt: WebhookEvent) {
  try {
    const { data } = evt as { data: SessionJSON };
    const { user_id: authId } = data;

    console.log("clerk user", { authId });
    const user = await getUserByAuthId(authId);
    console.log("db user", { user });
    if (user.length) return;

    const clerkClient = createClerkClient({
      secretKey: Resource.ClerkSecretKey.value,
    });
    const clerkUser = await clerkClient.users.getUser(authId);
    if (!clerkUser) return;

    const { emailAddress: email } = clerkUser.emailAddresses.find(
      (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId
    );

    await createUser({
      authId,
      email,
    });
  } catch (e) {
    console.error(e);
  }
}

/**
 * Handles the 'user created' webhook event by extracting user information
 * and creating a new user in the system.
 *
 * @async
 * @function userCreated
 * @param {WebhookEvent} evt - The webhook event containing user data.
 * @returns {Promise<void>} Resolves when the user creation process completes.
 */
async function userCreated(evt: WebhookEvent) {
  try {
    const { data } = evt as { data: UserJSON };
    const {
      id: authId,
      email_addresses: emailAddresses,
      primary_email_address_id: primaryEmailAddressId,
    } = data;

    const { email_address: email } = emailAddresses.find(
      (emailAddress) => emailAddress.id === primaryEmailAddressId
    );
    console.log({
      authId,
      email,
    });
    await createUser({
      authId,
      email,
    });
  } catch (e) {
    console.error(e);
  }
}

async function userDeleted(evt: WebhookEvent) {
  const { data } = evt as { data: UserJSON };
  const { id: authId } = data;

  await deleteUserByAuthId(authId);
}

export async function handler(_evt) {
  try {
    const webhookData = verifyClerkWebhook({
      headers: _evt.headers,
      body: _evt.body,
    });

    const { id } = webhookData.data;
    const eventType = webhookData.type;

    switch (eventType) {
      case "user.created":
        await userCreated(webhookData);
        break;
      case "user.deleted":
        // If a user deletes their account. Delete the user from the application db (it should cascade through any relations)
        await userDeleted(webhookData);
        break;
      case "session.created":
        // This is in the rare case where a user was created but is missing from the application's db
        await sessionCreated(webhookData);
        break;
      default:
        console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
        console.log("Webhook body:", _evt.body);
    }

    return { statusCode: 200 };
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: e.message }),
    };
  }
}
