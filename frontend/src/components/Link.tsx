import { FunctionalComponent, JSX } from "preact";

import clsx from "clsx";

type LinkProps = JSX.HTMLAttributes<HTMLAnchorElement>;

export const Link: FunctionalComponent<LinkProps> = ({
  className,
  children,
  ...props
}) => {
  const baseClasses =
    "font-small text-blue-600 dark:text-blue-500 hover:underline";

  const linkClasses = clsx(baseClasses, className);

  return (
    <a className={linkClasses} {...props}>
      {children}
    </a>
  );
};
