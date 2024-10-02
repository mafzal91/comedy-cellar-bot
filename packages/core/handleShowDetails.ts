import { fetchShows } from "./fetchShows";
import { createRooms } from "./models/room";
import { createShows, Show } from "./models/show";

export const handleShowDetails = async ({ date }: { date: string }) => {
  const showsData = await fetchShows(date);

  const shows = (showsData?.shows ?? []).map((show) => {
    return new Show(show);
  });

  try {
    const mappedShows = showsData?.shows;
    const mappedRooms = shows.map((show) => ({
      id: show.roomId,
      name: show.roomName,
    }));

    if (mappedShows.length) {
      await Promise.allSettled([
        createRooms(mappedRooms),
        createShows(mappedShows),
      ]);
    }
  } catch (e) {
    // Swallowing Errors here bc this code is just for background caching
    console.error(e);
  }

  return {
    date,
    shows,
  };
};
