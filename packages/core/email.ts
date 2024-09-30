import nodemailer from "nodemailer";

export async function sendEmail(
  {
    message,
    subject,
  }: {
    message: string;
    subject: string;
  },
  {
    FromEmail,
    FromEmailPw,
  }: {
    FromEmail: string;
    FromEmailPw: string;
  }
) {
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
    text: `Message: ${message}`,
  });

  return;
}
