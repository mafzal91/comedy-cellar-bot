import { Api, Cron, StackContext } from "sst/constructs";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";

const certArn =
  "arn:aws:acm:us-east-1:824714483059:certificate/9d410133-2ddc-4260-807e-8c7eeb279592";

export function API({ app, stack }: StackContext) {
  // new Cron(stack, "Cron", {
  //   schedule: "cron(*/10 * * * ? *)",
  //   job: "packages/functions/src/cron.handler",
  // });
  const stage = app.stage;

  const customDomain = {
    customDomain: {
      domainName: "comedycellar-api.mafz.al",
      isExternalDomain: true,
      cdk: {
        certificate: Certificate.fromCertificateArn(stack, "MyCert", certArn),
      },
    },
  };

  const apiRoutes = {
    "GET /api/list": "packages/functions/src/api/list.handler",
    "GET /api/details": "packages/functions/src/api/details.handler",
    "GET /api/line-up": "packages/functions/src/api/lineUp.handler",
  };

  const api = new Api(stack, "api", {
    ...(stage === "prod" && customDomain),
    routes: {
      ...apiRoutes,
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
