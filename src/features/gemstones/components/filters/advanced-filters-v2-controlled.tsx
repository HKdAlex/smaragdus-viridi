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
 * - Price/weight range cards
 * - All fully controlled and localized
 */

"use client";

import {
  ClaritySelector,
  ColorPicker,
  CutShapeSelector,
  PriceRangeCards,
  ToggleCards,
  WeightRangeCards,
} from "./visual";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

import type { AdvancedGemstoneFilters } from "../../types/filter.types";
import type { FilterOptions } from "./advanced-filters-controlled";
import { useCallback } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("filters");

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

  // Handle clarity changes
  const handleClarityChange = useCallback(
    (clarities: string[]) => {
      onChange({
        ...filters,
        clarities: clarities.length > 0 ? (clarities as any[]) : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle price range
  const handlePriceRangeChange = useCallback(
    (range: [number, number]) => {
      onChange({
        ...filters,
        priceRange: { min: range[0], max: range[1], currency: "USD" },
      });
    },
    [filters, onChange]
  );

  // Handle weight range
  const handleWeightRangeChange = useCallback(
    (range: [number, number]) => {
      onChange({
        ...filters,
        weightRange: { min: range[0], max: range[1] },
      });
    },
    [filters, onChange]
  );

  // Handle stock filter
  const handleInStockToggle = useCallback(() => {
    onChange({ ...filters, inStockOnly: !filters.inStockOnly });
  }, [filters, onChange]);

  // Handle certification filter
  const handleCertificationToggle = useCallback(() => {
    onChange({ ...filters, hasCertification: !filters.hasCertification });
  }, [filters, onChange]);

  // Handle images filter
  const handleImagesToggle = useCallback(() => {
    onChange({ ...filters, hasImages: !filters.hasImages });
  }, [filters, onChange]);

  // Handle reset all filters
  const handleResetFilters = useCallback(() => {
    onChange({});
  }, [onChange]);

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.gemstoneTypes?.length) count += filters.gemstoneTypes.length;
    if (filters.colors?.length) count += filters.colors.length;
    if (filters.cuts?.length) count += filters.cuts.length;
    if (filters.clarities?.length) count += filters.clarities.length;
    if (filters.origins?.length) count += filters.origins.length;
    if (filters.priceRange) count++;
    if (filters.weightRange) count++;
    if (filters.inStockOnly) count++;
    if (filters.hasCertification) count++;
    if (filters.hasImages) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-6">
      {/* Header with Reset */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <p className="text-sm text-muted-foreground">
            {t("advancedV2.filtersApplied", { count: activeFilterCount })}
          </p>
          <button
            onClick={handleResetFilters}
            className="flex items-center space-x-2 px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors text-sm font-medium"
          >
            <XMarkIcon className="w-4 h-4" />
            <span>
              {t("advancedV2.resetAll", { count: activeFilterCount })}
            </span>
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("advancedV2.searchPlaceholder")}
          value={filters.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          disabled={loading}
          className="w-full pl-10 pr-4 py-2.5 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Visual Filters */}
      <div className="space-y-6">
        {/* Cut Shape Selector */}
        <CutShapeSelector
          selectedCuts={filters.cuts || []}
          onCutChange={handleCutChange}
        />

        {/* Color Picker */}
        <ColorPicker
          selectedColors={filters.colors || []}
          onColorChange={handleColorChange}
        />

        {/* Clarity Selector */}
        <ClaritySelector
          selectedClarities={filters.clarities || []}
          onClarityChange={handleClarityChange}
        />

        {/* Price Range Cards */}
        <PriceRangeCards
          selectedRange={
            filters.priceRange
              ? [filters.priceRange.min, filters.priceRange.max]
              : [0, 1000000]
          }
          onRangeChange={handlePriceRangeChange}
        />

        {/* Weight Range Cards */}
        <WeightRangeCards
          selectedRange={
            filters.weightRange
              ? [filters.weightRange.min, filters.weightRange.max]
              : [0, 20]
          }
          onRangeChange={handleWeightRangeChange}
        />

        {/* Toggle Cards */}
        <ToggleCards
          inStockOnly={filters.inStockOnly || false}
          onInStockChange={handleInStockToggle}
          withCertification={filters.hasCertification || false}
          onCertificationChange={handleCertificationToggle}
          withImages={filters.hasImages || false}
          onImagesChange={handleImagesToggle}
        />
      </div>

      {/* Results Summary */}
      {activeFilterCount > 0 && (
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">
                {t("advancedV2.filtersApplied", { count: activeFilterCount })}
              </p>
              <p className="text-xs text-primary/80 mt-1">
                {t("advancedV2.personalizedResults")}
              </p>
            </div>
            <div className="text-2xl">✨</div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Loading filters...
          </p>
        </div>
      )}
    </div>
  );
}
