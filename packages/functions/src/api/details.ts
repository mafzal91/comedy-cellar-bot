import { ApiHandler } from "sst/node/api";
import { handleShowDetails } from "../../../core/src/handleShowDetails";

export const handler = ApiHandler(async (_evt) => {
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

  const response = await handleShowDetails({ date });
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(response),
  };
});
