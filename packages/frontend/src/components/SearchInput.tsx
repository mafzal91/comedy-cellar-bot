import { useEffect, useState } from "preact/hooks";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

import { Spinner } from "./Spinner";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function SearchInput({
  placeholder = "Search...",
  value = "",
  onSearch,
  debounceMs = 400,
  className = "",
  disabled = false,
  loading = false,
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== value) {
        // Only search if there are at least 2 characters or if clearing the search
        if (inputValue.length >= 2 || inputValue.length === 0) {
          onSearch(inputValue);
        }
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, debounceMs, onSearch, value]);

  // Update internal state when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleClear = () => {
    setInputValue("");
    onSearch(""); // Always clear when explicitly clearing
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-pill border-hair border-line bg-bg px-4.5 py-3",
        "focus-within:shadow-[3px_3px_0_var(--color-brand)]",
        disabled && "opacity-60",
        className,
      )}
    >
      <MagnifyingGlassIcon className="size-4 select-none font-mono text-caption leading-none text-muted" />
      <input
        type="text"
        value={inputValue}
        onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={placeholder}
        className="min-w-0 flex-1 border-none bg-transparent font-sans text-body text-text outline-none placeholder:text-placeholder disabled:cursor-not-allowed"
      />

      {/* Loading spinner */}
      {loading && <Spinner size={5} />}

      {/* Clear button */}
      {inputValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center leading-none text-faint hover:text-text"
        >
          <span aria-hidden="true" className="text-body">
            ×
          </span>
          <span className="sr-only">Clear search</span>
        </button>
      )}
    </div>
  );
}
