import * as Sentry from "@sentry/serverless";
import { ApiHandler } from "sst/node/api";
import { handleLineUp } from "../../../core/src/handleLineUp";

export const handler = Sentry.AWSLambda.wrapHandler(
  ApiHandler(async (_evt) => {
    const date = _evt?.queryStringParameters?.date; // yyyy-mm-dd

    if (!date) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Invalid date/Date Required in format yyyy-mm-dd",
        }),
      };
    }

    const response = await handleLineUp({ date });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(response),
    };
  })
);
