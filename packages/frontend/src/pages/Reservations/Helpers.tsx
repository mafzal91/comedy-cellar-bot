import type { ComponentChildren } from "preact";

export const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ComponentChildren;
}) => (
  <div className="pb-6">
    <h2 className="font-display text-d-sm tracking-cap text-text">{title}</h2>
    {description ? (
      <p className="mt-1 font-sans text-caption text-muted">{description}</p>
    ) : null}
    <div className="mt-4">{children}</div>
  </div>
);

export const Field = ({
  label,
  labelText,
  children,
}: {
  label: string;
  labelText: string;
  children: ComponentChildren;
}) => (
  <div>
    <label
      htmlFor={label}
      className="mb-[7px] block font-mono text-meta uppercase text-muted"
    >
      {labelText}
    </label>
    {children}
  </div>
);

export const FieldWrapper = ({ children }: { children: ComponentChildren }) => (
  <div className="grid grid-cols-1 gap-4">{children}</div>
);
