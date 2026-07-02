import { useEffect, useRef } from "preact/hooks";

import { getClerk } from "../../utils/clerk";
import { Link } from "../../components/Link";
import PageWrapper from "./PageWrapper";
import { authAppearance } from "./authAppearance";
import "./Auth.css";

export default function SignIn() {
  const signInRef = useRef();
  useEffect(() => {
    getClerk().then((clerk) => {
      clerk.mountSignIn(signInRef.current, { appearance: authAppearance });
    });
  }, []);

  return (
    <PageWrapper
      eyebrow="Members' Entrance"
      title="Take Your Seat"
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
