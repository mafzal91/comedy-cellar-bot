import { Resource } from "sst";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const client = new SESv2Client();
const FromAddress = `Comedy Cellar Calendar <notifications@${Resource.Email.sender}>`;
const AlertRecipient = Resource.AlertEmail.value;

export async function sendEmail({
  message,
  subject,
}: {
  message: string;
  subject: string;
}) {
  await client.send(
    new SendEmailCommand({
      FromEmailAddress: FromAddress,
      Destination: { ToAddresses: [AlertRecipient] },
      Content: {
        Simple: {
          Subject: { Data: subject },
          Body: { Text: { Data: `Message: ${message}` } },
        },
      },
    })
  );

  return;
}

export async function sendHtmlEmail({
  to,
  subject,
  html,
  text,
  unsubscribeUrl,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  // When provided, advertise one-click unsubscribe via RFC 8058 headers so
  // Gmail/Apple Mail show their own native "Unsubscribe" button. The same URL
  // (hit with POST) is what the button triggers.
  unsubscribeUrl?: string;
}) {
  const headers = unsubscribeUrl
    ? {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      }
    : undefined;

  await client.send(
    new SendEmailCommand({
      FromEmailAddress: FromAddress,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject },
          Headers: headers
            ? Object.entries(headers).map(([Name, Value]) => ({ Name, Value }))
            : undefined,
          Body: {
            Html: { Data: html },
            Text: { Data: text },
          },
        },
      },
    })
  );

  return;
}
