import { JSX } from "preact";

import clsx from "clsx";

type InputProps = JSX.HTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={clsx(
        "block w-full bg-surface text-text border-hair border-line rounded-field px-3.5 py-3",
        "font-sans text-body placeholder:text-placeholder outline-none",
        "focus:shadow-[3px_3px_0_#F3C44C]",
        className
      )}
    />
  );
}
