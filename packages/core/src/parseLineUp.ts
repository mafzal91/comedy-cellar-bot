import * as cheerio from "cheerio";
import { CheerioAPI, Element } from "cheerio";
import { ApiResponse } from "../../types/api";

type ShowInfoList = ApiResponse.LineUp;

const parseNameDescription = ($: CheerioAPI, $lineUp: Element) => {
  // get the name element. Grab the text from the name element. Traverse up to the parent, remove the name element, get the text
  const $name = $($lineUp).find(".name");
  const name = $($name).text();
  const $description = $($name).parent();
  $($name).remove();
  const description = $($description).text().trim();
  return {
    name,
    description,
  };
};

export const parseLineUp = ({ html }: { html: string }): ShowInfoList => {
  // comedy cellar api returns html elements without a shared parent.
  // Since idk how to select a list of elements without a shared parent I wrap it in a parent
  const $ = cheerio.load(`<div>${html}</div>`);
  let $shows = $("div:first").children();

  let showInfoList: ShowInfoList = [];
  $($shows).each((_: number, show: Element) => {
    const reservationUrl = $(show).find(".make-reservation > a").attr("href");
    const showId = reservationUrl?.split("showid=")[1];
    const showInfo: {
      reservationUrl: string | undefined;
      timestamp: number | undefined;
      acts: {
        img: string | undefined;
        name: string | undefined;
        description: string | undefined;
        website: string | undefined;
      }[];
    } = {
      reservationUrl,
      timestamp: showId ? parseInt(showId, 10) : undefined,
      acts: [],
    };
    $(show)
      .find(".set-content")
      .each((_: number, lineUp: Element) => {
        const img = $(lineUp).find("img").attr("src");
        const { name, description } = parseNameDescription($, lineUp);
        const website = $(lineUp).find("a").attr("href");

        showInfo.acts.push({
          img,
          name,
          description,
          website,
        });
      });
    showInfoList.push(showInfo);
  });
  return showInfoList;
};
