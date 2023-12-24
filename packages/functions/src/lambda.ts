import { ApiHandler } from "sst/node/api";
import { fetchShows } from "../../core/src/fetchShows";
import { getFutureDatesByDay } from "../../core/src/getFutureDatesByDay";
import { filterShows } from "../../core/src/filterShows";
import { Show } from "../../types/api";

export const handler = ApiHandler(async (_evt) => {
  const days = parseInt(_evt?.queryStringParameters?.days || "1", 10);

  const dates = getFutureDatesByDay(days);
  const response = [];
  for (const date of dates) {
    const data = await fetchShows(date);
    const shows = data?.showInfo?.shows ?? [];

    if (!shows.length) {
      console.log(`No shows for ${date}`);
      continue;
    }

    response.push({
      date,
      shows: filterShows(shows).availableShows,
    });
  }
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(response),
  };
});
