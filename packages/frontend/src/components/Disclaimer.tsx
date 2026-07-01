const houseRules = [
  {
    title: "2 item minimum per person.",
    description: "Food or Drink or bottle of water.",
  },
  {
    title: "Individual comedian appearance subject to change without notice.",
    description:
      "But! We often have great stars dropping in without notice, so we feel it kinda evens itself out. In any event, all our shows are great so we are confident you’ll enjoy yourself.",
  },
  {
    title: "All of our shows are phone free!",
    description:
      "We ask all guests to place their phones and smart watches into the pouches we provide (you will of course maintain possession of them) for the duration of the show.",
  },
  {
    title:
      "AM shows (after midnight) are the LATE NIGHT shows of the day chosen.",
    description:
      "For example: the Saturday 12:15 AM show is technically Sunday morning but it is the still the Saturday late show.",
  },
];

const finePrint =
  "This site is not affiliated with the Comedy Cellar. Please visit comedycellar.com for the official website terms and conditions.";

export const Disclaimer = () => {
  return (
    <div>
      <p className="mb-3.5 font-mono text-meta uppercase tracking-wider text-faint">
        House Rules
      </p>

      <div className="flex flex-col gap-3.5">
        {houseRules.map((rule) => (
          <div key={rule.title}>
            <h3 className="font-sans text-caption font-extrabold text-text">
              {rule.title}
            </h3>
            <p className="mt-0.5 font-sans text-meta leading-relaxed text-muted">
              {rule.description}
            </p>
          </div>
        ))}
      </div>

      <div className="my-4 border-t border-track" />

      <p className="font-mono text-meta leading-relaxed text-faint">
        {finePrint}
      </p>
    </div>
  );
};
