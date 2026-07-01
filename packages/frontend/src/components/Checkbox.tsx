import clsx from "clsx";

type CheckboxProps = {
  label: string;
  displayLabel: string;
  description: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  defaultChecked?: boolean;
};

export function Checkbox({
  label,
  displayLabel,
  description,
  checked,
  onChange,
  defaultChecked,
}: CheckboxProps) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 shrink-0 items-center">
        <div className="group relative grid size-6 grid-cols-1">
          <input
            id={label}
            name={label}
            type="checkbox"
            aria-describedby={`${label}-description`}
            className={clsx(
              "peer col-start-1 row-start-1 size-6 appearance-none rounded-[5px]",
              "border-hair border-line bg-surface",
              "checked:bg-brand",
              "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              "disabled:cursor-not-allowed disabled:opacity-50 forced-colors:appearance-auto"
            )}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={
              onChange
                ? (e) => onChange((e.target as HTMLInputElement).checked)
                : undefined
            }
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            className="pointer-events-none invisible col-start-1 row-start-1 size-4 justify-self-center self-center text-ink peer-checked:visible"
          >
            <path
              d="M3 8.5L6.5 12L13 4"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div className="text-body">
        <label htmlFor={label} className="font-medium text-text">
          {displayLabel}
        </label>
        <p id={`${label}-description`} className="text-muted">
          {description}
        </p>
      </div>
    </div>
  );
}
