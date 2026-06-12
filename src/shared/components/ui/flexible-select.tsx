"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/shared/components/ui/input";

interface FlexibleSelectOption {
  value: string;
  label: string;
}

interface FlexibleSelectProps {
  value: string;
  onChange: (value: string, isKnownValue: boolean) => void;
  options: FlexibleSelectOption[];
  placeholder?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  id?: string;
}

/**
 * FlexibleSelect - A combobox-style input that allows both selection from
 * predefined options and free-text entry.
 *
 * Used for gemstone properties where admins need flexibility beyond enum values.
 * Contract: FLEX-C1.1
 */
export function FlexibleSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  error,
  disabled,
  id,
}: FlexibleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter options based on input
  useEffect(() => {
    if (!inputValue) {
      setFilteredOptions(options);
    } else {
      const lowerInput = inputValue.toLowerCase();
      const filtered = options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(lowerInput) ||
          opt.value.toLowerCase().includes(lowerInput)
      );
      setFilteredOptions(filtered);
    }
  }, [inputValue, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openDropdown = useCallback(
    (showAllOptions = false) => {
      if (showAllOptions) {
        setFilteredOptions(options);
      }
      setIsOpen(true);
    },
    [options]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setIsOpen(true);

      // Check if the input matches a known option
      const matchedOption = options.find(
        (opt) =>
          opt.value.toLowerCase() === newValue.toLowerCase() ||
          opt.label.toLowerCase() === newValue.toLowerCase()
      );

      onChange(newValue, !!matchedOption);
    },
    [options, onChange]
  );

  const showAllOptions = useCallback(() => {
    setFilteredOptions(options);
    setIsOpen(true);
  }, [options]);

  const handleFocus = useCallback(() => {
    setFilteredOptions(options);
    setIsOpen(true);
  }, [options]);

  const handleOptionSelect = useCallback(
    (option: FlexibleSelectOption) => {
      setInputValue(option.label);
      onChange(option.value, true);
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    onChange("", false);
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      } else if (e.key === "ArrowDown" && !isOpen) {
        setIsOpen(true);
      } else if (e.key === "Enter" && isOpen && filteredOptions.length > 0) {
        e.preventDefault();
        handleOptionSelect(filteredOptions[0]);
      }
    },
    [isOpen, filteredOptions, handleOptionSelect]
  );

  // Match by code or localized label (admin UIs often show label while value stays a code)
  const isKnownValue = options.some(
    (opt) =>
      opt.value.toLowerCase() === inputValue.toLowerCase() ||
      opt.label.toLowerCase() === inputValue.toLowerCase()
  );

  const isOptionSelected = (opt: FlexibleSelectOption) =>
    opt.value.toLowerCase() === inputValue.toLowerCase() ||
    opt.label.toLowerCase() === inputValue.toLowerCase();

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pr-16",
            error && "border-red-500",
            className
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded"
              tabIndex={-1}
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && showAllOptions()}
            className="p-1 hover:bg-muted rounded"
            tabIndex={-1}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            <ul className="py-1">
              {filteredOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => handleOptionSelect(option)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent",
                    isOptionSelected(option) && "bg-accent"
                  )}
                >
                  <span className="text-sm">{option.label}</span>
                  {isOptionSelected(option) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {inputValue ? (
                <span>
                  Custom value: <strong>{inputValue}</strong>
                </span>
              ) : (
                "No options"
              )}
            </div>
          )}

          {/* Show custom value indicator if input doesn't match any option */}
          {inputValue && !isKnownValue && filteredOptions.length > 0 && (
            <div className="border-t px-3 py-2 text-xs text-muted-foreground bg-muted/50">
              Press Enter to use custom value: <strong>{inputValue}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
