import { FunctionalComponent, JSX } from "preact";

import clsx from "clsx";

type LinkProps = JSX.HTMLAttributes<HTMLAnchorElement> & {
  href: string;
  target?: string;
  rel?: string;
  variant?: "default" | "underline" | "plain";
};

export const Link: FunctionalComponent<LinkProps> = ({
  className,
  children,
  href,
  target,
  rel,
  variant = "default",
  ...props
}) => {
  const baseClasses = "font-sans";

  const variantClasses = {
    default: "text-text hover:underline",
    underline:
      "inline text-text no-underline border-b-2 border-brand pb-0.5 hover:border-brand-hover",
    // No color classes — the caller owns color via className.
    plain: "",
  };

  const linkClasses = clsx(baseClasses, variantClasses[variant], className);

  return (
    <a className={linkClasses} href={href} target={target} rel={rel} {...props}>
      {children}
    </a>
  );
};
