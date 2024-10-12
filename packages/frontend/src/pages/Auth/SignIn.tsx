import { useEffect, useRef } from "preact/hooks";
import { clerk } from "../../utils/clerk";
import PageWrapper from "./PageWrapper";

export default function SignIn() {
  const signUpRef = useRef();
  useEffect(() => {
    clerk.load().then(() => {
      clerk.mountSignUp(signUpRef.current);
    });
  }, []);

  return (
    <PageWrapper>
      <div ref={signUpRef} />
    </PageWrapper>
  );
}
