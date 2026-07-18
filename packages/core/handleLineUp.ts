import { fetchLineUp } from "./fetchLineUp";
import { isValidComic } from "./sql/comic.sql";
import { createComics, getComicsByNames } from "./models/comic";
import { createActs, Lineup } from "./models/act";
import { getShowByTimestamp } from "./models/show";
import { enqueueComicActs } from "./models/comicNotificationQueue";

export const handleLineUp = async ({ date }: { date: string }) => {
  const lineUpsData = await fetchLineUp(date);

  const lineUps = (lineUpsData ?? []).map((lineUp) => new Lineup(lineUp));

  try {
    const comics = lineUps
      .flatMap((lineUp) => lineUp.acts)
      .filter(isValidComic);
    const uniqueComicName = new Set();
    const uniqueComics = comics.filter((comic) => {
      const duplicate = uniqueComicName.has(comic.name);
      uniqueComicName.add(comic.name);
      return !duplicate;
    });
    if (uniqueComics.length) {
      await createComics(uniqueComics);
    }

    for (const lineup of lineUps) {
      const { timestamp, acts } = lineup;

      const actNames = acts.filter((act) => act.name).map((act) => act.name);
      const [show, comics] = await Promise.all([
        getShowByTimestamp(timestamp),
        getComicsByNames(actNames),
      ]);
      if (show.length === 1 && show[0].id) {
        const newActs = comics.map(({ id }) => ({
          comicId: id,
          showId: show[0].id,
        }));
        const insertedActs = await createActs(newActs);

        // Queue newly-assigned comics on upcoming shows so the comic
        // notification cron can batch them into subscriber emails
        const nowInSeconds = Math.floor(Date.now() / 1000);
        if (insertedActs.length && (show[0].timestamp ?? 0) > nowInSeconds) {
          await enqueueComicActs(insertedActs.map((row) => row.id));
        }
      }
    }
  } catch (e) {
    // Swallowing Error here bc this code is just for background caching
    console.error("fetching lineup", e);
  }

  return {
    date,
    lineUps: lineUps,
  };
};
