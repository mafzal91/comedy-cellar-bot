import { useEffect, useState } from "preact/hooks";
import { clerk } from "../../utils/clerk";
import { useLocation } from "preact-iso";
import { PageLoader } from "../../components/PageLoader";
import { Redirect } from "../../components/Redirect";

export default function SignUp() {
  const [isSigningOut, setIsSigningOut] = useState(true);
  // const { route } = useLocation();
  useEffect(() => {
    clerk.load().then(() => {
      clerk.signOut();
      // setIsSigningOut(true);
    });
  }, []);

  if (isSigningOut) {
    return <PageLoader />;
  }

  return <Redirect to="/" replace />;
}
