const emailSecrets = {
  fromEmail: new sst.Secret("FromEmail"),
  fromEmailPw: new sst.Secret("FromEmailPw"),
};
const dbCreds = {
  dbUrl: new sst.Secret("DbUrl"),
};
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

api.route("GET /", {
  handler: `${functionDir}/index.handler`,
});

api.route("GET /api/health", {
  handler: `${functionDir}/health.handler`,
});

// ---- SHOWS -----

api.route("GET /api/shows/scan", {
  handler: `${functionDir}/shows/index.scanShows`,
  link: [dbCreds.dbUrl],
});

api.route("GET /api/shows", {
  handler: `${functionDir}/shows/index.listShows`,
  link: [dbCreds.dbUrl],
});

api.route("GET /api/shows/{timestamp}", {
  handler: `${functionDir}/shows/index.getShow`,
});

// ---- Line Ups -----

api.route("GET /api/line-up", {
  handler: `${functionDir}/lineUp.handler`,
});

// ---- Reservations -----

api.route("POST /api/reservation/{timestamp}", {
  link: Object.values(emailSecrets),
  handler: `${functionDir}/reservation.create`,
  environment: {
    STAGE: $app.stage,
  },
});

// ---- Comics -----

api.route("GET /api/comics", {
  handler: `${functionDir}/comic.list`,
});

api.route("GET /api/comics/{externalId}", {
  handler: `${functionDir}/comic.get`,
});

export default api;
