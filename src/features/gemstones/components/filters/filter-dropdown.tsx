// Multi-Select Filter Dropdown Component
// Following UI Component Patterns and Accessibility Standards

"use client";

import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

interface FilterDropdownOption<T = string> {
  value: T;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface FilterDropdownProps<T = string> {
  label: string;
  options: FilterDropdownOption<T>[];
  selectedValues: T[];
  onSelectionChange: (values: T[]) => void;
  placeholder?: string;
  maxDisplayItems?: number;
  disabled?: boolean;
  className?: string;
}

export function FilterDropdown<T extends string = string>({
  label,
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select options...",
  maxDisplayItems = 3,
  disabled = false,
  className = "",
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "Escape":
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleToggleOption = (value: T) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const getDisplayText = (): string => {
    if (selectedValues.length === 0) {
      return placeholder;
    }

    if (selectedValues.length <= maxDisplayItems) {
      const labels = selectedValues.map(
        (value) => options.find((opt) => opt.value === value)?.label || value
      );
      return labels.join(", ");
    }

    return `${selectedValues.length} selected`;
  };

  const hasSelection = selectedValues.length > 0;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
        {hasSelection && (
          <span className="ml-2 text-xs text-primary font-medium">
            ({selectedValues.length})
          </span>
        )}
      </label>

      {/* Dropdown Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left bg-input border border-border rounded-lg
          text-foreground placeholder:text-muted-foreground
          focus:ring-2 focus:ring-ring focus:border-ring 
          transition-colors duration-200
          flex items-center justify-between
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-ring/50 cursor-pointer"
          }
          ${isOpen ? "ring-2 ring-ring border-ring" : ""}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label} filter`}
      >
        <span
          className={`truncate ${
            hasSelection ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {getDisplayText()}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* Clear All Option */}
          {hasSelection && (
            <>
              <button
                type="button"
                onClick={handleClearAll}
                className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-muted/50 transition-colors duration-150"
              >
                Clear all ({selectedValues.length})
              </button>
              <div className="border-t border-border" />
            </>
          )}

          {/* Options */}
          <div className="py-1">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              const isDisabled = option.disabled;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    !isDisabled && handleToggleOption(option.value)
                  }
                  disabled={isDisabled}
                  className={`
                    w-full px-3 py-2 text-left text-sm transition-colors duration-150
                    flex items-center justify-between
                    ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-muted/50 cursor-pointer"
                    }
                    ${
                      isSelected
                        ? "bg-muted text-foreground"
                        : "text-popover-foreground"
                    }
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="truncate">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({option.count})
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <CheckIcon className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* No options message */}
          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
