import { BackToShows } from "./BackToShows";
import { Link } from "../../components/Link";
import { PageHeader } from "../../components/ui/PageHeader";
import { Show } from "../../types";

// Shown instead of the reservation form for third-party ticketed shows
// (e.g. Fever), which can't be reserved through us.
export function ExternalTicketNotice({ show }: { show: Show }) {
  return (
    <div className="mx-auto max-w-[1080px] pb-10">
      <BackToShows />
      <PageHeader
        eyebrow="Tickets sold separately"
        title="Get Your Tickets"
        className="mb-6"
      />
      <p className="mb-4 text-body text-text">
        {show.description} is ticketed through a third party, so it can't be
        reserved here.
      </p>
      <Link
        target="_blank"
        rel="noopener noreferrer"
        href={show.forwardUrl}
        className="font-bold text-gold!"
      >
        Get tickets ↗
      </Link>
    </div>
  );
}
