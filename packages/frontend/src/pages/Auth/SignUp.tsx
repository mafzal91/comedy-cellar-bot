import { useEffect, useRef } from "preact/hooks";

import { getClerk } from "../../utils/clerk";
import { Link } from "../../components/Link";
import PageWrapper from "./PageWrapper";
import { authAppearance } from "./authAppearance";
import "./Auth.css";

export default function SignUp() {
  const signUpRef = useRef();
  useEffect(() => {
    getClerk().then((clerk) => {
      clerk.mountSignUp(signUpRef.current, { appearance: authAppearance });
    });
  }, []);

  return (
    <PageWrapper
      title="Join the Cellar"
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
