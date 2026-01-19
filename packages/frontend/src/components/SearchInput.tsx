import { useEffect, useState } from "preact/hooks";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

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
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon className="size-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={inputValue}
        onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`block w-full rounded-md border-0 bg-white py-1.5 px-10 text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 ${
          disabled ? "bg-gray-50 text-gray-500" : ""
        }`}
      />

      {/* Loading spinner */}
      {loading && (
        <div className="pointer-events-none absolute inset-y-0 right-8 flex items-center">
          <ArrowPathIcon className="size-4 animate-spin text-gray-400" />
        </div>
      )}

      {/* Clear button */}
      {inputValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-gray-600"
        >
          <XMarkIcon className="size-5 text-gray-400" />
          <span className="sr-only">Clear search</span>
        </button>
      )}
    </div>
  );
}
