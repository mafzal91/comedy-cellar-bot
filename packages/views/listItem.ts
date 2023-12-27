import { Show } from "../types/api";

export const listItem = ({ description }: Show) => {
  return `
    <div class="flex flex-col">
        ${description}
    </div>
    `;
};
