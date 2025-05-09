import { render } from "@react-email/components";

import { NewActsEmail } from "../email-templates/newActs";

import { SelectShow } from "@core/sql/show.sql";
import { SelectComic } from "@core/sql/comic.sql";

export async function newActsEmail(
  showsWithActs: {
    show: SelectShow;
    comics: SelectComic[];
  }[]
) {
  const emailHtml = await render(
    <NewActsEmail showsWithActs={showsWithActs} />
  );
  return emailHtml;
}
