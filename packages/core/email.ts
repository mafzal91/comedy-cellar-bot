import { Resource } from "sst";
import nodemailer from "nodemailer";
const FromEmail = Resource.FromEmail.value;
const FromEmailPw = Resource.FromEmailPw.value;

function createTransporter() {
  return nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: FromEmail,
      pass: FromEmailPw,
    },
  });
}

export async function sendEmail({
  message,
  subject,
}: {
  message: string;
  subject: string;
}) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: FromEmail,
    to: FromEmail,
    subject,
    text: `Message: ${message}`,
  });

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
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `Comedy Cellar Bot <${FromEmail}>`,
    to,
    subject,
    html,
    text,
  });

  return;
}
