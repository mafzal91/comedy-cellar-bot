import { ApiHandler } from "sst/node/api";
import { handleShowList } from "../../../core/src/handleShowList";
import { list } from "../../../views/list";
import { listItem } from "../../../views/listItem";

export const handler = ApiHandler(async (_evt) => {
  const days = parseInt(_evt?.queryStringParameters?.days || "1", 10);

  const response = await handleShowList({ days });
  let html = "";
  for (const showInfo of response ?? []) {
    const showHtml = (showInfo.shows ?? [])
      .map((show) => listItem(show))
      .join("");

    const showInfoHtml = list({
      date: showInfo.date,
      showHtml,
    });
    html += showInfoHtml;
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html",
    },
    body: html,
  };
});
