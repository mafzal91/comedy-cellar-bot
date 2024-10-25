import { ApiResponse } from "@customTypes/api";
import * as cheerio from "cheerio";
import { CheerioAPI, Element } from "cheerio";

type ShowInfoList = ApiResponse.LineUp;
type ShowInfo = ShowInfoList[number];
type Act = ShowInfo["acts"][number];

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

export const parseLineUp = ({ html }: { html: string }): ShowInfoList => {
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

    const showId = reservationUrl?.split("showid=")[1];

    // Parse all acts in the show
    const acts = parseActs($, lineupElement);

    // Construct the show info object
    const showInfo: ShowInfo = {
      reservationUrl,
      timestamp: showId ? parseInt(showId, 10) : undefined,
      acts,
    };

    showInfoList.push(showInfo);
  });
  return showInfoList;
};
