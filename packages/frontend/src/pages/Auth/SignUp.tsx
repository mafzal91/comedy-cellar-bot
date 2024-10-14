import { useEffect, useRef } from "preact/hooks";
import { clerk } from "../../utils/clerk";
import PageWrapper from "./PageWrapper";

export default function SignUp() {
  const signUpRef = useRef();
  useEffect(() => {
    clerk
      .load({
        appearance: {
          elements: {
            cardBox: "bg-black",
          },
        },
      })
      .then(() => {
        clerk.mountSignUp(signUpRef.current);
      });
  }, []);

  return (
    <PageWrapper>
      <div ref={signUpRef} />
    </PageWrapper>
  );
}
