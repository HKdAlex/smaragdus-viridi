/**
 * Advanced Filters (Controlled Component)
 *
 * Fully controlled filter component with zero internal state.
 * Receives filter state from parent and notifies via onChange callback.
 *
 * Architecture:
 * - NO internal state (fully controlled)
 * - NO URL manipulation (parent's responsibility)
 * - NO data fetching (receives options as props)
 * - Pure presentation + user interaction handlers
 *
 * Benefits:
 * - Single source of truth (parent owns state)
 * - Easy to test (pure component)
 * - Composable and reusable
 * - Clear data flow
 */

"use client";

import type {
    GemClarity,
    GemColor,
    // CUT-C3.1: GemCut enum removed
    GemstoneType,
} from "@/shared/types";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    CLARITY_ORDER,
    categorizeColor,
    getActiveFilterCount,
} from "../../types/filter.types";

import { useTranslations } from "next-intl";
import { useFilterLabels } from "../../hooks/use-filter-labels";
import { useMiningCountryOptions } from "../../hooks/use-mining-country-options";
import { useQualityClassificationOptions } from "../../hooks/use-quality-classification-options";
import type {
    AdvancedGemstoneFilters,
    TreatmentStatus,
} from "../../types/filter.types";
import { FilterDropdown } from "./filter-dropdown";
import { RangeSlider } from "./range-slider";

// Filter option types
export interface FilterOption<T = string> {
  value: T;
  label: string;
  count: number;
}

export interface FilterOptions {
  gemstoneTypes: FilterOption<string>[];
  colors: FilterOption<string>[];
  cuts: FilterOption<string>[];
  clarities: FilterOption<string>[];
  origins: FilterOption<string>[];
}

interface AdvancedFiltersControlledProps {
  // Current filter state (controlled)
  filters: AdvancedGemstoneFilters;

  // Callback when filters change
  onChange: (filters: AdvancedGemstoneFilters) => void;

  // Available filter options with counts
  options: FilterOptions;

  // Optional loading state
  loading?: boolean;
}

export function AdvancedFiltersControlled({
  filters,
  onChange,
  options,
  loading = false,
}: AdvancedFiltersControlledProps) {
  const t = useTranslations("filters.advanced");
  const filterLabels = useFilterLabels();
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

  // Calculate active filter count
  const activeFilterCount = useMemo(
    () => getActiveFilterCount(filters),
    [filters]
  );

  // Handle search input - debounced to avoid excessive URL updates
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search || "");

  // Sync local state when filters prop changes (e.g., URL loading)
  useEffect(() => {
    const currentSearch = filters.search || "";
    setSearchValue(currentSearch);
    setDebouncedSearch(currentSearch);
  }, [filters.search]);

  // Debounce search updates to URL (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Update filters only when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== (filters.search || "")) {
      onChange({ ...filters, search: debouncedSearch || undefined });
    }
  }, [debouncedSearch, filters, onChange]);

  // Handle search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  // Handle gemstone type filter
  const handleTypeChange = useCallback(
    (types: string[]) => {
      onChange({
        ...filters,
        gemstoneTypes: types.length > 0 ? (types as GemstoneType[]) : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle color filter
  const handleColorChange = useCallback(
    (colors: string[]) => {
      onChange({
        ...filters,
        colors: colors.length > 0 ? (colors as GemColor[]) : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle cut filter (CUT-C3.1: cuts are now strings)
  const handleCutChange = useCallback(
    (cuts: string[]) => {
      onChange({
        ...filters,
        cuts: cuts.length > 0 ? cuts : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle clarity filter
  const handleClarityChange = useCallback(
    (clarities: string[]) => {
      onChange({
        ...filters,
        clarities:
          clarities.length > 0 ? (clarities as GemClarity[]) : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle origin filter
  const handleOriginChange = useCallback(
    (origins: string[]) => {
      onChange({
        ...filters,
        origins: origins.length > 0 ? origins : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle mining country filter
  const handleMiningCountryChange = useCallback(
    (countries: string[]) => {
      onChange({
        ...filters,
        miningCountries: countries.length > 0 ? countries : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle quality classification filter
  const handleQualityClassificationChange = useCallback(
    (values: string[]) => {
      onChange({
        ...filters,
        qualityClassifications: values.length > 0 ? values : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle treatment status filter
  const handleTreatmentStatusChange = useCallback(
    (statuses: string[]) => {
      onChange({
        ...filters,
        treatmentStatus:
          statuses.length > 0 ? (statuses as TreatmentStatus[]) : undefined,
      });
    },
    [filters, onChange]
  );

  // Handle price range
  const handlePriceRangeChange = useCallback(
    (min: number, max: number) => {
      // Only set if not default range
      if (min > 0 || max < 5000000) {
        onChange({
          ...filters,
          priceRange: { min, max, currency: "USD" },
        });
      } else {
        onChange({ ...filters, priceRange: undefined });
      }
    },
    [filters, onChange]
  );

  // Handle weight range
  const handleWeightRangeChange = useCallback(
    (min: number, max: number) => {
      // Only set if not default range
      if (min > 0 || max < 20) {
        onChange({
          ...filters,
          weightRange: { min, max },
        });
      } else {
        onChange({ ...filters, weightRange: undefined });
      }
    },
    [filters, onChange]
  );

  // Handle price per carat range
  const handlePricePerCaratRangeChange = useCallback(
    (min: number, max: number) => {
      if (min > pricePerCaratRange[0] || max < pricePerCaratRange[1]) {
        onChange({
          ...filters,
          pricePerCaratRange: { min, max, currency: "USD" },
        });
      } else {
        onChange({ ...filters, pricePerCaratRange: undefined });
      }
    },
    [filters, onChange, pricePerCaratRange]
  );

  // Handle stock filter
  const handleStockChange = useCallback(
    (inStockOnly: boolean) => {
      onChange({ ...filters, inStockOnly });
    },
    [filters, onChange]
  );

  // Handle color change filter
  const handleColorChangeToggle = useCallback(
    (hasColorChange: boolean) => {
      onChange({ ...filters, hasColorChange });
    },
    [filters, onChange]
  );

  const handleDimensionChange = useCallback(
    (
      nextLength: [number, number],
      nextWidth: [number, number]
    ) => {
      const isDefaultLength =
        nextLength[0] === lengthRange[0] &&
        nextLength[1] === lengthRange[1];
      const isDefaultWidth =
        nextWidth[0] === widthRange[0] &&
        nextWidth[1] === widthRange[1];

      onChange({
        ...filters,
        dimensionRange:
          isDefaultLength && isDefaultWidth
            ? undefined
            : {
                minLength: nextLength[0],
                maxLength: nextLength[1],
                minWidth: nextWidth[0],
                maxWidth: nextWidth[1],
              },
      });
    },
    [filters, onChange, lengthRange, widthRange]
  );

  // Clear all filters
  const handleClearAll = useCallback(() => {
    onChange({});
  }, [onChange]);

  // Prepare filter options with proper structure
  const gemstoneTypeOptions = useMemo(() => {
    return options.gemstoneTypes.map((opt) => ({
      value: opt.value,
      label: filterLabels.gemstoneTypes[opt.value as GemstoneType] || opt.label,
      count: opt.count,
      disabled: opt.count === 0,
    }));
  }, [options.gemstoneTypes, filterLabels.gemstoneTypes]);

  const colorOptions = useMemo(() => {
    return options.colors.map((opt) => {
      const category = categorizeColor(opt.value as GemColor);
      return {
        value: opt.value,
        label: filterLabels.colors[opt.value as GemColor] || opt.label,
        count: opt.count,
        category,
        disabled: opt.count === 0,
      };
    });
  }, [options.colors, filterLabels.colors]);

  // CUT-C3.1: cuts are now strings
  const cutOptions = useMemo(() => {
    return options.cuts.map((opt) => ({
      value: opt.value,
      label: filterLabels.cuts[opt.value] || opt.label,
      count: opt.count,
      disabled: opt.count === 0,
    }));
  }, [options.cuts, filterLabels.cuts]);

  const clarityOptions = useMemo(() => {
    return options.clarities
      .map((opt) => ({
        value: opt.value,
        label: opt.value, // Clarity labels are already correct (VVS1, SI2, etc.)
        count: opt.count,
        order: CLARITY_ORDER[opt.value as GemClarity] || 10,
        disabled: opt.count === 0,
      }))
      .sort((a, b) => a.order - b.order);
  }, [options.clarities]);

  const originOptions = useMemo(() => {
    return options.origins.map((opt) => ({
      value: opt.value,
      label: opt.label,
      count: opt.count,
      disabled: opt.count === 0,
    }));
  }, [options.origins]);

  const miningCountryDropdownOptions = useMemo(() => {
    return miningCountryOptions.map((opt) => ({
      value: opt.value,
      label: opt.label,
      count: opt.count,
      disabled: opt.count === 0,
    }));
  }, [miningCountryOptions]);

  const qualityClassificationDropdownOptions = useMemo(() => {
    return qualityClassificationOptions.map((opt) => ({
      value: opt.value,
      label: opt.label,
      count: opt.count,
      disabled: opt.count === 0,
    }));
  }, [qualityClassificationOptions]);

  const treatmentStatusOptions = useMemo(() => {
    const statuses: TreatmentStatus[] = [
      "natural",
      "heated",
      "oiled",
      "diffused",
      "irradiated",
      "filled",
      "coated",
      "untreated",
      "unknown",
      "other",
    ];

    return statuses.map((value) => ({
      value,
      label: t(`treatmentStatusOptions.${value}`),
    }));
  }, [t]);

  const currentLengthRange: [number, number] = [
    filters.dimensionRange?.minLength ?? lengthRange[0],
    filters.dimensionRange?.maxLength ?? lengthRange[1],
  ];

  const currentWidthRange: [number, number] = [
    filters.dimensionRange?.minWidth ?? widthRange[0],
    filters.dimensionRange?.maxWidth ?? widthRange[1],
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {activeFilterCount}{" "}
              {activeFilterCount === 1 ? "filter" : "filters"} active
            </span>
          </div>
          <button
            onClick={handleClearAll}
            disabled={loading}
            className="text-sm text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 font-medium"
          >
            {t("clearAll")}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          disabled={loading}
          className="w-full pl-10 pr-10 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
        />
        {searchValue && (
          <button
            onClick={() => setSearchValue("")}
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Grid - Single column for sidebar, responsive for full page */}
      <div className="grid grid-cols-1 gap-4">
        <FilterDropdown
          label={t("type")}
          options={gemstoneTypeOptions}
          selectedValues={filters.gemstoneTypes || []}
          onSelectionChange={handleTypeChange}
          disabled={loading}
        />

        <FilterDropdown
          label={t("color")}
          options={colorOptions}
          selectedValues={filters.colors || []}
          onSelectionChange={handleColorChange}
          disabled={loading}
        />

        <FilterDropdown
          label={t("cut")}
          options={cutOptions}
          selectedValues={filters.cuts || []}
          onSelectionChange={handleCutChange}
          disabled={loading}
        />

        <FilterDropdown
          label={t("clarity")}
          options={clarityOptions}
          selectedValues={filters.clarities || []}
          onSelectionChange={handleClarityChange}
          disabled={loading}
        />

        <FilterDropdown
          label={t("origin")}
          options={originOptions}
          selectedValues={filters.origins || []}
          onSelectionChange={handleOriginChange}
          disabled={loading}
        />

        <FilterDropdown
          label={t("miningCountry")}
          options={miningCountryDropdownOptions}
          selectedValues={filters.miningCountries || []}
          onSelectionChange={handleMiningCountryChange}
          placeholder={t("selectMiningCountries")}
          disabled={loading || miningCountryLoading}
        />

        <FilterDropdown
          label={t("qualityClassification")}
          options={qualityClassificationDropdownOptions}
          selectedValues={filters.qualityClassifications || []}
          onSelectionChange={handleQualityClassificationChange}
          placeholder={t("selectQualityClassifications")}
          disabled={loading || qualityClassificationLoading}
        />

        <FilterDropdown
          label={t("treatmentStatus")}
          options={treatmentStatusOptions}
          selectedValues={filters.treatmentStatus || []}
          onSelectionChange={handleTreatmentStatusChange}
          placeholder={t("selectTreatmentStatus")}
          disabled={loading}
        />

        <div className="space-y-4">
          <div className="text-sm font-medium text-foreground">
            {t("dimensionRange")}
          </div>
          <RangeSlider
            label={t("length")}
            min={lengthRange[0]}
            max={lengthRange[1]}
            value={currentLengthRange}
            onChange={(value) => handleDimensionChange(value, currentWidthRange)}
            step={0.5}
            formatValue={(val) => `${val} mm`}
            disabled={loading}
          />
          <RangeSlider
            label={t("width")}
            min={widthRange[0]}
            max={widthRange[1]}
            value={currentWidthRange}
            onChange={(value) => handleDimensionChange(currentLengthRange, value)}
            step={0.5}
            formatValue={(val) => `${val} mm`}
            disabled={loading}
          />
        </div>
      </div>

      {/* Range Filters */}
      <div className="space-y-4">
        <RangeSlider
          label={t("pricePerCaratRange")}
          min={pricePerCaratRange[0]}
          max={pricePerCaratRange[1]}
          step={1000}
          value={[
            filters.pricePerCaratRange?.min ?? pricePerCaratRange[0],
            filters.pricePerCaratRange?.max ?? pricePerCaratRange[1],
          ]}
          onChange={([min, max]) => handlePricePerCaratRangeChange(min, max)}
          formatValue={(value) =>
            `${new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value / 100)} / ct`
          }
          disabled={loading}
        />
        <RangeSlider
          label={t("priceRange")}
          min={0}
          max={5000000} // $50,000 in cents
          step={10000} // $100 steps
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
          max={20} // 20 carats
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

      {/* Color Change Filter */}
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.hasColorChange || false}
          onChange={(e) => handleColorChangeToggle(e.target.checked)}
          disabled={loading}
          className="w-4 h-4 text-primary border-border rounded focus:ring-primary focus:ring-offset-0 disabled:opacity-50"
        />
        <span className="text-sm text-foreground">
          {t("hasColorChange")}
        </span>
      </label>
    </div>
  );
}
