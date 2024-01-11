import { Api, Cron, StaticSite, StackContext } from "sst/constructs";

export function API({ stack }: StackContext) {
  // new Cron(stack, "Cron", {
  //   schedule: "cron(*/10 * * * ? *)",
  //   job: "packages/functions/src/cron.handler",
  // });

  const apiRoutes = {
    "GET /api/list": "packages/functions/src/api/list.handler",
    "GET /api/details": "packages/functions/src/api/details.handler",
    "GET /api/line-up": "packages/functions/src/api/lineUp.handler",
  };

  const api = new Api(stack, "api", {
    routes: {
      ...apiRoutes,
    },
  });

  new StaticSite(stack, "HtmxSite", {
    path: "packages/website",
    buildOutput: "dist",
    buildCommand: "npm run build",
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
