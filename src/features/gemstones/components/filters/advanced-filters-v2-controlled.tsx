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
  DimensionRangeSelector,
  GemstoneTypeSelector,
  MiningCountrySelector,
  OriginSelector,
  PricePerCaratRange,
  PriceRangeCards,
  QualityClassificationSelector,
  TreatmentStatusSelector,
  ToggleCards,
  WeightRangeCards,
} from "./visual";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

import type {
  AdvancedGemstoneFilters,
  DimensionRange,
  PriceRange,
  TreatmentStatus,
} from "../../types/filter.types";
import type { FilterOptions } from "./advanced-filters-controlled";
import { useCallback, useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useMiningCountryOptions } from "../../hooks/use-mining-country-options";
import { useQualityClassificationOptions } from "../../hooks/use-quality-classification-options";

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
  const {
    options: miningCountryOptions,
    loading: miningCountryLoading,
  } = useMiningCountryOptions();
  const {
    options: qualityClassificationOptions,
    loading: qualityClassificationLoading,
  } = useQualityClassificationOptions();
  const lengthRange: [number, number] = [0, 20];
  const widthRange: [number, number] = [0, 75];
  const pricePerCaratRange: [number, number] = [0, 300000];

  // Local search state with debouncing to prevent rapid API calls
  const [localSearch, setLocalSearch] = useState(filters.search || "");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 500; // 500ms delay

  // Sync local search with external filter changes
  useEffect(() => {
    setLocalSearch(filters.search || "");
  }, [filters.search]);

  // Handle search input with debouncing
  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set new timer for debounced update
      debounceTimerRef.current = setTimeout(() => {
        onChange({ ...filters, search: value || undefined });
      }, DEBOUNCE_DELAY);
    },
    [filters, onChange]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle gemstone type changes (FILTER-C0.2)
  const handleTypeChange = useCallback(
    (types: string[]) => {
      onChange({
        ...filters,
        gemstoneTypes: types.length > 0 ? (types as any[]) : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle origin changes (FILTER-C0.2)
  const handleOriginChange = useCallback(
    (origins: string[]) => {
      onChange({
        ...filters,
        origins: origins.length > 0 ? origins : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle mining country changes (FILTER-C1.2)
  const handleMiningCountryChange = useCallback(
    (countries: string[]) => {
      onChange({
        ...filters,
        miningCountries: countries.length > 0 ? countries : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle quality classification changes (FILTER-C1.3)
  const handleQualityClassificationChange = useCallback(
    (values: string[]) => {
      onChange({
        ...filters,
        qualityClassifications: values.length > 0 ? values : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle treatment status changes (FILTER-C1.1)
  const handleTreatmentStatusChange = useCallback(
    (statuses: TreatmentStatus[]) => {
      onChange({
        ...filters,
        treatmentStatus: statuses.length > 0 ? statuses : undefined,
      });
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

  // Handle color change filter
  const handleColorChangeToggle = useCallback(() => {
    onChange({ ...filters, hasColorChange: !filters.hasColorChange });
  }, [filters, onChange]);

  // Handle AI analysis filter
  const handleAIAnalysisToggle = useCallback(() => {
    onChange({ ...filters, hasAIAnalysis: !filters.hasAIAnalysis });
  }, [filters, onChange]);

  const handleDimensionChange = useCallback(
    (dimensionRange?: DimensionRange) => {
      onChange({ ...filters, dimensionRange });
    },
    [filters, onChange]
  );

  const handlePricePerCaratChange = useCallback(
    (value?: PriceRange) => {
      onChange({ ...filters, pricePerCaratRange: value });
    },
    [filters, onChange]
  );

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
    if (filters.miningCountries?.length)
      count += filters.miningCountries.length;
    if (filters.treatmentStatus?.length)
      count += filters.treatmentStatus.length;
    if (filters.qualityClassifications?.length)
      count += filters.qualityClassifications.length;
    if (filters.dimensionRange) count++;
    if (filters.priceRange) count++;
    if (filters.weightRange) count++;
    if (filters.pricePerCaratRange) count++;
    if (filters.inStockOnly) count++;
    if (filters.hasCertification) count++;
    if (filters.hasImages) count++;
    if (filters.hasColorChange) count++;
    if (filters.hasAIAnalysis) count++;
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

      {/* Search with debouncing */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("advancedV2.searchPlaceholder")}
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          disabled={loading}
          className="w-full pl-10 pr-10 py-2.5 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {/* Clear button */}
        {localSearch && (
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Visual Filters */}
      <div className="space-y-6">
        {/* Gemstone Type Selector (FILTER-C0.2) */}
        <GemstoneTypeSelector
          selectedTypes={filters.gemstoneTypes || []}
          onTypeChange={handleTypeChange}
          options={options.gemstoneTypes}
        />

        {/* Origin Selector (FILTER-C0.2) */}
        <OriginSelector
          selectedOrigins={filters.origins || []}
          onOriginChange={handleOriginChange}
          options={options.origins}
        />

        {/* Mining Country Selector (FILTER-C1.2) */}
        <MiningCountrySelector
          selectedCountries={filters.miningCountries || []}
          onCountryChange={handleMiningCountryChange}
          options={miningCountryOptions}
        />

        {/* Quality Classification Selector (FILTER-C1.3) */}
        <QualityClassificationSelector
          selectedValues={filters.qualityClassifications || []}
          onChange={handleQualityClassificationChange}
          options={qualityClassificationOptions}
        />

        {/* Treatment Status Selector (FILTER-C1.1) */}
        <TreatmentStatusSelector
          selectedStatuses={filters.treatmentStatus || []}
          onStatusChange={handleTreatmentStatusChange}
        />

        {/* Dimension Range Selector (FILTER-C2.1) */}
        <DimensionRangeSelector
          value={filters.dimensionRange}
          onChange={handleDimensionChange}
          minLength={lengthRange[0]}
          maxLength={lengthRange[1]}
          minWidth={widthRange[0]}
          maxWidth={widthRange[1]}
          disabled={loading}
        />

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

        {/* Price Per Carat Range (FILTER-C2.2) */}
        <PricePerCaratRange
          value={filters.pricePerCaratRange}
          onChange={handlePricePerCaratChange}
          min={pricePerCaratRange[0]}
          max={pricePerCaratRange[1]}
          disabled={loading}
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
          withColorChange={filters.hasColorChange || false}
          onColorChange={handleColorChangeToggle}
          withAIAnalysis={filters.hasAIAnalysis || false}
          onAIAnalysisChange={handleAIAnalysisToggle}
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

      {miningCountryLoading && !loading && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Loading mining countries...
        </div>
      )}

      {qualityClassificationLoading && !loading && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Loading quality classifications...
        </div>
      )}
    </div>
  );
}
