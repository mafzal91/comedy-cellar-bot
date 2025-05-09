import { render } from "@react-email/components";
import NewComicEmail from "../email-templates/newComic";
import { SelectComic } from "@core/sql/comic.sql";

export async function newComicEmail(newComics: SelectComic[]) {
  const emailHtml = await render(<NewComicEmail comics={newComics} />);
  return emailHtml;
}
