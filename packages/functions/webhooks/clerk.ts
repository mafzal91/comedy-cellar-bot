import { verifyClerkWebhook } from "@core/verifyClerkWebhook";
import { createUser } from "@core/models/user";
import { UserWebhookEvent, WebhookEvent } from "@clerk/backend";

async function userCreated(evt: WebhookEvent) {
  const { data } = evt;
  const { id: authId, email_addresses, primary } = data as UserWebhookEvent;
  // return createUser({
  //   authId,
  //   email,
  // });
}

export async function handler(_evt) {
  try {
    const webhookData = verifyClerkWebhook({
      headers: _evt.headers,
      body: _evt.body,
    });

    // Do something with the payload
    // For this guide, you simply log the payload to the console
    const { id } = webhookData.data;
    const eventType = webhookData.type;

    console.log(JSON.stringify(webhookData, null, 2));

    switch (eventType) {
      case eventType["user.created"]:
        await userCreated(webhookData);
      default:
        console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
      // console.log("Webhook body:", _evt.body);
    }

    return { statusCode: 200 };
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: e.message }),
    };
  }
}
