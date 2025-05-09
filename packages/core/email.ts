import { Resource } from "sst";
import nodemailer from "nodemailer";
const FromEmail = Resource.FromEmail.value;
const FromEmailPw = Resource.FromEmailPw.value;

export async function sendEmail({
  message,
  html,
  subject,
}: {
  message: string;
  html?: string;
  subject: string;
}) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: FromEmail,
      pass: FromEmailPw,
    },
  });

  await transporter.sendMail({
    from: FromEmail,
    to: FromEmail,
    subject,
    ...(html ? { html } : { text: `Message: ${message}` }),
  });

  return;
}
