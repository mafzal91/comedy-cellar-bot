import { FunctionalComponent, JSX } from "preact";

import clsx from "clsx";

type LinkProps = JSX.HTMLAttributes<HTMLAnchorElement> & {
  href: string;
  target?: string;
  rel?: string;
};

export const Link: FunctionalComponent<LinkProps> = ({
  className,
  children,
  href,
  target,
  rel,
  ...props
}) => {
  const baseClasses = "font-small text-blue-600 hover:underline";

  const linkClasses = clsx(baseClasses, className);

  return (
    <a className={linkClasses} href={href} target={target} rel={rel} {...props}>
      {children}
    </a>
  );
};
