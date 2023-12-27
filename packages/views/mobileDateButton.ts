type mobileDateButtonArgs = {
  date: string;
  dayOfWeek: string;
  isToday: boolean;
};

export const mobileDateButton = ({
  date,
  dayOfWeek,
  isToday,
}: mobileDateButtonArgs) => {
  console.log("mobileDateButton", { date, dayOfWeek, isToday });
  const [, , day] = date.split("-"); // [year, month, day]
  const todayColor = isToday ? "bg-gray-900 text-white" : "text-gray-900";

  return `
    <button type="button" class="flex flex-col items-center pb-1.5 pt-3">
        <span>${dayOfWeek}</span>
        <span
            class="mt-3 flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold ${todayColor}">
            ${day}</span>
    </button>
    `;
};
