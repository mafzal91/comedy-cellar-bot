import { Api, Cron, StaticSite, StackContext } from "sst/constructs";

export function API({ stack }: StackContext) {
  // new Cron(stack, "Cron", {
  //   schedule: "cron(*/10 * * * ? *)",
  //   job: "packages/functions/src/cron.handler",
  // });

  const api = new Api(stack, "api", {
    routes: {
      "GET /": "packages/functions/src/lambda.handler",
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
