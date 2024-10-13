import { useEffect, useRef } from "preact/hooks";
import { clerk } from "../../utils/clerk";
import PageWrapper from "./PageWrapper";

export default function SignIn() {
  const signInRef = useRef();
  useEffect(() => {
    clerk.load().then(() => {
      clerk.mountSignIn(signInRef.current);
    });
  }, []);

  return (
    <PageWrapper>
      <div ref={signInRef} />
    </PageWrapper>
  );
}
