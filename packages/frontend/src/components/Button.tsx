import { FunctionalComponent, JSX } from "preact";

import clsx from "clsx";

interface CustomButtonProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

// Use Preact's JSXInternal.HTMLAttributes for button element attributes
type ButtonProps = CustomButtonProps &
  JSX.HTMLAttributes<HTMLButtonElement> & {
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
  };

export const Button: FunctionalComponent<ButtonProps> = ({
  size = "md",
  className,
  children,
  disabled,
  type,
  ...props
}) => {
  const baseClasses =
    "rounded-sm bg-white text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 font-semibold";

  const sizeClasses = {
    xs: "px-2 py-1 text-xs",
    sm: "px-2 py-1 text-sm",
    md: "px-2.5 py-1.5 text-sm",
    lg: "px-3 py-2 text-sm",
    xl: "px-3.5 py-2.5 text-sm",
  };

  const buttonClasses = clsx(
    baseClasses,
    sizeClasses[size],
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  return (
    <button type={type} className={buttonClasses} {...props}>
      {children}
    </button>
  );
};
