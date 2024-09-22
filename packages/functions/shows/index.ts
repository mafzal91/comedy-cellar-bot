import { parseTimestampString } from "../../core/utils";
import { handleShowDetails } from "../../core/handleShowDetails";
import { handleLineUp } from "../../core/handleLineUp";
import { handleShowList } from "../../core/handleShowList";

export const listShows = async (_evt) => {
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
};

export const getShow = async (_evt) => {
  const timestamp = _evt?.pathParameters?.timestamp;

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

  const { date, unixTimestamp } = parseTimestampString({ timestamp });

  const [showRes, lineUpRes] = await Promise.all([
    handleShowDetails({ date }),
    handleLineUp({ date }),
  ]);
  const { shows } = showRes;
  const { lineUps } = lineUpRes;

  // Line Ups may not be available for all shows. Especially for speciality shows
  const lineUp = lineUps.find((l) => l.timestamp === unixTimestamp);
  const show = shows.find((s) => s.timestamp === unixTimestamp);

  if (!show) {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Show not found",
      }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ show, lineUp }),
  };
};

export const scanShows = async (_evt) => {
  const days = parseInt(_evt?.queryStringParameters?.days || "1", 10);

  const response = await handleShowList({ days });
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(response),
  };
};
