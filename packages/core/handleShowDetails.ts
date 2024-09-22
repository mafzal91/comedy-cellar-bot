import { fetchShows } from "./fetchShows";
import { Show } from "./models/show";

export const handleShowDetails = async ({ date }: { date: string }) => {
  const showsData = await fetchShows(date);

  const shows = (showsData?.shows ?? []).map((show) => {
    return new Show(show);
  });
  return {
    date,
    shows,
  };
};
