import { FunctionalComponent } from "preact";
import { ComponentChildren, JSX } from "preact";

import clsx from "clsx";

import { Eyebrow } from "./Eyebrow";

type PageHeaderProps = {
  eyebrow?: ComponentChildren;
  title: ComponentChildren;
  subline?: ComponentChildren;
  className?: string;
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, "title">;

export const PageHeader: FunctionalComponent<PageHeaderProps> = ({
  eyebrow,
  title,
  subline,
  className,
  ...props
}) => {
  return (
    <div className={clsx("flex flex-col gap-1", className)} {...props}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1 className="font-display text-d-xl leading-none text-text">{title}</h1>
      {subline ? <p className="font-sans text-body text-muted mt-2">{subline}</p> : null}
    </div>
  );
};
