import clsx from "clsx";

export interface SegmentedToggleOption<T extends string = string> {
  label: string;
  value: T;
}

export interface SegmentedToggleProps<T extends string = string> {
  options: SegmentedToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedToggle<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: SegmentedToggleProps<T>) {
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1 border-hair border-line rounded-pill p-1 bg-surface",
        className,
      )}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={clsx(
              "rounded-pill px-3 py-1 font-sans text-caption transition",
              active
                ? "bg-solid text-solid-fg"
                : "text-text hover:bg-track",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
