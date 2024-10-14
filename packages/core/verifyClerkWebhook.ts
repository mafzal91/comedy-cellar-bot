import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/backend";

export function verifyClerkWebhook({
  headers,
  body,
}: {
  headers: Record<string, string>;
  body: string;
}): WebhookEvent {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
  const WEBHOOK_SECRET = "whsec_w4TiWSbCg4xXfQaXrF6SLAWFgW7rD2aU";

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = headers;
  const svix_id = headerPayload["svix-id"];
  const svix_timestamp = headerPayload["svix-timestamp"];
  const svix_signature = headerPayload["svix-signature"];

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw new Error("Missing Required headers");
  }

  // Get the body
  const stringifyBody = body;

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(stringifyBody, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    return evt;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    throw new Error("Error verifying webhook");
  }
}
