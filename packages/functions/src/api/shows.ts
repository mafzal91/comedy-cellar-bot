import { ApiHandler } from "sst/node/api";
import { usePathParam } from "sst/node/api";
import { format } from "date-fns";

import { handleShowDetails } from "../../../core/src/handleShowDetails";
import { handleLineUp } from "../../../core/src/handleLineUp";
import { handleShowList } from "../../../core/src/handleShowList";

export const listShows = ApiHandler(async (_evt) => {
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

export const getShow = ApiHandler(async (_evt) => {
  const timestamp = usePathParam("timestamp");

  if (!timestamp) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Invalid timestamp",
      }),
    };
  }

  const parsedTimestamp = +timestamp;
  const jsTimestamp = +parsedTimestamp * 1000;

  const date = format(new Date(jsTimestamp), "yyyy-MM-dd");

  const [showRes, lineUpRes] = await Promise.all([
    handleShowDetails({ date }),
    handleLineUp({ date }),
  ]);

  const { shows } = showRes;
  const { lineUps } = lineUpRes;

  // Line Ups may not be available for all shows. Especially for speciality shows
  const lineUp = lineUps.find((l) => l.timestamp === parsedTimestamp);
  const show = shows.find((s) => s.timestamp === parsedTimestamp);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ show, lineUp }),
  };
});

export const scanShows = ApiHandler(async (_evt) => {
  const days = parseInt(_evt?.queryStringParameters?.days || "1", 10);

  const response = await handleShowList({ days });
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(response),
  };
});
