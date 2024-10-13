import { useEffect, useState } from "preact/hooks";
import { clerk } from "../../utils/clerk";
import { PageLoader } from "../../components/PageLoader";
import { Redirect } from "../../components/Redirect";

export default function SignUp() {
  const [isSigningOut, setIsSigningOut] = useState(true);
  useEffect(() => {
    clerk.load().then(() => {
      clerk.signOut();
      setIsSigningOut(false);
    });
  }, []);

  if (isSigningOut) {
    return <PageLoader />;
  }

  return <Redirect to="/" replace />;
}
