import { clerkCreds, dbCreds, emailSecrets } from "./secrets";
import { email } from "./email";

import config from "./config";
const functionDir = `packages/functions`;

const prodDomain = {
  domain: {
    name: "comedycellar-api.mafz.al",
    dns: sst.cloudflare.dns({
      zone: "b94d6748e8554bed2a3eae31cc65c81b",
    }),
  },
};

const api = new sst.aws.ApiGatewayV2("Api", {
  ...($app.stage === "prod" ? prodDomain : {}),
});

const authorizer = api.addAuthorizer({
  name: "myClerkAuthorizer",
  jwt: {
    issuer: config.clerkFrontendApi,
    audiences: ["ClerkJwtAuthorizer"],
  },
});

const authConfig = {
  jwt: {
    authorizer: authorizer.id,
  },
};

api.route("GET /", {
  handler: `${functionDir}/index.handler`,
});

api.route("GET /sync-shows", {
  handler: `${functionDir}/cron/syncCron.handler`,
  link: [dbCreds.dbUrl, ...Object.values(emailSecrets), email],
});

api.route("GET /api/health", {
  handler: `${functionDir}/health.handler`,
});

api.route("GET /api/frontier", {
  handler: `${functionDir}/frontier.handler`,
});

// ---- SHOWS -----

api.route("GET /api/shows/scan", {
  handler: `${functionDir}/shows/index.scanShows`,
  link: [dbCreds.dbUrl],
});

// handleShowDetails sends per-new-show alert emails, so every route whose
// handler ingests shows needs the email identity + AlertEmail linked
api.route("GET /api/shows", {
  handler: `${functionDir}/shows/index.listShows`,
  link: [dbCreds.dbUrl, ...Object.values(emailSecrets), email],
});

// listShowsLocal itself doesn't send email, but this handler file is bundled
// together with listShows/getShow, which pull in email.ts (reads
// Resource.Email/AlertEmail at module load), so the link is required here too.
api.route("GET /api/shows/new", {
  handler: `${functionDir}/shows/index.listShowsLocal`,
  link: [dbCreds.dbUrl, ...Object.values(emailSecrets), email],
});

api.route("GET /api/shows/{timestamp}", {
  handler: `${functionDir}/shows/index.getShow`,
  link: [dbCreds.dbUrl, ...Object.values(emailSecrets), email],
});

// ---- Line Ups -----

// handleLineUp sends a per-new-comic alert email (email.ts reads
// Resource.Email/AlertEmail at module load), so this route needs the email
// identity + AlertEmail linked, same as the show-ingesting routes above.
api.route("GET /api/line-up", {
  handler: `${functionDir}/lineUp.handler`,
  link: [dbCreds.dbUrl, ...Object.values(emailSecrets), email],
});

// ---- Reservations -----

api.route("POST /api/reservation/{timestamp}", {
  link: [dbCreds.dbUrl, ...Object.values(emailSecrets), email],
  handler: `${functionDir}/reservation.create`,
  environment: {
    STAGE: $app.stage,
  },
});

// ---- Comics -----

api.route("GET /api/comics", {
  handler: `${functionDir}/comics/index.list`,
  link: [dbCreds.dbUrl],
});

api.route("GET /api/comics/{externalId}", {
  handler: `${functionDir}/comics/index.get`,
  link: [dbCreds.dbUrl, ...Object.values(clerkCreds)],
});

// ---- Notification -----

api.route(
  "GET /api/settings",
  {
    handler: `${functionDir}/settings/index.get`,
    link: [dbCreds.dbUrl],
  },
  {
    auth: authConfig,
  }
);

api.route(
  "POST /api/settings",
  {
    handler: `${functionDir}/settings/index.update`,
    link: [dbCreds.dbUrl],
  },
  {
    auth: authConfig,
  }
);

// ---- Webhook -----

api.route("POST /webhook/clerk", {
  handler: `${functionDir}/webhooks/clerk.handler`,
  link: [dbCreds.dbUrl, ...Object.values(clerkCreds)],
});

export default api;
