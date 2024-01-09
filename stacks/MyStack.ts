import { Api, Cron, StaticSite, StackContext } from "sst/constructs";

export function API({ stack }: StackContext) {
  // new Cron(stack, "Cron", {
  //   schedule: "cron(*/10 * * * ? *)",
  //   job: "packages/functions/src/cron.handler",
  // });

  const htmlRoutes = {
    "GET /html/dates": "packages/functions/src/html/dates.handler",
    "GET /html/list": "packages/functions/src/html/list.handler",
  };
  const apiRoutes = {
    "GET /api/list": "packages/functions/src/api/list.handler",
    "GET /api/details": "packages/functions/src/api/details.handler",
  };

  const api = new Api(stack, "api", {
    routes: {
      ...htmlRoutes,
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
