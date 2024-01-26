import { fetchShows } from "../../core/src/fetchShows";
import { getFutureDatesByWeek } from "../../core/src/getFutureDatesByWeek";
import { filterShows } from "../../core/src/filterShows";
import { Show } from "../../types/api";

const formatShow = (show: Show) => {
  return `${show.description} - ${show.max - show.totalGuests} seats remaining`;
};

export const handler = async () => {
  const dates = getFutureDatesByWeek(2);

  for (const date of dates) {
    console.log(`Getting shows for ${date}`);
    const data = await fetchShows(date);
    const shows = data?.showInfo?.shows ?? [];

    if (!shows.length) {
      console.log(`No shows for ${date}`);
      continue;
    }
    const { availableShows } = filterShows(shows);
    console.log(`Found ${availableShows.length} shows for ${date}`);
    for (const show of availableShows) {
      console.log(formatShow(show));
    }
  }

  return {};
};
