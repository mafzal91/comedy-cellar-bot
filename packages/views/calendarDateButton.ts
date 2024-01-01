type CalendarDateButton = {
  date: string;
  isSelected: boolean;
  isToday: boolean;
};

const calendarDateButton = ({
  date,
  isSelected,
  isToday,
}: CalendarDateButton) => {
  let buttonClasses =
    "rounded-tl-lg bg-gray-50 py-1.5 text-gray-400 hover:bg-gray-100 focus:z-10";

  if (isSelected) {
    buttonClasses += isToday ? " bg-indigo-600" : " bg-gray-900";
  }

  return `
      <button type="button" class="${buttonClasses}">
        <time datetime=${date} class="mx-auto flex h-7 w-7 items-center justify-center rounded-full"></time>
      </button>
    `;
};
