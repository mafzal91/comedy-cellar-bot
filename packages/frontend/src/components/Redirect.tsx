import { useLocation } from "preact-iso";
import { useLayoutEffect } from "preact/hooks";

export const Redirect = ({
  to,
  replace = false,
}: {
  to: string;
  replace: boolean;
}) => {
  const { route } = useLocation();
  useLayoutEffect(() => {
    route(to, replace);
  }, [to]);

  return null;
};
