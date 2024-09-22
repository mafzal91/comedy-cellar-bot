import nodemailer from "nodemailer";

export async function sendEmail(
  message: string,
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
    subject: "Comedy Cellar: new reservation!",
    text: `Message: ${message}`,
  });

  return;
}
