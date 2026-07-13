// Domain identity for sending mail (SES). Sending address is
// notifications@mail.comedycellar.mafz.al — see packages/core/email.ts.
export const email =
  $app.stage === "mohammadafzal"
    ? new sst.aws.Email("Email", {
        sender: "mail.comedycellar.mafz.al",
        dns: sst.cloudflare.dns({ zone: "b94d6748e8554bed2a3eae31cc65c81b" }),
      })
    : sst.aws.Email.get("Email", "mail.comedycellar.mafz.al");
