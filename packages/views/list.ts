import { Show, ShowInfo } from "../types/api";
import { listItem } from "./listItem";

export const list = ({
  date,
  showHtml,
}: {
  date: string;
  showHtml: string;
}) => {
  return `
    <div class="flex flex-col">
        <h3>${date}</h3>
        ${showHtml}
    </div>
    `;
};
