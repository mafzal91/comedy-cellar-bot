import { addDays, endOfDay, getUnixTime, startOfDay } from "date-fns";

import { getFutureDatesByDay } from "@core/getFutureDatesByDay";
import { createShows, Show, getLastShow } from "@core/models/show";
import { handleLineUp } from "@core/handleLineUp";
import { handleShowDetails } from "@core/handleShowDetails";
import { parseTimestampString } from "@core/utils";
import { sendEmail } from "@core/email";
import { sleep } from "@core/common/sleep";
import { isValidComic, SelectComic } from "@core/sql/comic.sql";
import { createComics, getComicsByNames } from "@core/models/comic";
import { createActs, getActsByShowId, Lineup } from "@core/models/act";
import { getShowByTimestamp } from "@core/models/show";
import { createRooms } from "@core/models/room";
import { newComicEmail } from "@core/email/newComicEmail";
import { newActsEmail } from "@core/email/newActEmail";
import { SelectAct } from "@core/sql/act.sql";
import { SelectShow } from "@core/sql/show.sql";

const IS_ACTIVE = process.env.IS_ACTIVE === "1";
const IS_CRON = process.env.IS_CRON === "1";
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(
        `Attempt ${attempt}/${maxRetries} failed for ${operationName}:`,
        error.message
      );

      if (attempt < maxRetries) {
        await sleep(delay * attempt); // Exponential backoff
        continue;
      }
    }
  }

  throw lastError!;
}

async function insertNewComics(lineUps: Lineup[]): Promise<SelectComic[]> {
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

    let newComics: SelectComic[] = [];
    if (uniqueComics.length) {
      newComics = await createComics(uniqueComics);
    }

    return newComics;
  } catch (e) {
    // Swallowing Error here bc this code is just for background caching
    console.error("fetching lineup", e);
  }
}

async function insertNewActs(
  lineUps: Lineup[]
): Promise<{ show: SelectShow; comics: SelectComic[] }[]> {
  try {
    let showsWithNewActs: { show: SelectShow; comics: SelectComic[] }[] = [];
    for (const lineup of lineUps) {
      const { timestamp, acts } = lineup;

      const actNames = acts.filter((act) => act.name).map((act) => act.name);
      const [show, comics] = await Promise.all([
        getShowByTimestamp(timestamp),
        getComicsByNames(actNames),
      ]);

      if (show.length === 1 && show[0].id) {
        const insertActs = comics.map(({ id }) => ({
          comicId: id,
          showId: show[0].id,
        }));
        const newActs = await createActs(insertActs);

        if (true) {
          const acts = await getActsByShowId(show[0].id);
          showsWithNewActs.push({
            show: show[0],
            comics: acts.map((act) => {
              const comic = comics.find((comic) => comic.id === act.comicId);
              return comic;
            }),
          });
        }
      }
    }
    return showsWithNewActs;
  } catch (e) {
    // Swallowing Error here bc this code is just for background caching
    console.error("fetching lineup", e);
  }
}

async function insertNewShows(shows: Show[]) {
  try {
    const mappedShows = shows;
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
}

export async function handler() {
  if (!IS_ACTIVE && IS_CRON) {
    return;
  }

  const today = new Date();
  const startOfToday = startOfDay(today);
  const startOfTodayUnixTimestamp = getUnixTime(startOfToday);
  const [lastKnownShow] = await getLastShow();

  const dateOfLastShow = parseTimestampString({
    timestamp: `${lastKnownShow.timestamp}`,
  });

  const startDate = startOfTodayUnixTimestamp;
  const endDate = getUnixTime(
    addDays(endOfDay(new Date(dateOfLastShow.jsTimestamp)), 0)
  );

  const differenceInSeconds = endDate - startOfTodayUnixTimestamp;
  const differenceInDays = Math.round(differenceInSeconds / 86400);
  const dates = getFutureDatesByDay(differenceInDays, startDate * 1000);

  try {
    for (const date of [dates[0]]) {
      const results = await Promise.allSettled([
        withRetry(() => {
          return handleShowDetails({ date });
        }, `handleShowDetails for date ${date}`),
        withRetry(() => {
          return handleLineUp({ date });
        }, `handleLineUp for date ${date}`),
      ]);

      // Check if any operations failed
      const failures = results.filter((result) => result.status === "rejected");

      if (failures.length > 0) {
        const errors = failures.map((f) => (f as PromiseRejectedResult).reason);
        throw new Error(`Operations failed:\n${errors.join("\n")}`);
      }

      const showDetails =
        results[0].status === "fulfilled" ? results[0].value : null;
      const lineUp =
        results[1].status === "fulfilled" ? results[1].value : null;

      if (lineUp.lineUps.length) {
        const newComics = await insertNewComics(lineUp.lineUps);
        const newActs = await insertNewActs(lineUp.lineUps);

        if (newComics.length) {
          await sendNewComicsEmail(newComics);
        }
        if (newActs.length) {
          console.log("newActs", newActs[0]);
          await sendNewActsEmail(newActs);
        }
      }
      if (showDetails.shows.length) {
        await insertNewShows(showDetails.shows);
      }

      await sleep(5000);
    }
  } catch (e) {
    const errorMessage = `There was an error in the syncCron: ${e.message}\n\nStack Trace:\n${e.stack}`;

    await sendEmail({
      subject: "Sync Show Cron",
      message: errorMessage,
    }).catch((e) => console.error(e));
  }

  return {};
}

async function sendNewComicsEmail(newComics: SelectComic[]) {
  const comicListHtml = await newComicEmail(newComics);

  await sendEmail({
    subject: "New Comics",
    html: comicListHtml,
    message: "New Comics",
  }).catch((e) => console.error(e));
}

async function sendNewActsEmail(
  showsWithActs: {
    show: SelectShow;
    comics: SelectComic[];
  }[]
) {
  const actListHtml = await newActsEmail(showsWithActs);

  await sendEmail({
    subject: "New Acts",
    html: actListHtml,
    message: "New Acts",
  }).catch((e) => console.error(e));
}
