"use client";

import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export function QuantitySelector({
  value,
  onChange,
  disabled = false,
  min = 1,
  max = 99,
}: QuantitySelectorProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  // Sync input value when prop changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleIncrement = () => {
    const newValue = Math.min(value + 1, max);
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - 1, min);
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Allow empty string for typing
    if (input === "") {
      setInputValue("");
      return;
    }

    // Only allow numeric input
    const numericValue = input.replace(/[^0-9]/g, "");
    if (numericValue !== input) {
      return;
    }

    setInputValue(numericValue);

    // Parse and validate the number
    const parsedValue = parseInt(numericValue, 10);
    if (!isNaN(parsedValue)) {
      const clampedValue = Math.max(min, Math.min(parsedValue, max));
      if (clampedValue !== value) {
        onChange(clampedValue);
      }
    }
  };

  const handleInputBlur = () => {
    // On blur, ensure we have a valid value
    const parsedValue = parseInt(inputValue, 10);
    if (isNaN(parsedValue) || parsedValue < min) {
      setInputValue(min.toString());
      onChange(min);
    } else if (parsedValue > max) {
      setInputValue(max.toString());
      onChange(max);
    } else {
      setInputValue(parsedValue.toString());
      onChange(parsedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
    } else if (e.key === "Escape") {
      // Reset to current value on escape
      setInputValue(value.toString());
    }
  };

  return (
    <div className="flex items-center border border-gray-300 rounded-md">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className="px-2 py-1 h-8 w-8 rounded-none border-r border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        aria-label="Decrease quantity"
      >
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      </Button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="w-12 text-center text-sm border-0 focus:ring-0 focus:outline-none disabled:opacity-50"
        aria-label="Quantity"
        min={min}
        max={max}
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className="px-2 py-1 h-8 w-8 rounded-none border-l border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        aria-label="Increase quantity"
      >
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </Button>
    </div>
  );
}
