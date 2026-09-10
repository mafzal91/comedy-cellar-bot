import { ApiResponse } from "@customTypes/api";
import * as cheerio from "cheerio";
import { CheerioAPI, Element } from "cheerio";
import { fromZonedTime } from "date-fns-tz";

type ShowInfoList = ApiResponse.LineUp;
type ShowInfo = ShowInfoList[number];
type Act = ShowInfo["acts"][number];

const CLUB_TIME_ZONE = "America/New_York";

/**
 * Comedy cellar's reservation showid (parsed from the make-reservation href)
 * is not the show's timestamp. It encodes the show's wall-clock time against
 * the date the request was made, so the same show yields a different showid
 * on a different day, and two different dates' lineups return identical
 * showids. The display time label ("7:00 pm") is plain CMS text, so we
 * rebuild the timestamp from the label + the requested date instead.
 *
 * The result must match the timestamp getShows reports for the same show,
 * because handleLineUp joins the two through getShowByTimestamp.
 *
 * @param {CheerioAPI} $ - The Cheerio instance for parsing HTML.
 * @param {Element} $lineUp - The `.lineup` element for one show.
 * @param {string} date - The `yyyy-MM-dd` date the lineup was requested for.
 * @returns {number | undefined} Unix seconds for the show, or undefined if
 * the time label couldn't be parsed.
 */
const parseShowTimestamp = (
  $: CheerioAPI,
  $lineUp: Element,
  date: string
): number | undefined => {
  // A lineup page holds several shows as flat siblings
  // (.set-header, .lineup, .set-header, .lineup, ...), so take the header
  // immediately before this lineup rather than every matching sibling.
  const $bold = $($lineUp)
    .prevAll(".set-header")
    .first()
    .find(".info .bold")
    .clone();
  $bold.find(".hide-mobile").remove();
  const label = $bold.text().trim();

  const match = label.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return undefined;

  const [, hourStr, minuteStr, meridiem] = match;
  let hour = parseInt(hourStr, 10) % 12;
  if (meridiem.toLowerCase() === "pm") hour += 12;

  // After-midnight shows keep the requested date, even though the lineup
  // page lists them last. comedycellar.com dates them by calendar day, not
  // by the evening they belong to: getShows for 2026-09-11 reports its
  // 12:30 am show at Sep 11 00:30 ET, before that evening's 6pm show.
  // Adding a day here would break the getShowByTimestamp join.
  const timeStr = `${String(hour).padStart(2, "0")}:${minuteStr}:00`;

  const zonedDate = fromZonedTime(`${date}T${timeStr}`, CLUB_TIME_ZONE);
  return Math.floor(zonedDate.getTime() / 1000);
};

/**
 * Helper function to parse the comedian's name and description.
 *
 * @param {CheerioAPI} $ - The Cheerio instance for parsing HTML.
 * @param {Element} $lineUp - The HTML element containing the comedian's name and description.
 * @returns {{ name: string; description: string }} The parsed name and description of the comedian.
 */
const parseNameDescription = ($: CheerioAPI, $lineUp: Element) => {
  const $name = $($lineUp).find(".name");
  const name = $($name).text().trim();
  const $description = $($name).parent();
  $($name).remove();
  const description = $($description).text().trim();
  return {
    name,
    description,
  };
};

/**
 * Helper function to parse each comedian's details within a show.
 *
 * @param {CheerioAPI} $ - The Cheerio instance for parsing HTML.
 * @param {Element} $show - The HTML element containing the show details.
 * @returns {Act[]} An array of parsed act details.
 */
const parseActs = ($: CheerioAPI, $show: Element): Act[] => {
  const acts: Act[] = [];
  $($show)
    .find(".set-content")
    .each((_, lineUp: Element) => {
      const img = $(lineUp).find("img").attr("src")?.trim();
      const { name, description } = parseNameDescription($, lineUp);
      const website = $(lineUp).find("a").attr("href")?.trim();

      acts.push({
        img,
        name,
        description,
        website,
      });
    });
  return acts;
};

export const parseLineUp = ({
  html,
  date,
}: {
  html: string;
  date: string;
}): ShowInfoList => {
  // Comedy cellar api returns html elements without a shared parent.
  // Since idk how to select a list of elements without a shared parent I wrap it in a parent
  const $ = cheerio.load(`<div>${html}</div>`);

  // Check for "No shows" case
  if ($(".no-shows").length > 0) {
    return [];
  }

  const showInfoList: ShowInfoList = [];

  $(".lineup").each((_, lineupElement) => {
    // Extract reservation URL
    const reservationUrl = $(lineupElement)
      .find(".make-reservation > a")
      .attr("href");

    // Parse all acts in the show
    const acts = parseActs($, lineupElement);

    // Construct the show info object
    const showInfo: ShowInfo = {
      reservationUrl,
      timestamp: parseShowTimestamp($, lineupElement, date),
      acts,
    };

    showInfoList.push(showInfo);
  });
  return showInfoList;
};
