import { fetchShows } from "../../core/src/fetchShows";
import { getFutureDatesByWeek } from "../../core/src/getFutureDatesByWeek";

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
  }

  return {};
};
