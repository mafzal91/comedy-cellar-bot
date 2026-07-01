import { FunctionalComponent, ComponentChildren } from "preact";

import clsx from "clsx";

type EyebrowProps = {
  className?: string;
  children: ComponentChildren;
};

export const Eyebrow: FunctionalComponent<EyebrowProps> = ({ className, children }) => {
  return (
    <p
      className={clsx(
        "font-mono uppercase text-eyebrow tracking-mega text-gold",
        className,
      )}
    >
      {children}
    </p>
  );
};
