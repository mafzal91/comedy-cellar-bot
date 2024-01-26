import { fetchShows } from "./fetchShows";
import { getFutureDatesByDay } from "./getFutureDatesByDay";
import { filterShows } from "./filterShows";

export const handleShowList = async ({ days }: { days: number }) => {
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
  return response;
};
