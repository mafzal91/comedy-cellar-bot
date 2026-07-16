import { dbCreds, emailSecrets } from "./secrets";
import { email } from "./email";

// This cron scans for new shows
new sst.aws.Cron("Cron", {
  job: {
    handler: "packages/functions/cron/newShowCron.handler",
    link: [dbCreds.dbUrl, ...Object.values(emailSecrets), email],
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
    link: [dbCreds.dbUrl, ...Object.values(emailSecrets), email],
    environment: {
      IS_ACTIVE: $app.stage === "prod" ? "1" : "0",
      IS_CRON: "1",
    },
  },
  schedule: "cron(0 0/1 * * ? *)",
});

// This cron emails subscribers about batches of newly discovered shows
new sst.aws.Cron("ShowNotificationCron", {
  job: {
    handler: "packages/functions/cron/showNotificationCron.handler",
    link: [dbCreds.dbUrl, ...Object.values(emailSecrets), email],
    environment: {
      IS_ACTIVE: $app.stage === "prod" ? "1" : "0",
      IS_CRON: "1",
    },
  },
  schedule: "cron(0/15 * * * ? *)",
});

// This cron emails subscribers when a comic they follow is booked on a show
// that still has capacity. New/unproven feature: gated to an allowlist of
// emails via COMIC_NOTIFICATION_ALLOWED_EMAILS below (comma-separated) until
// it has a production track record. Empty = nobody receives it yet.
new sst.aws.Cron("ComicNotificationCron", {
  job: {
    handler: "packages/functions/cron/comicNotificationCron.handler",
    link: [dbCreds.dbUrl, ...Object.values(emailSecrets), email],
    environment: {
      IS_ACTIVE: $app.stage === "prod" ? "1" : "0",
      IS_CRON: "1",
      // e.g. "you@example.com,teammate@example.com" — fill in before relying
      // on this cron, then widen or remove once it's been proven out.
      COMIC_NOTIFICATION_ALLOWED_EMAILS: "",
    },
  },
  schedule: "cron(0/15 * * * ? *)",
});
