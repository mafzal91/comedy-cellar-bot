import { dbCreds, emailSecrets } from "./secrets";

// This cron scans for new shows
new sst.aws.Cron("Cron", {
  job: {
    handler: "packages/functions/cron/newShowCron.handler",
    link: [dbCreds.dbUrl, ...Object.values(emailSecrets)],
    environment: {
      IS_ACTIVE: $app.stage === "prod" ? "1" : "0",
      IS_CRON: "1",
    },
  },
  schedule: "cron(0 0/6 * * ? *)",
});

// This cron syncs existing shows
new sst.aws.Cron("SyncCron", {
  job: {
    handler: "packages/functions/cron/syncCron.handler",
    link: [dbCreds.dbUrl, ...Object.values(emailSecrets)],
    environment: {
      IS_ACTIVE: $app.stage === "prod" ? "1" : "0",
      IS_CRON: "1",
    },
  },
  schedule: "cron(0 0/1 * * ? *)",
});
