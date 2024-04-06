import {
  InformationCircleIcon,
  FaceSmileIcon,
  ArrowPathRoundedSquareIcon,
  ClockIcon,
  PhoneXMarkIcon,
} from "@heroicons/react/24/outline";

const disclaimers = [
  {
    title: "2 item minimum per person.",
    description: "Food or Drink or bottle of water.",
    imageUrl:
      "https://www.comedycellar.com/wp-content/uploads/2023/05/comedycellar_2drinkmin_icon_dark_60.svg",
    icon: FaceSmileIcon,
  },
  {
    title: "Individual comedian appearance subject to change without notice.",
    description:
      "But! We often have great stars dropping in without notice, so we feel it kinda evens itself out. In any event, all our shows are great so we are confident you’ll enjoy yourself.",
    imageUrl:
      "https://www.comedycellar.com/wp-content/uploads/2023/05/comedycellar_lineup_change_icon_dark_60.svg",
    icon: ArrowPathRoundedSquareIcon,
  },
  {
    title: "All of our shows are phone free!",
    description:
      "We ask all guests to place their phones and smart watches into the pouches we provide (you will of course maintain possession of them) for the duration of the show.",
    imageUrl:
      "https://www.comedycellar.com/wp-content/uploads/2023/05/comedycellar_nophones_icon_dark_60.svg",
    icon: PhoneXMarkIcon,
  },
  {
    title:
      "AM shows (after midnight) are the LATE NIGHT shows of the day chosen.",
    description:
      "For example: the Saturday 12:15 AM show is technically Sunday morning but it is the still the Saturday late show.",
    imageUrl:
      "https://www.comedycellar.com/wp-content/uploads/2023/05/comedycellar_Showtime_icon_dark_60.svg",
    icon: ClockIcon,
  },
  {
    title: "Affiliation Disclaimer",
    description:
      "This site is not affiliated with the Comedy Cellar. Please visit comedycellar.com for the official website terms and conditions.",
    imageUrl:
      "https://www.comedycellar.com/wp-content/uploads/2023/05/comedycellar_Showtime_icon_dark_60.svg",
    icon: InformationCircleIcon,
  },
];

export const Disclaimer = () => {
  return (
    <>
      {disclaimers.map((disclaimer) => (
        <div key={disclaimer.title} className="flex rounded-lg">
          <div className="flex-shrink-0">
            <div className="flow-root">
              {<disclaimer.icon className="h-6 w-6" />}
            </div>
          </div>
          <div className="ml-5">
            <h3 className="text-sm font-medium text-gray-900">
              {disclaimer.title}
            </h3>
            <p className="mt-2 text-xs text-gray-500">
              {disclaimer.description}
            </p>
          </div>
        </div>
      ))}
    </>
  );
};
