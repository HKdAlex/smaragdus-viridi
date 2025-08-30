"use client";

import type {
  AdvancedGemstoneFilters,
  FilterOptions,
} from "../../types/filter.types";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect } from "react";

import { useAdvancedFilters } from "../../hooks/use-advanced-filters";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

// Visual Cut Shapes Component
const CutShapeSelector = ({
  selectedCuts,
  onCutChange,
}: {
  selectedCuts: string[];
  onCutChange: (cuts: string[]) => void;
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
            className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
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

// Visual Color Picker Component
const ColorPicker = ({
  selectedColors,
  onColorChange,
  t,
}: {
  selectedColors: string[];
  onColorChange: (colors: string[]) => void;
  t: any;
}) => {
  const colorOptions = [
    {
      value: "red",
      label: "Red",
      hex: "#DC143C",
      gradient: "from-red-400 to-red-600",
    },
    {
      value: "blue",
      label: "Blue",
      hex: "#4169E1",
      gradient: "from-blue-400 to-blue-600",
    },
    {
      value: "green",
      label: "Green",
      hex: "#32CD32",
      gradient: "from-green-400 to-green-600",
    },
    {
      value: "yellow",
      label: "Yellow",
      hex: "#FFD700",
      gradient: "from-yellow-300 to-yellow-500",
    },
    {
      value: "pink",
      label: "Pink",
      hex: "#FF69B4",
      gradient: "from-pink-400 to-pink-600",
    },
    {
      value: "white",
      label: "White",
      hex: "#FFFFFF",
      gradient: "from-gray-100 to-gray-300",
    },
    {
      value: "black",
      label: "Black",
      hex: "#2F2F2F",
      gradient: "from-gray-700 to-gray-900",
    },
    {
      value: "colorless",
      label: "Colorless",
      hex: "#F8F8FF",
      gradient: "from-gray-50 to-gray-200",
    },
  ];

  const diamondGrades = [
    {
      value: "D",
      label: "D",
      hex: "#FFFFFF",
      description: "Absolutely colorless",
    },
    { value: "E", label: "E", hex: "#FEFEFE", description: "Colorless" },
    { value: "F", label: "F", hex: "#FDFDFD", description: "Colorless" },
    { value: "G", label: "G", hex: "#FBFBFB", description: "Near colorless" },
    { value: "H", label: "H", hex: "#F9F9F9", description: "Near colorless" },
    { value: "I", label: "I", hex: "#F7F7F7", description: "Near colorless" },
    { value: "J", label: "J", hex: "#F5F5F5", description: "Near colorless" },
  ];

  const toggleColor = (color: string) => {
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
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {t("coloredGemstones")}
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {colorOptions.map(({ value, label, gradient }) => (
            <button
              key={value}
              onClick={() => toggleColor(value)}
              className={`relative p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
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
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Diamond Color Grades */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Diamond Color Grades
        </h4>
        <div className="grid grid-cols-7 gap-1">
          {diamondGrades.map(({ value, label, hex, description }) => (
            <button
              key={value}
              onClick={() => toggleColor(value)}
              className={`relative p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 group ${
                selectedColors.includes(value)
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/50"
              }`}
              title={description}
            >
              <div className="flex flex-col items-center space-y-1">
                <div
                  className="w-6 h-6 rounded-full shadow-inner border border-border"
                  style={{ backgroundColor: hex }}
                />
                <span className="text-xs font-bold text-foreground">
                  {label}
                </span>
              </div>
              {selectedColors.includes(value) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Visual Clarity Selector
const ClaritySelector = ({
  selectedClarities,
  onClarityChange,
}: {
  selectedClarities: string[];
  onClarityChange: (clarities: string[]) => void;
}) => {
  const clarityGrades = [
    { value: "FL", label: "FL", description: "Flawless", quality: "excellent" },
    {
      value: "IF",
      label: "IF",
      description: "Internally Flawless",
      quality: "excellent",
    },
    {
      value: "VVS1",
      label: "VVS1",
      description: "Very Very Slightly Included",
      quality: "excellent",
    },
    {
      value: "VVS2",
      label: "VVS2",
      description: "Very Very Slightly Included",
      quality: "very-good",
    },
    {
      value: "VS1",
      label: "VS1",
      description: "Very Slightly Included",
      quality: "very-good",
    },
    {
      value: "VS2",
      label: "VS2",
      description: "Very Slightly Included",
      quality: "good",
    },
    {
      value: "SI1",
      label: "SI1",
      description: "Slightly Included",
      quality: "good",
    },
    {
      value: "SI2",
      label: "SI2",
      description: "Slightly Included",
      quality: "fair",
    },
    { value: "I1", label: "I1", description: "Included", quality: "fair" },
  ];

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "from-emerald-400 to-emerald-600";
      case "very-good":
        return "from-blue-400 to-blue-600";
      case "good":
        return "from-yellow-400 to-yellow-600";
      case "fair":
        return "from-orange-400 to-orange-600";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const toggleClarity = (clarity: string) => {
    if (selectedClarities.includes(clarity)) {
      onClarityChange(selectedClarities.filter((c) => c !== clarity));
    } else {
      onClarityChange([...selectedClarities, clarity]);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Clarity Grade</h3>
      <div className="grid grid-cols-3 gap-2">
        {clarityGrades.map(({ value, label, description, quality }) => (
          <button
            key={value}
            onClick={() => toggleClarity(value)}
            className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 group ${
              selectedClarities.includes(value)
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border bg-card hover:border-primary/50"
            }`}
            title={description}
          >
            <div className="flex flex-col items-center space-y-2">
              <div
                className={`w-8 h-2 rounded-full bg-gradient-to-r ${getQualityColor(
                  quality
                )}`}
              />
              <span
                className={`text-sm font-bold ${
                  selectedClarities.includes(value)
                    ? "text-primary"
                    : "text-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {selectedClarities.includes(value) && (
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

// Price Range Cards
const PriceRangeCards = ({
  selectedRange,
  onRangeChange,
}: {
  selectedRange: [number, number];
  onRangeChange: (range: [number, number]) => void;
}) => {
  const priceRanges = [
    { label: "Under $100", range: [0, 10000] as [number, number], icon: "💎" },
    {
      label: "$100 - $500",
      range: [10000, 50000] as [number, number],
      icon: "💍",
    },
    {
      label: "$500 - $1,000",
      range: [50000, 100000] as [number, number],
      icon: "👑",
    },
    {
      label: "$1,000 - $5,000",
      range: [100000, 500000] as [number, number],
      icon: "✨",
    },
    {
      label: "$5,000 - $10,000",
      range: [500000, 1000000] as [number, number],
      icon: "🌟",
    },
    {
      label: "Over $10,000",
      range: [1000000, 10000000] as [number, number],
      icon: "💫",
    },
  ];

  const isSelected = (range: [number, number]) => {
    return selectedRange[0] === range[0] && selectedRange[1] === range[1];
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Price Range</h3>
      <div className="grid grid-cols-2 gap-2">
        {priceRanges.map(({ label, range, icon }) => (
          <button
            key={label}
            onClick={() => onRangeChange(range)}
            className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
              isSelected(range)
                ? "border-green-500 bg-green-500/10 shadow-md text-green-700 dark:text-green-400"
                : "border-border bg-card hover:border-green-500/50 text-muted-foreground"
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              <span className="text-xl">{icon}</span>
              <span className="text-xs font-medium text-center">{label}</span>
            </div>
            {isSelected(range) && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Weight Range Cards
const WeightRangeCards = ({
  selectedRange,
  onRangeChange,
}: {
  selectedRange: [number, number];
  onRangeChange: (range: [number, number]) => void;
}) => {
  const weightRanges = [
    { label: "Under 1ct", range: [0, 1] as [number, number], size: "text-xs" },
    { label: "1-2ct", range: [1, 2] as [number, number], size: "text-sm" },
    { label: "2-3ct", range: [2, 3] as [number, number], size: "text-base" },
    { label: "3-5ct", range: [3, 5] as [number, number], size: "text-lg" },
    { label: "5-10ct", range: [5, 10] as [number, number], size: "text-xl" },
    {
      label: "Over 10ct",
      range: [10, 50] as [number, number],
      size: "text-2xl",
    },
  ];

  const isSelected = (range: [number, number]) => {
    return selectedRange[0] === range[0] && selectedRange[1] === range[1];
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Carat Weight</h3>
      <div className="grid grid-cols-3 gap-2">
        {weightRanges.map(({ label, range, size }) => (
          <button
            key={label}
            onClick={() => onRangeChange(range)}
            className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
              isSelected(range)
                ? "border-purple-500 bg-purple-500/10 shadow-md text-purple-700 dark:text-purple-400"
                : "border-border bg-card hover:border-purple-500/50 text-muted-foreground"
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              <span
                className={`${size} ${
                  isSelected(range)
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-muted-foreground"
                }`}
              >
                ◆
              </span>
              <span className="text-xs font-medium text-center">{label}</span>
            </div>
            {isSelected(range) && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Visual Toggle Cards for Boolean Filters
const ToggleCards = ({
  inStockOnly,
  onInStockChange,
  withCertification,
  onCertificationChange,
  withImages,
  onImagesChange,
}: {
  inStockOnly: boolean;
  onInStockChange: (value: boolean) => void;
  withCertification: boolean;
  onCertificationChange: (value: boolean) => void;
  withImages: boolean;
  onImagesChange: (value: boolean) => void;
}) => {
  const toggleOptions = [
    {
      label: "In Stock Only",
      icon: "📦",
      active: inStockOnly,
      onChange: onInStockChange,
      activeColor:
        "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
      description: "Available now",
    },
    {
      label: "Certified",
      icon: "🏆",
      active: withCertification,
      onChange: onCertificationChange,
      activeColor:
        "border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      description: "With certificate",
    },
    {
      label: "With Images",
      icon: "📸",
      active: withImages,
      onChange: onImagesChange,
      activeColor:
        "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400",
      description: "Photos available",
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Quick Filters</h3>
      <div className="grid grid-cols-3 gap-2">
        {toggleOptions.map(
          ({ label, icon, active, onChange, activeColor, description }) => (
            <button
              key={label}
              onClick={() => onChange(!active)}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                active
                  ? activeColor
                  : "border-border bg-card hover:border-muted-foreground/50 text-muted-foreground"
              }`}
              title={description}
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-medium text-center">{label}</span>
              </div>
              {active && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-current rounded-full flex items-center justify-center opacity-75">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
};

interface AdvancedFiltersV2Props {
  options: FilterOptions;
  onFiltersChange: (filters: AdvancedGemstoneFilters) => void;
  className?: string;
}

export function AdvancedFiltersV2({
  options,
  onFiltersChange,
  className = "",
}: AdvancedFiltersV2Props) {
  const pathname = usePathname();
  const t = useTranslations("gemstones.filters");

  const {
    filters,
    setSearch,
    toggleColor,
    toggleCut,
    toggleClarity,
    setPriceRange,
    setWeightRange,
    toggleInStockOnly,
    toggleHasCertification,
    toggleHasImages,
    resetFilters,
    getActiveFilterCount,
  } = useAdvancedFilters({}, true, pathname);

  const activeFilterCount = getActiveFilterCount();

  // Debounced callback to notify parent of filter changes
  const debouncedOnFiltersChange = useCallback(
    (updatedFilters: AdvancedGemstoneFilters) => {
      const timeoutId = setTimeout(() => {
        onFiltersChange(updatedFilters);
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [onFiltersChange]
  );

  // Notify parent when filters change
  useEffect(() => {
    debouncedOnFiltersChange(filters);
  }, [filters, debouncedOnFiltersChange]);

  return (
    <div
      className={`bg-card rounded-2xl shadow-lg border border-border ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-card-foreground">
              {t("title")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("subtitle")}
            </p>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {t("resetAll", { count: activeFilterCount })}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={filters.search || ""}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-border bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder:text-muted-foreground"
          />
        </div>

        {/* Visual Filters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cut Shape Selector */}
          <CutShapeSelector
            selectedCuts={filters.cuts || []}
            onCutChange={(cuts) => {
              // Reset current cuts and apply new ones
              (filters.cuts || []).forEach((cut) => toggleCut(cut));
              cuts.forEach((cut) => toggleCut(cut as any));
            }}
          />

          {/* Color Picker */}
          <ColorPicker
            selectedColors={filters.colors || []}
            onColorChange={(colors) => {
              (filters.colors || []).forEach((color) => toggleColor(color));
              colors.forEach((color) => toggleColor(color as any));
            }}
            t={t}
          />

          {/* Clarity Selector */}
          <ClaritySelector
            selectedClarities={filters.clarities || []}
            onClarityChange={(clarities) => {
              (filters.clarities || []).forEach((clarity) =>
                toggleClarity(clarity)
              );
              clarities.forEach((clarity) => toggleClarity(clarity as any));
            }}
          />

          {/* Price Range Cards */}
          <PriceRangeCards
            selectedRange={
              filters.priceRange
                ? [filters.priceRange.min, filters.priceRange.max]
                : [0, 1000000]
            }
            onRangeChange={(range) =>
              setPriceRange({ min: range[0], max: range[1], currency: "USD" })
            }
          />

          {/* Weight Range Cards */}
          <WeightRangeCards
            selectedRange={
              filters.weightRange
                ? [filters.weightRange.min, filters.weightRange.max]
                : [0, 20]
            }
            onRangeChange={(range) =>
              setWeightRange({ min: range[0], max: range[1] })
            }
          />

          {/* Toggle Cards */}
          <ToggleCards
            inStockOnly={filters.inStockOnly || false}
            onInStockChange={toggleInStockOnly}
            withCertification={filters.hasCertification || false}
            onCertificationChange={toggleHasCertification}
            withImages={filters.hasImages || false}
            onImagesChange={toggleHasImages}
          />
        </div>

        {/* Results Summary */}
        {activeFilterCount > 0 && (
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">
                  {t("filtersApplied", { count: activeFilterCount })}
                </p>
                <p className="text-xs text-primary/80 mt-1">
                  {t("personalizedResults")}
                </p>
              </div>
              <div className="text-2xl">✨</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
