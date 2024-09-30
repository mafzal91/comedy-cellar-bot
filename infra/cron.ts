import { dbCreds, emailSecrets } from "./secrets";

new sst.aws.Cron("Cron", {
  job: {
    handler: "packages/functions/cron/showCron.handler",
    link: [dbCreds.dbUrl, ...Object.values(emailSecrets)],
  },
  schedule: "rate(1 hour)",
});
