import api from "./api";
import userPool, { userPoolClient } from "./cognito";

const prodDomain = {
  domain: {
    name: "comedycellar.mafz.al",
    dns: sst.cloudflare.dns({
      zone: "b94d6748e8554bed2a3eae31cc65c81b",
    }),
  },
};
console.log(userPoolClient.id);
new sst.aws.StaticSite("Frontend", {
  path: "packages/frontend",
  build: {
    command: "npm run build",
    output: "dist",
  },
  environment: {
    VITE_REGION: aws.getRegionOutput().name,
    VITE_API_URL: api.url,
    VITE_USER_POOL_ID: userPool.id,
    VITE_USER_POOL_CLIENT_ID: userPoolClient.id,
  },
  ...($app.stage === "prod" ? prodDomain : {}),
});
