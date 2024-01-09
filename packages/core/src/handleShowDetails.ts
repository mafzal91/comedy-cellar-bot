import { fetchShows } from "./fetchShows";
import { Show } from "./models/show";
import { filterShows } from "./filterShows";

export const handleShowDetails = async ({ date }: { date: string }) => {
  const data = await fetchShows(date);
  const shows = (data?.showInfo?.shows ?? []).map((show) => {
    return new Show(show);
  });

  return {
    date,
    shows,
  };
};
