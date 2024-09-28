import { createComics } from "./models/comic";
import { fetchLineUp } from "./fetchLineUp";
import { LineUp } from "./models/lineUp";

export const handleLineUp = async ({ date }: { date: string }) => {
  const lineUpsData = await fetchLineUp(date);

  const lineUps = (lineUpsData ?? []).map((lineUp) => new LineUp(lineUp));

  try {
    const comics = lineUps.flatMap((lineUp) => lineUp.acts);
    const uniqueComicName = new Set();
    const uniqueComics = comics.filter((comic) => {
      const duplicate = uniqueComicName.has(comic.name);
      uniqueComicName.add(comic.name);
      return !duplicate;
    });

    await createComic();
    console.log({
      before: comics.length,
      after: uniqueComics.length,
    });
  } catch (e) {
    // Swallowing Error here bc this code is just for behidn the scenes caching
    console.error(e);
  }

  return {
    date,
    lineUps: lineUps,
  };
};
