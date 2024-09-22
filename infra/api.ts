const emailSecrets = {
  fromEmail: new sst.Secret("FromEmail"),
  fromEmailPw: new sst.Secret("FromEmailPw"),
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

api.route("GET /api/shows/scan", {
  handler: `${functionDir}/shows.scanShows`,
});

api.route("GET /api/shows", {
  handler: `${functionDir}/shows.listShows`,
});

api.route("GET /api/shows/{timestamp}", {
  handler: `${functionDir}/shows.getShow`,
});

api.route("GET /api/line-up", {
  handler: `${functionDir}/lineUp.handler`,
});

api.route("GET /api/health", {
  handler: `${functionDir}/health.health`,
});

api.route("POST /api/reservation/{timestamp}", {
  link: Object.values(emailSecrets),
  handler: `${functionDir}/reservation.create`,
  environment: {
    STAGE: $app.stage,
  },
});

export default api;
