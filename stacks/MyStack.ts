import { Api, Cron, Config, StackContext } from "sst/constructs";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";

const certArn =
  "arn:aws:acm:us-east-1:824714483059:certificate/9d410133-2ddc-4260-807e-8c7eeb279592";

export function API({ app, stack }: StackContext) {
  // new Cron(stack, "Cron", {
  //   schedule: "cron(*/10 * * * ? *)",
  //   job: "packages/functions/src/cron.handler",
  // });
  const stage = app.stage;
  const FROM_EMAIL = new Config.Secret(stack, "FROM_EMAIL");
  const FROM_EMAIL_PW = new Config.Secret(stack, "FROM_EMAIL_PW");

  const customDomain = {
    customDomain: {
      domainName: "comedycellar-api.mafz.al",
      isExternalDomain: true,
      cdk: {
        certificate: Certificate.fromCertificateArn(stack, "MyCert", certArn),
      },
    },
  };

  // Configure Sentry
  if (!app.local) {
    const sentry = LayerVersion.fromLayerVersionArn(
      stack,
      "SentryLayer",
      `arn:aws:lambda:${app.region}:943013980633:layer:SentryNodeServerlessSDK:35`
    );

    stack.addDefaultFunctionLayers([sentry]);
    stack.addDefaultFunctionEnv({
      SENTRY_DSN: process.env.SENTRY_DSN!,
      SENTRY_TRACES_SAMPLE_RATE: "1.0",
      NODE_OPTIONS: "-r @sentry/serverless/dist/awslambda-auto",
    });
  }

  const apiRoutes = {
    "GET /api/shows/scan": "packages/functions/src/api/shows.scanShows", // Get shows over the next x days
    "GET /api/shows": "packages/functions/src/api/shows.listShows", // Get shows for a specific date yyyy-mm-dd
    "GET /api/shows/{timestamp}": "packages/functions/src/api/shows.getShow", // Get show details
    "GET /api/line-up": "packages/functions/src/api/lineUp.handler", // Get line-up for all shows on a specific date yyyy-mm-dd
    "GET /api/error": "packages/functions/src/api/health.error", // Purposely throw an error
    "GET /api/health": "packages/functions/src/api/health.health", // Health check
    "POST /api/reservation/{timestamp}":
      "packages/functions/src/api/reservation.create", // Make a reservation for a show
  };

  const api = new Api(stack, "api", {
    ...(stage === "prod" && customDomain),
    defaults: {
      function: {
        bind: [FROM_EMAIL, FROM_EMAIL_PW],
      },
    },
    cors: {
      allowMethods: ["GET", "POST", "OPTIONS"],
    },
    routes: {
      ...apiRoutes,
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
