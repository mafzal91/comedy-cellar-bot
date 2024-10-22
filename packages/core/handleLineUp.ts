import { fetchLineUp } from "./fetchLineUp";
import { isValidComic } from "./sql/comic.sql";
import { createComics, getComicsByNames } from "./models/comic";
import { createActs, Lineup } from "./models/act";
import { getShowByTimestamp } from "./models/show";

export const handleLineUp = async ({ date }: { date: string }) => {
  const lineUpsData = await fetchLineUp(date);
  console.log({ date, lineUpsData });

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
      await createComics(uniqueComics).catch((e) =>
        console.error("error creating comics", e)
      );
    }

    try {
      for (const lineup of lineUps) {
        const { timestamp, acts } = lineup;
        console.log(lineup);
        const actNames = acts.filter((act) => act.name).map((act) => act.name);
        console.log("111111");
        console.log(timestamp);
        console.log(actNames);
        const [show, comics] = await Promise.all([
          getShowByTimestamp(timestamp),
          getComicsByNames(actNames),
        ]);
        console.log("sdasdasd");
        if (show.length === 1 && show[0].id) {
          const newActs = comics.map(({ id }) => ({
            comicId: id,
            showId: show[0].id,
          }));
          console.log({ newActs });
          await createActs(newActs);
        }
      }
    } catch (e) {
      console.error("fetching creating acts", e);
    }
  } catch (e) {
    // Swallowing Error here bc this code is just for background caching
    console.error("fetching lineup1", e);
  }

  return {
    date,
    lineUps: lineUps,
  };
};
