// Sends a one-off test email through SES using the deployed Email/AlertEmail
// resources, without going through any app code.
//
// Usage: npx sst shell --stage <stage> node scripts/test-email.mjs
import { Resource } from "sst";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const client = new SESv2Client();

await client.send(
  new SendEmailCommand({
    FromEmailAddress: `Comedy Cellar Bot <notifications@${Resource.Email.sender}>`,
    Destination: { ToAddresses: [Resource.AlertEmail.value] },
    Content: {
      Simple: {
        Subject: { Data: "SES test" },
        Body: { Text: { Data: "It works!" } },
      },
    },
  })
);

console.log("sent");
