import { StackContext, StaticSite, use } from "sst/constructs";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";

import { ApiStack } from "./ApiStack";

export function FrontendStack({ stack, app }: StackContext) {
  const { api } = use(ApiStack);

  const site = new StaticSite(stack, "frontend", {
    path: "./frontend",
    buildOutput: "dist",
    buildCommand: "npm run build",
    environment: {
      VITE_REGION: app.region,
      VITE_API_URL: api.url,
    },
    errorPage: "redirect_to_index_page",
    dev: {
      url: "http://localhost:5173",
    },
    customDomain: {
      isExternalDomain: true,
      domainName: "comedycellar.mafz.al",
      cdk: {
        certificate: Certificate.fromCertificateArn(
          stack,
          "FrontendCert",
          "arn:aws:acm:us-east-1:824714483059:certificate/b75a7d49-f69b-405a-88d0-20f45c64d931"
        ),
      },
    },
  });

  // Show the url in the output
  stack.addOutputs({
    SiteUrl: site.customDomainUrl || site.url,
  });
  return { site };
}
