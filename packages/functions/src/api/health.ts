import * as Sentry from "@sentry/serverless";
import { ApiHandler } from "sst/node/api";

export const error = Sentry.AWSLambda.wrapHandler(async (event, context) => {
  throw new Error("This should show up in Sentry!");
});

export const health = Sentry.AWSLambda.wrapHandler(
  ApiHandler(async (event, context) => {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "ok", timestamp: +new Date() }),
    };
  })
);
