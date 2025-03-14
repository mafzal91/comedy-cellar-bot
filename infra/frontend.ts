import api from "./api";
import { clerkCreds } from "./secrets";

const prodDomain = {
  domain: {
    name: "comedycellar.mafz.al",
    dns: sst.cloudflare.dns({
      zone: "b94d6748e8554bed2a3eae31cc65c81b",
    }),
  },
};
new sst.aws.StaticSite("Frontend", {
  path: "packages/frontend",
  build: {
    command: "npm run build",
    output: "dist",
  },
  environment: {
    VITE_REGION: aws.getRegionOutput().name,
    VITE_API_URL: api.url,
    VITE_CLERK_PUBLISHABLE_KEY: clerkCreds.clertPublishableKey.value,
    CLERK_SIGN_IN_URL: "/sign-in",
    CLERK_SIGN_UP_URL: "/sign-up",
  },
  ...($app.stage === "prod" ? prodDomain : {}),
});
