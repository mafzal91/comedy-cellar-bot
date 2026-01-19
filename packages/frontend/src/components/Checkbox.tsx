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
        <div className="group grid size-4 grid-cols-1">
          <input
            id={label}
            name={label}
            type="checkbox"
            aria-describedby={`${label}-description`}
            className={clsx(
              "col-start-1 row-start-1 appearance-none rounded-sm",
              "border border-gray-300 bg-white",
              "checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary",
              "focus-visible:bg-primary focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              "disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
            )}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={
              onChange
                ? (e) => onChange((e.target as HTMLInputElement).checked)
                : undefined
            }
          />
        </div>
      </div>
      <div className="text-sm/6">
        <label htmlFor={label} className="font-medium text-gray-900">
          {displayLabel}
        </label>
        <p id={`${label}-description`} className="text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}
