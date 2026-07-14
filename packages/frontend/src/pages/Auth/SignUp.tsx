import { useEffect, useRef } from "preact/hooks";

import { BellAlertIcon, StarIcon } from "@heroicons/react/20/solid";
import { getClerk } from "../../utils/clerk";
import { Link } from "../../components/Link";
import PageWrapper from "./PageWrapper";
import { authAppearance } from "./authAppearance";
import "./Auth.css";

const perks = [
  {
    icon: BellAlertIcon,
    title: "New show alerts",
    description: "Get an email whenever new shows are added to the calendar.",
  },
  {
    icon: StarIcon,
    title: "Follow your favorite comics",
    description:
      "Track the comics you love — per-comic email alerts are coming soon.",
  },
];

export default function SignUp() {
  const signUpRef = useRef();
  useEffect(() => {
    getClerk().then((clerk) => {
      clerk.mountSignUp(signUpRef.current, { appearance: authAppearance });
    });
  }, []);

  return (
    <PageWrapper
      eyebrow="Independent Fan Site"
      title="Create Your Account"
      subline={
        <span className="font-mono text-meta tracking-wide text-faint">
          Accounts are for this fan site only and are not connected to
          comedycellar.com.
        </span>
      }
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" variant="underline" className="font-extrabold">
            Sign in
          </Link>
        </>
      }
    >
      <div className="mx-auto mb-6 max-w-[25rem] border-b border-track pb-6">
        <p className="mb-3.5 font-mono text-meta uppercase tracking-wider text-faint">
          What you get
        </p>
        <ul className="flex flex-col gap-3.5">
          {perks.map((perk) => (
            <li key={perk.title} className="flex items-start gap-3">
              <perk.icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-gold" />
              <div className="min-w-0">
                <h3 className="font-sans text-caption font-extrabold text-text">
                  {perk.title}
                </h3>
                <p className="mt-0.5 font-sans text-meta leading-relaxed text-muted">
                  {perk.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div ref={signUpRef} />
    </PageWrapper>
  );
}
