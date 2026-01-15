/**
 * Active Filter Chips Component
 * 
 * Displays active filters as removable pills with color-coding.
 * FILTER-C5.4: Premium filter feedback with animations.
 */

"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import type { AdvancedGemstoneFilters } from "../../types/filter.types";
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion";

interface ActiveFilterChipsProps {
  filters: AdvancedGemstoneFilters;
  onRemoveFilter: (filterKey: keyof AdvancedGemstoneFilters, value?: string) => void;
  onClearAll: () => void;
  className?: string;
}

interface FilterChip {
  key: keyof AdvancedGemstoneFilters;
  label: string;
  value?: string;
  displayValue: string;
  category: "type" | "attribute" | "range" | "boolean" | "professional";
}

// Category colors for visual distinction
const categoryColors: Record<FilterChip["category"], string> = {
  type: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  attribute: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  range: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  boolean: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  professional: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700",
};

export function ActiveFilterChips({
  filters,
  onRemoveFilter,
  onClearAll,
  className = "",
}: ActiveFilterChipsProps) {
  const t = useTranslations("filters");
  const prefersReducedMotion = useReducedMotion();

  // Convert filters to chips
  const chips: FilterChip[] = [];

  // Gemstone types
  if (filters.gemstoneTypes?.length) {
    filters.gemstoneTypes.forEach((type) => {
      chips.push({
        key: "gemstoneTypes",
        label: t("advanced.type"),
        value: type,
        displayValue: type,
        category: "type",
      });
    });
  }

  // Colors
  if (filters.colors?.length) {
    filters.colors.forEach((color) => {
      chips.push({
        key: "colors",
        label: t("advanced.color"),
        value: color,
        displayValue: color,
        category: "attribute",
      });
    });
  }

  // Cuts
  if (filters.cuts?.length) {
    filters.cuts.forEach((cut) => {
      chips.push({
        key: "cuts",
        label: t("advanced.cut"),
        value: cut,
        displayValue: cut,
        category: "attribute",
      });
    });
  }

  // Clarities
  if (filters.clarities?.length) {
    filters.clarities.forEach((clarity) => {
      chips.push({
        key: "clarities",
        label: t("advanced.clarity"),
        value: clarity,
        displayValue: clarity,
        category: "attribute",
      });
    });
  }

  // Origins
  if (filters.origins?.length) {
    filters.origins.forEach((origin) => {
      chips.push({
        key: "origins",
        label: t("advanced.origin"),
        value: origin,
        displayValue: origin,
        category: "attribute",
      });
    });
  }

  // Treatment Status (Professional)
  if (filters.treatmentStatus?.length) {
    filters.treatmentStatus.forEach((status) => {
      chips.push({
        key: "treatmentStatus",
        label: t("advanced.treatmentStatus"),
        value: status,
        displayValue: t(`advanced.treatmentStatusOptions.${status}`) || status,
        category: "professional",
      });
    });
  }

  // Mining Countries (Professional)
  if (filters.miningCountries?.length) {
    filters.miningCountries.forEach((country) => {
      chips.push({
        key: "miningCountries",
        label: t("advanced.miningCountry"),
        value: country,
        displayValue: country,
        category: "professional",
      });
    });
  }

  // Quality Classifications (Professional)
  if (filters.qualityClassifications?.length) {
    filters.qualityClassifications.forEach((classification) => {
      chips.push({
        key: "qualityClassifications",
        label: t("advanced.qualityClassification"),
        value: classification,
        displayValue: classification,
        category: "professional",
      });
    });
  }

  // Price Range
  if (filters.priceRange) {
    chips.push({
      key: "priceRange",
      label: t("advanced.priceRange"),
      displayValue: `$${(filters.priceRange.min / 100).toLocaleString()} - $${(filters.priceRange.max / 100).toLocaleString()}`,
      category: "range",
    });
  }

  // Weight Range
  if (filters.weightRange) {
    chips.push({
      key: "weightRange",
      label: t("advanced.weightRange"),
      displayValue: `${filters.weightRange.min}ct - ${filters.weightRange.max}ct`,
      category: "range",
    });
  }

  // Dimension Range
  if (filters.dimensionRange) {
    const parts: string[] = [];
    if (filters.dimensionRange.minLength || filters.dimensionRange.maxLength) {
      parts.push(`L: ${filters.dimensionRange.minLength || 0}-${filters.dimensionRange.maxLength || '∞'}mm`);
    }
    if (filters.dimensionRange.minWidth || filters.dimensionRange.maxWidth) {
      parts.push(`W: ${filters.dimensionRange.minWidth || 0}-${filters.dimensionRange.maxWidth || '∞'}mm`);
    }
    if (parts.length > 0) {
      chips.push({
        key: "dimensionRange",
        label: t("advanced.dimensionRange"),
        displayValue: parts.join(", "),
        category: "range",
      });
    }
  }

  // Price Per Carat Range
  if (filters.pricePerCaratRange) {
    chips.push({
      key: "pricePerCaratRange",
      label: t("advanced.pricePerCaratRange"),
      displayValue: `$${filters.pricePerCaratRange.min.toLocaleString()} - $${filters.pricePerCaratRange.max.toLocaleString()}/ct`,
      category: "range",
    });
  }

  // Boolean filters
  if (filters.inStockOnly) {
    chips.push({
      key: "inStockOnly",
      label: t("advanced.inStockOnly"),
      displayValue: t("advanced.inStockOnly"),
      category: "boolean",
    });
  }

  if (filters.hasCertification) {
    chips.push({
      key: "hasCertification",
      label: t("advanced.hasCertification"),
      displayValue: t("advanced.hasCertification"),
      category: "boolean",
    });
  }

  if (filters.hasImages) {
    chips.push({
      key: "hasImages",
      label: t("advanced.hasImages"),
      displayValue: t("advanced.hasImages"),
      category: "boolean",
    });
  }

  if (filters.hasColorChange) {
    chips.push({
      key: "hasColorChange",
      label: t("advanced.hasColorChange"),
      displayValue: t("advanced.hasColorChange"),
      category: "boolean",
    });
  }

  if (filters.hasAIAnalysis) {
    chips.push({
      key: "hasAIAnalysis",
      label: t("advanced.hasAIAnalysis"),
      displayValue: t("advanced.hasAIAnalysis"),
      category: "boolean",
    });
  }

  // Don't render if no chips
  if (chips.length === 0) {
    return null;
  }

  const transitionClasses = prefersReducedMotion
    ? ""
    : "transition-all duration-200";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Filter count summary */}
      <span className="text-sm text-muted-foreground font-medium mr-1">
        {chips.length} {chips.length === 1 ? "filter" : "filters"}:
      </span>

      {/* Filter chips */}
      {chips.map((chip, index) => (
        <button
          key={`${chip.key}-${chip.value || index}`}
          onClick={() => onRemoveFilter(chip.key, chip.value)}
          className={`group inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border ${transitionClasses} hover:shadow-md ${categoryColors[chip.category]}`}
          title={`Remove ${chip.label}: ${chip.displayValue}`}
        >
          <span className="max-w-[150px] truncate">{chip.displayValue}</span>
          <XMarkIcon
            className={`w-4 h-4 opacity-60 group-hover:opacity-100 ${
              !prefersReducedMotion ? "transition-opacity" : ""
            }`}
          />
        </button>
      ))}

      {/* Clear all button */}
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-destructive rounded-full border border-transparent hover:border-destructive/30 hover:bg-destructive/5 ${transitionClasses}`}
        >
          <XMarkIcon className="w-4 h-4" />
          <span>Clear all</span>
        </button>
      )}
    </div>
  );
}
