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
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  await client.send(
    new SendEmailCommand({
      FromEmailAddress: FromAddress,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject },
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
