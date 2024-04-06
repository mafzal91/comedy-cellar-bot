export const Section: React.FC<{ title: string; description?: string }> = ({
  title,
  description,
  children,
}) => (
  <div className="pb-4">
    <h2 className="text-base font-semibold leading-7 text-gray-900">{title}</h2>
    <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
    {children}
  </div>
);

export const Field = ({ label, labelText, children }) => (
  <div className="">
    <label
      htmlFor={label}
      className="block text-sm font-medium leading-6 text-gray-900"
    >
      {labelText}
    </label>
    <div className="mt-2">{children}</div>
  </div>
);

export const FieldWrapper = ({ children }) => (
  <div className="mt-2 grid grid-cols-1 gap-x-2 gap-y-2">{children}</div>
);
