// Dual Range Slider Component for Price and Weight Filtering
// Following UI Component Patterns and Accessibility Standards

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  className?: string;
}

export function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  step = 1,
  formatValue = (val) => val.toString(),
  disabled = false,
  className = "",
}: RangeSliderProps) {
  const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
  const [tempValue, setTempValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const minThumbRef = useRef<HTMLDivElement>(null);
  const maxThumbRef = useRef<HTMLDivElement>(null);

  // Update temp value when prop value changes
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  // Calculate percentage for positioning
  const getPercentage = useCallback(
    (val: number) => {
      return ((val - min) / (max - min)) * 100;
    },
    [min, max]
  );

  // Calculate value from mouse position
  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return min;

      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(100, ((clientX - rect.left) / rect.width) * 100)
      );
      const rawValue = min + (percentage / 100) * (max - min);

      // Round to nearest step
      return Math.round(rawValue / step) * step;
    },
    [min, max, step]
  );

  // Handle mouse down on thumbs
  const handleMouseDown =
    (thumb: "min" | "max") => (event: React.MouseEvent) => {
      if (disabled) return;

      event.preventDefault();
      setIsDragging(thumb);
    };

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || disabled) return;

      const newValue = getValueFromPosition(event.clientX);

      setTempValue((prev) => {
        if (isDragging === "min") {
          return [Math.min(newValue, prev[1]), prev[1]];
        } else {
          return [prev[0], Math.max(newValue, prev[0])];
        }
      });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        onChange(tempValue);
        setIsDragging(null);
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, tempValue, onChange, getValueFromPosition, disabled]);

  // Handle keyboard navigation
  const handleKeyDown =
    (thumb: "min" | "max") => (event: React.KeyboardEvent) => {
      if (disabled) return;

      let newValue = [...tempValue] as [number, number];
      const currentValue = thumb === "min" ? tempValue[0] : tempValue[1];

      switch (event.key) {
        case "ArrowLeft":
        case "ArrowDown":
          event.preventDefault();
          if (thumb === "min") {
            newValue[0] = Math.max(min, currentValue - step);
          } else {
            newValue[1] = Math.max(newValue[0], currentValue - step);
          }
          break;
        case "ArrowRight":
        case "ArrowUp":
          event.preventDefault();
          if (thumb === "min") {
            newValue[0] = Math.min(newValue[1], currentValue + step);
          } else {
            newValue[1] = Math.min(max, currentValue + step);
          }
          break;
        case "Home":
          event.preventDefault();
          if (thumb === "min") {
            newValue[0] = min;
          } else {
            newValue[1] = newValue[0];
          }
          break;
        case "End":
          event.preventDefault();
          if (thumb === "min") {
            newValue[0] = newValue[1];
          } else {
            newValue[1] = max;
          }
          break;
        default:
          return;
      }

      setTempValue(newValue);
      onChange(newValue);
    };

  // Handle track click
  const handleTrackClick = (event: React.MouseEvent) => {
    if (disabled || isDragging) return;

    const newValue = getValueFromPosition(event.clientX);
    const [minVal, maxVal] = tempValue;

    // Determine which thumb to move based on proximity
    const distToMin = Math.abs(newValue - minVal);
    const distToMax = Math.abs(newValue - maxVal);

    let newRange: [number, number];
    if (distToMin <= distToMax) {
      newRange = [Math.min(newValue, maxVal), maxVal];
    } else {
      newRange = [minVal, Math.max(newValue, minVal)];
    }

    setTempValue(newRange);
    onChange(newRange);
  };

  const minPercentage = getPercentage(tempValue[0]);
  const maxPercentage = getPercentage(tempValue[1]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Label and Values */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="text-sm text-muted-foreground">
          {formatValue(tempValue[0])} - {formatValue(tempValue[1])}
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative px-3">
        {/* Track */}
        <div
          ref={sliderRef}
          className={`
            relative h-2 bg-muted rounded-full cursor-pointer
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          onClick={handleTrackClick}
        >
          {/* Active Range */}
          <div
            className="absolute h-2 bg-primary rounded-full"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`,
            }}
          />

          {/* Min Thumb */}
          <div
            ref={minThumbRef}
            className={`
              absolute w-5 h-5 bg-background border-2 border-primary rounded-full 
              transform -translate-x-1/2 -translate-y-1/2 top-1/2 cursor-grab
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              transition-shadow duration-200
              ${isDragging === "min" ? "cursor-grabbing scale-110" : ""}
              ${disabled ? "cursor-not-allowed opacity-50" : "hover:scale-110"}
            `}
            style={{ left: `${minPercentage}%` }}
            onMouseDown={handleMouseDown("min")}
            onKeyDown={handleKeyDown("min")}
            tabIndex={disabled ? -1 : 0}
            role="slider"
            aria-label={`${label} minimum value`}
            aria-valuemin={min}
            aria-valuemax={tempValue[1]}
            aria-valuenow={tempValue[0]}
            aria-valuetext={formatValue(tempValue[0])}
          />

          {/* Max Thumb */}
          <div
            ref={maxThumbRef}
            className={`
              absolute w-5 h-5 bg-background border-2 border-primary rounded-full 
              transform -translate-x-1/2 -translate-y-1/2 top-1/2 cursor-grab
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              transition-shadow duration-200
              ${isDragging === "max" ? "cursor-grabbing scale-110" : ""}
              ${disabled ? "cursor-not-allowed opacity-50" : "hover:scale-110"}
            `}
            style={{ left: `${maxPercentage}%` }}
            onMouseDown={handleMouseDown("max")}
            onKeyDown={handleKeyDown("max")}
            tabIndex={disabled ? -1 : 0}
            role="slider"
            aria-label={`${label} maximum value`}
            aria-valuemin={tempValue[0]}
            aria-valuemax={max}
            aria-valuenow={tempValue[1]}
            aria-valuetext={formatValue(tempValue[1])}
          />
        </div>

        {/* Min/Max Labels */}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Min
          </label>
          <input
            type="number"
            min={min}
            max={tempValue[1]}
            step={step}
            value={tempValue[0]}
            onChange={(e) => {
              const newMin = Math.max(
                min,
                Math.min(tempValue[1], Number(e.target.value))
              );
              const newRange: [number, number] = [newMin, tempValue[1]];
              setTempValue(newRange);
              onChange(newRange);
            }}
            disabled={disabled}
            className="w-full px-2 py-1 text-sm bg-input border border-border rounded 
                       text-foreground focus:ring-1 focus:ring-ring focus:border-ring
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            Max
          </label>
          <input
            type="number"
            min={tempValue[0]}
            max={max}
            step={step}
            value={tempValue[1]}
            onChange={(e) => {
              const newMax = Math.min(
                max,
                Math.max(tempValue[0], Number(e.target.value))
              );
              const newRange: [number, number] = [tempValue[0], newMax];
              setTempValue(newRange);
              onChange(newRange);
            }}
            disabled={disabled}
            className="w-full px-2 py-1 text-sm bg-input border border-border rounded 
                       text-foreground focus:ring-1 focus:ring-ring focus:border-ring
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
