import { useEffect, useRef } from "preact/hooks";

import { clerk } from "../../utils/clerk";
import { Link } from "../../components/Link";
import PageWrapper from "./PageWrapper";
import { authAppearance } from "./authAppearance";

export default function SignUp() {
  const signUpRef = useRef();
  useEffect(() => {
    clerk.load().then(() => {
      clerk.mountSignUp(signUpRef.current, { appearance: authAppearance });
    });
  }, []);

  return (
    <PageWrapper
      eyebrow="New Members"
      title="Join the Cellar"
      subline="Create an account to book and manage your reservations."
      footnote="Secured by Clerk"
      footer={
        <>
          Already have a seat?{" "}
          <Link href="/sign-in" variant="underline" className="font-extrabold">
            Sign in
          </Link>
        </>
      }
    >
      <div ref={signUpRef} />
    </PageWrapper>
  );
}
