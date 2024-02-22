import { Config } from "sst/node/config";
import nodemailer from "nodemailer";

const { FROM_EMAIL, FROM_EMAIL_PW } = Config;

export async function sendEmail(message: string) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: FROM_EMAIL,
      pass: FROM_EMAIL_PW,
    },
  });

  await transporter.sendMail({
    from: FROM_EMAIL,
    to: FROM_EMAIL,
    subject: "Comedy Cellar: new reservation!",
    text: `Message: ${message}`,
  });

  return;
}
