import { dbCreds, emailSecrets } from "./secrets";

new sst.aws.Cron("Cron", {
  job: {
    handler: "packages/functions/cron/showCron.handler",
    link: [dbCreds.dbUrl, ...Object.values(emailSecrets)],
    environment: {
      IS_ACTIVE: $app.stage === "prod" ? "1" : "0",
      IS_CRON: "1",
    },
  },
  schedule: "rate(1 hour)",
});
