import { FunctionalComponent, JSX } from "preact";

import clsx from "clsx";

interface CustomButtonProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "solid" | "outline" | "reserve";
}

// Use Preact's JSXInternal.HTMLAttributes for button element attributes
type ButtonProps = CustomButtonProps &
  JSX.HTMLAttributes<HTMLButtonElement> & {
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
  };

export const Button: FunctionalComponent<ButtonProps> = ({
  size = "md",
  variant = "solid",
  className,
  children,
  disabled,
  type,
  ...props
}) => {
  const baseClasses =
    "rounded-pill font-sans font-semibold transition";

  const variantClasses = {
    solid: "bg-solid text-solid-fg hover:bg-solid-hover",
    outline:
      "bg-surface text-text border-hair border-line hover:bg-brand hover:text-brand-fg",
    reserve:
      "bg-solid text-solid-fg hover:bg-brand hover:text-brand-fg",
  };

  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-2 py-1 text-sm",
    md: "px-2.5 py-1.5 text-sm",
    lg: "px-3 py-2 text-sm",
    xl: "px-3.5 py-2.5 text-sm",
  };

  const buttonClasses = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  return (
    <button type={type} className={buttonClasses} disabled={disabled} {...props}>
      {children}
    </button>
  );
};
