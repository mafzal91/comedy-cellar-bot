import { useLayoutEffect } from "preact/hooks";

export const Redirect = ({ to }) => {
  useLayoutEffect(() => {
    history.pushState(null, "", to);
  }, [to]);

  return null;
};
