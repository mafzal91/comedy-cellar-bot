import { createComics } from "./models/comic";
import { fetchLineUp } from "./fetchLineUp";
import { LineUp } from "./models/lineUp";
import { isValidComic } from "./sql/comic.sql";

export const handleLineUp = async ({ date }: { date: string }) => {
  const lineUpsData = await fetchLineUp(date);

  const lineUps = (lineUpsData ?? []).map((lineUp) => new LineUp(lineUp));

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
  } catch (e) {
    // Swallowing Error here bc this code is just for background caching
    console.error(e);
  }

  return {
    date,
    lineUps: lineUps,
  };
};
