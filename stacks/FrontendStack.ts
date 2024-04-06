import { StackContext, StaticSite, use } from "sst/constructs";
import { ApiStack } from "./ApiStack";

export function FrontendStack({ stack, app }: StackContext) {
  const { api } = use(ApiStack);

  const site = new StaticSite(stack, "frontend", {
    path: "./frontend",
    buildOutput: "build",
    buildCommand: "npm run build",
    environment: {
      VITE_REGION: app.region,
      VITE_API_URL: api.url,
    },
    errorPage: "redirect_to_index_page",
    dev: {
      url: "http://localhost:5173",
    },
  });

  // Show the url in the output
  stack.addOutputs({
    SiteUrl: site.customDomainUrl || site.url,
  });
  return { site };
}
