/**
 * Advanced Filters V2 (Controlled - Visual Version)
 *
 * Fully controlled visual filter component with interactive UI elements.
 * Zero internal state - receives all state from parent and notifies via onChange.
 *
 * Features:
 * - Visual cut shape selector with icons
 * - Color picker with color circles
 * - Diamond grade selector
 * - Price/weight range sliders
 * - All fully controlled
 */

"use client";

import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

import type { AdvancedGemstoneFilters } from "../../types/filter.types";
import type { FilterOptions } from "./advanced-filters-controlled";
import { RangeSlider } from "./range-slider";
import { useCallback } from "react";
import { useTranslations } from "next-intl";

// Visual Cut Shapes Component (Controlled)
const CutShapeSelector = ({
  selectedCuts,
  onCutChange,
  disabled = false,
}: {
  selectedCuts: string[];
  onCutChange: (cuts: string[]) => void;
  disabled?: boolean;
}) => {
  const cutShapes = [
    { value: "round", label: "Round", icon: "●" },
    { value: "oval", label: "Oval", icon: "○" },
    { value: "marquise", label: "Marquise", icon: "◊" },
    { value: "pear", label: "Pear", icon: "♦" },
    { value: "emerald", label: "Emerald", icon: "▭" },
    { value: "princess", label: "Princess", icon: "■" },
    { value: "cushion", label: "Cushion", icon: "▢" },
    { value: "radiant", label: "Radiant", icon: "▦" },
    { value: "fantasy", label: "Fantasy", icon: "✦" },
  ];

  const toggleCut = (cut: string) => {
    if (disabled) return;
    if (selectedCuts.includes(cut)) {
      onCutChange(selectedCuts.filter((c) => c !== cut));
    } else {
      onCutChange([...selectedCuts, cut]);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Cut Shape</h3>
      <div className="grid grid-cols-3 gap-2">
        {cutShapes.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => toggleCut(value)}
            disabled={disabled}
            className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedCuts.includes(value)
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              <span
                className={`text-2xl ${
                  selectedCuts.includes(value)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {icon}
              </span>
              <span
                className={`text-xs font-medium ${
                  selectedCuts.includes(value)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {selectedCuts.includes(value) && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Visual Color Picker Component (Controlled)
const ColorPicker = ({
  selectedColors,
  onColorChange,
  disabled = false,
}: {
  selectedColors: string[];
  onColorChange: (colors: string[]) => void;
  disabled?: boolean;
}) => {
  const colorOptions = [
    { value: "red", label: "Red", gradient: "from-red-400 to-red-600" },
    { value: "blue", label: "Blue", gradient: "from-blue-400 to-blue-600" },
    { value: "green", label: "Green", gradient: "from-green-400 to-green-600" },
    {
      value: "yellow",
      label: "Yellow",
      gradient: "from-yellow-300 to-yellow-500",
    },
    { value: "pink", label: "Pink", gradient: "from-pink-400 to-pink-600" },
    { value: "white", label: "White", gradient: "from-gray-100 to-gray-300" },
    { value: "black", label: "Black", gradient: "from-gray-700 to-gray-900" },
    {
      value: "colorless",
      label: "Colorless",
      gradient: "from-gray-50 to-gray-200",
    },
  ];

  const diamondGrades = [
    { value: "D", label: "D", description: "Absolutely colorless" },
    { value: "E", label: "E", description: "Colorless" },
    { value: "F", label: "F", description: "Colorless" },
    { value: "G", label: "G", description: "Near colorless" },
    { value: "H", label: "H", description: "Near colorless" },
    { value: "I", label: "I", description: "Near colorless" },
    { value: "J", label: "J", description: "Near colorless" },
  ];

  const toggleColor = (color: string) => {
    if (disabled) return;
    if (selectedColors.includes(color)) {
      onColorChange(selectedColors.filter((c) => c !== color));
    } else {
      onColorChange([...selectedColors, color]);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Color</h3>

      {/* Colored Gemstones */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">
          Colored Gemstones
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {colorOptions.map(({ value, label, gradient }) => (
            <button
              key={value}
              onClick={() => toggleColor(value)}
              disabled={disabled}
              className={`relative p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedColors.includes(value)
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} shadow-inner border border-border`}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {label}
                </span>
              </div>
              {selectedColors.includes(value) && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Diamond Color Grades */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Diamond Grades</h4>
        <div className="grid grid-cols-7 gap-1">
          {diamondGrades.map(({ value, label, description }) => (
            <button
              key={value}
              onClick={() => toggleColor(value)}
              disabled={disabled}
              title={description}
              className={`relative p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedColors.includes(value)
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="flex flex-col items-center">
                <span
                  className={`text-sm font-bold ${
                    selectedColors.includes(value)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
              {selectedColors.includes(value) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-[10px]">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface AdvancedFiltersV2ControlledProps {
  filters: AdvancedGemstoneFilters;
  onChange: (filters: AdvancedGemstoneFilters) => void;
  options: FilterOptions;
  loading?: boolean;
}

export function AdvancedFiltersV2Controlled({
  filters,
  onChange,
  options,
  loading = false,
}: AdvancedFiltersV2ControlledProps) {
  const t = useTranslations("filters.advanced");

  // Handle search input
  const handleSearchChange = useCallback(
    (value: string) => {
      onChange({ ...filters, search: value || undefined });
    },
    [filters, onChange]
  );

  // Handle cut changes
  const handleCutChange = useCallback(
    (cuts: string[]) => {
      onChange({
        ...filters,
        cuts: cuts.length > 0 ? (cuts as any[]) : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle color changes
  const handleColorChange = useCallback(
    (colors: string[]) => {
      onChange({
        ...filters,
        colors: colors.length > 0 ? (colors as any[]) : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle price range
  const handlePriceRangeChange = useCallback(
    (min: number, max: number) => {
      if (min > 0 || max < 5000000) {
        onChange({ ...filters, priceRange: { min, max, currency: "USD" } });
      } else {
        onChange({ ...filters, priceRange: undefined });
      }
    },
    [filters, onChange]
  );

  // Handle weight range
  const handleWeightRangeChange = useCallback(
    (min: number, max: number) => {
      if (min > 0 || max < 20) {
        onChange({ ...filters, weightRange: { min, max } });
      } else {
        onChange({ ...filters, weightRange: undefined });
      }
    },
    [filters, onChange]
  );

  // Handle stock filter
  const handleStockChange = useCallback(
    (inStockOnly: boolean) => {
      onChange({ ...filters, inStockOnly });
    },
    [filters, onChange]
  );

  // Clear all filters
  const handleClearAll = useCallback(() => {
    onChange({});
  }, [onChange]);

  return (
    <div className="bg-card rounded-lg border border-border p-4 sm:p-6 space-y-6">
      {/* Header with Clear All */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Visual Filters
        </h3>
        <button
          onClick={handleClearAll}
          disabled={loading}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {t("clearAll")}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={filters.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          disabled={loading}
          className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
        />
        {filters.search && (
          <button
            onClick={() => handleSearchChange("")}
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Visual Filters */}
      <div className="space-y-6">
        <CutShapeSelector
          selectedCuts={filters.cuts || []}
          onCutChange={handleCutChange}
          disabled={loading}
        />

        <ColorPicker
          selectedColors={filters.colors || []}
          onColorChange={handleColorChange}
          disabled={loading}
        />

        {/* Range Filters */}
        <div className="space-y-4">
          <RangeSlider
            label={t("priceRange")}
            min={0}
            max={5000000}
            step={10000}
            value={[
              filters.priceRange?.min || 0,
              filters.priceRange?.max || 5000000,
            ]}
            onChange={([min, max]) => handlePriceRangeChange(min, max)}
            formatValue={(value) =>
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(value / 100)
            }
            disabled={loading}
          />

          <RangeSlider
            label={t("weightRange")}
            min={0}
            max={20}
            step={0.1}
            value={[
              filters.weightRange?.min || 0,
              filters.weightRange?.max || 20,
            ]}
            onChange={([min, max]) => handleWeightRangeChange(min, max)}
            formatValue={(value) => `${value.toFixed(2)}ct`}
            disabled={loading}
          />
        </div>

        {/* Stock Filter */}
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStockOnly || false}
            onChange={(e) => handleStockChange(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-0 disabled:opacity-50"
          />
          <span className="text-sm text-foreground">{t("inStockOnly")}</span>
        </label>
      </div>
    </div>
  );
}
