import { fetchShows } from "./fetchShows";
import { createRooms } from "./models/room";
import { createShows, Show } from "./models/show";
import { enqueueNewShows } from "./models/newShowQueue";
import { sendEmail } from "./email";

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
      const [, createShowsResult] = await Promise.allSettled([
        createRooms(mappedRooms),
        createShows(mappedShows),
      ]);

      // Queue brand-new upcoming shows so the notification cron can batch
      // them into a single "new shows" email
      if (createShowsResult.status === "fulfilled") {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const newUpcomingShowIds = createShowsResult.value
          .filter((row) => row.inserted && (row.timestamp ?? 0) > nowInSeconds)
          .map((row) => row.id);

        await enqueueNewShows(newUpcomingShowIds);

        // Subscribers get the batched digest above; AlertEmail gets one
        // email per brand-new show, unbatched
        const insertedIds = new Set(
          createShowsResult.value
            .filter((row) => row.inserted)
            .map((row) => row.id)
        );
        await Promise.allSettled(
          shows
            .filter((show) => insertedIds.has(show.id))
            .map((show) =>
              sendEmail({
                subject: `new show! ${show.roomName ?? ""} ${show.time}`.trim(),
                message: JSON.stringify(
                  { date, roomName: show.roomName, ...show },
                  null,
                  2
                ),
              })
            )
        );
      }
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
