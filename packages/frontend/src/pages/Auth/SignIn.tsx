import { useEffect, useRef } from "preact/hooks";

import { clerk } from "../../utils/clerk";
import { Link } from "../../components/Link";
import PageWrapper from "./PageWrapper";
import { authAppearance } from "./authAppearance";

export default function SignIn() {
  const signInRef = useRef();
  useEffect(() => {
    clerk.load().then(() => {
      clerk.mountSignIn(signInRef.current, { appearance: authAppearance });
    });
  }, []);

  return (
    <PageWrapper
      eyebrow="Members' Entrance"
      title="Take Your Seat"
      subline="Welcome back — sign in to manage your reservations."
      footnote="Secured by Clerk"
      footer={
        <>
          New to the Cellar?{" "}
          <Link href="/sign-up" variant="underline" className="font-extrabold">
            Create an account
          </Link>
        </>
      }
    >
      <div ref={signInRef} />
    </PageWrapper>
  );
}
