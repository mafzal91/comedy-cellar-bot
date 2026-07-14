/// <reference path="./.sst/platform/config.d.ts" />


export default $config({
  app(input) {
    return {
      name: "comedy-cellar-bot",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        cloudflare: {
          apiToken: process.env.CLOUDFLARE_API_TOKEN,
          email: process.env.CLOUDFLARE_EMAIL,
        },
        supabase: {
          version: "1.4.1",
        },
      },
    };
  },
  async run() {
    $transform(sst.aws.Function, (args) => {
      args.runtime ??= "nodejs22.x";
    });

    const { readdirSync } = await import("fs");
    const outputs = {};

    for (const value of readdirSync("./infra/")) {
      const result = await import("./infra/" + value);
      if (result.outputs) Object.assign(outputs, result.outputs);
    }
    return outputs;
  },
});
