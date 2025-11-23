// Advanced Filters Component - Main Filter Interface
// Following Component Architecture and State Management Patterns

"use client";

import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  CLARITY_ORDER,
  DEFAULT_PRICE_RANGE,
  DEFAULT_WEIGHT_RANGE,
  categorizeColor,
  getActiveFilterCount,
  hasActiveFilters,
} from "../../types/filter.types";
import type {
  GemClarity,
  GemColor,
  GemCut,
  GemstoneType,
} from "@/shared/types";
import { useEffect, useMemo, useRef } from "react";

import type { AdvancedGemstoneFilters } from "../../types/filter.types";
import { FilterDropdown } from "./filter-dropdown";
import { RangeSlider } from "./range-slider";
import { useAdvancedFilters } from "../../hooks/use-advanced-filters";
import { useFilterLabels } from "../../hooks/use-filter-labels";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/features/currency/hooks/use-currency";

// Import constants and utilities

interface FilterOptions {
  gemstoneTypes: Array<{ value: string; label: string; count: number }>;
  colors: Array<{ value: string; label: string; count: number }>;
  cuts: Array<{ value: string; label: string; count: number }>;
  clarities: Array<{ value: string; label: string; count: number }>;
  origins: Array<{ value: string; label: string; count: number }>;
}

interface AdvancedFiltersProps {
  options: FilterOptions;
  onFiltersChange?: (filters: AdvancedGemstoneFilters) => void;
}

export function AdvancedFilters({
  options,
  onFiltersChange,
}: AdvancedFiltersProps) {
  const t = useTranslations("filters.advanced");
  const filterLabels = useFilterLabels();
  const pathname = usePathname();
  const { filters, ...filterActions } = useAdvancedFilters(
    undefined,
    true,
    pathname
  );

  // Track previous filters to prevent unnecessary callbacks
  const prevFiltersRef = useRef<AdvancedGemstoneFilters>(filters);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Notify parent of filter changes with debouncing
  useEffect(() => {
    // Deep comparison to check if filters actually changed
    const filtersChanged =
      JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);

    if (filtersChanged && onFiltersChange) {
      console.log(
        "📢 [AdvancedFilters] Filters changed, debouncing callback:",
        {
          filters,
          previousFilters: prevFiltersRef.current,
          timestamp: new Date().toISOString(),
        }
      );

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce the callback to prevent rapid successive calls
      timeoutRef.current = setTimeout(() => {
        console.log("📢 [AdvancedFilters] Calling parent callback:", {
          filters,
          timestamp: new Date().toISOString(),
        });
        onFiltersChange(filters);
        prevFiltersRef.current = filters;
      }, 100); // 100ms debounce
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [filters, onFiltersChange]);

  // Prepare filter options with labels and counts
  const gemstoneTypeOptions = useMemo(() => {
    const available = options.gemstoneTypes || [];
    return Object.entries(filterLabels.gemstoneTypes)
      .map(([value, label]) => {
        const option = available.find((opt) => opt.value === value);
        return {
          value: value as GemstoneType,
          label: label,
          count: option?.count || 0,
          disabled: !option || option.count === 0,
        };
      })
      .filter(
        (opt) =>
          !opt.disabled ||
          filterActions.isFilterActive("gemstoneTypes", opt.value)
      );
  }, [
    options.gemstoneTypes,
    filterActions.isFilterActive,
    filterLabels.gemstoneTypes,
  ]);

  const colorOptions = useMemo(() => {
    const available = options.colors || [];
    return Object.entries(filterLabels.colors)
      .map(([value, label]) => {
        const option = available.find((opt) => opt.value === value);
        const category = categorizeColor(value as GemColor);
        return {
          value: value as GemColor,
          label,
          count: option?.count || 0,
          category,
          disabled: !option || option.count === 0,
        };
      })
      .filter(
        (opt) =>
          !opt.disabled || filterActions.isFilterActive("colors", opt.value)
      )
      .sort((a, b) => {
        // Sort by category, then by label
        if (a.category !== b.category) {
          const categoryOrder = { diamond: 0, colored: 1, fancy: 2 };
          return categoryOrder[a.category] - categoryOrder[b.category];
        }
        return a.label.localeCompare(b.label);
      });
  }, [options.colors, filterActions.isFilterActive, filterLabels.colors]);

  const cutOptions = useMemo(() => {
    const available = options.cuts || [];
    return Object.entries(filterLabels.cuts)
      .map(([value, label]) => {
        const option = available.find((opt) => opt.value === value);
        return {
          value: value as GemCut,
          label,
          count: option?.count || 0,
          disabled: !option || option.count === 0,
        };
      })
      .filter(
        (opt) =>
          !opt.disabled || filterActions.isFilterActive("cuts", opt.value)
      );
  }, [options.cuts, filterActions.isFilterActive, filterLabels.cuts]);

  const clarityOptions = useMemo(() => {
    const available = options.clarities || [];
    return Object.entries(filterLabels.clarity)
      .map(([value, label]) => {
        const option = available.find((opt) => opt.value === value);
        return {
          value: value as GemClarity,
          label,
          count: option?.count || 0,
          order: CLARITY_ORDER[value as GemClarity],
          disabled: !option || option.count === 0,
        };
      })
      .filter(
        (opt) =>
          !opt.disabled || filterActions.isFilterActive("clarities", opt.value)
      )
      .sort((a, b) => a.order - b.order);
  }, [options.clarities, filterActions.isFilterActive, filterLabels.clarity]);

  const originOptions = useMemo(() => {
    return (
      options.origins
        ?.map((option) => ({
          value: option.value,
          label: option.label,
          count: option.count,
          disabled: option.count === 0,
        }))
        .filter(
          (opt) =>
            !opt.disabled || filterActions.isFilterActive("origins", opt.value)
        ) || []
    );
  }, [options.origins, filterActions.isFilterActive]);

  // Use currency context for price formatting
  const { formatPrice, convertPrice } = useCurrency();
  
  // Format functions for sliders (convert from USD to selected currency)
  const formatPriceForSlider = (value: number): string => {
    return formatPrice(value, "USD");
  };

  const formatWeight = (value: number): string => {
    return `${value.toFixed(1)}ct`;
  };

  // Calculate active filter state
  const activeFilterCount = useMemo(
    () => getActiveFilterCount(filters),
    [filters]
  );
  const hasFilters = useMemo(() => hasActiveFilters(filters), [filters]);

  return (
    <div className={`bg-card border border-border rounded-lg p-6 space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">
            {t("title")}
          </h2>
          {activeFilterCount > 0 && (
            <span className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {t("activeFilters", { count: activeFilterCount })}
            </span>
          )}
        </div>

        {/* Reset All Filters Button */}
        {hasFilters && (
          <button
            onClick={filterActions.resetFilters}
            className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground
                       bg-muted/50 hover:bg-muted rounded-lg transition-colors duration-200
                       border border-border/50 hover:border-border min-h-[44px] min-w-[44px]
                       flex items-center justify-center"
            title="Clear all filters"
          >
            <XMarkIcon className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">{t("resetAll")}</span>
            <span className="sm:hidden">Reset</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <label className="block text-sm font-medium text-foreground mb-2">
          {t("search")}
        </label>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={filters.search || ""}
            onChange={(e) => filterActions.setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-3 bg-input border border-border rounded-lg
                       text-foreground placeholder:text-muted-foreground
                       focus:ring-2 focus:ring-ring focus:border-ring
                       transition-colors duration-200 min-h-[48px] text-base"
          />
        </div>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Gemstone Type */}
        <FilterDropdown
          label="Gemstone Type"
          options={gemstoneTypeOptions}
          selectedValues={filters.gemstoneTypes || []}
          onSelectionChange={(values) => {
            // Toggle each value to maintain proper state
            const currentTypes = filters.gemstoneTypes || [];
            values.forEach((value) => {
              if (!currentTypes.includes(value)) {
                filterActions.toggleGemstoneType(value);
              }
            });
            // Remove unselected values
            currentTypes.forEach((type) => {
              if (!values.includes(type)) {
                filterActions.toggleGemstoneType(type);
              }
            });
          }}
          placeholder={t("selectGemstoneTypes")}
        />

        {/* Color */}
        <FilterDropdown
          label={t("color")}
          options={colorOptions}
          selectedValues={filters.colors || []}
          onSelectionChange={(values) => {
            const currentColors = filters.colors || [];
            values.forEach((value) => {
              if (!currentColors.includes(value)) {
                filterActions.toggleColor(value);
              }
            });
            currentColors.forEach((color) => {
              if (!values.includes(color)) {
                filterActions.toggleColor(color);
              }
            });
          }}
          placeholder={t("selectColors")}
        />

        {/* Cut */}
        <FilterDropdown
          label={t("cut")}
          options={cutOptions}
          selectedValues={filters.cuts || []}
          onSelectionChange={(values) => {
            const currentCuts = filters.cuts || [];
            values.forEach((value) => {
              if (!currentCuts.includes(value)) {
                filterActions.toggleCut(value);
              }
            });
            currentCuts.forEach((cut) => {
              if (!values.includes(cut)) {
                filterActions.toggleCut(cut);
              }
            });
          }}
          placeholder={t("selectCuts")}
        />

        {/* Clarity */}
        <FilterDropdown
          label={t("clarity")}
          options={clarityOptions}
          selectedValues={filters.clarities || []}
          onSelectionChange={(values) => {
            const currentClarities = filters.clarities || [];
            values.forEach((value) => {
              if (!currentClarities.includes(value)) {
                filterActions.toggleClarity(value);
              }
            });
            currentClarities.forEach((clarity) => {
              if (!values.includes(clarity)) {
                filterActions.toggleClarity(clarity);
              }
            });
          }}
          placeholder={t("selectClarities")}
        />

        {/* Origin */}
        {originOptions.length > 0 && (
          <FilterDropdown
            label={t("origin")}
            options={originOptions}
            selectedValues={filters.origins || []}
            onSelectionChange={(values) => {
              const currentOrigins = filters.origins || [];
              values.forEach((value) => {
                if (!currentOrigins.includes(value)) {
                  filterActions.toggleOrigin(value);
                }
              });
              currentOrigins.forEach((origin) => {
                if (!values.includes(origin)) {
                  filterActions.toggleOrigin(origin);
                }
              });
            }}
            placeholder={t("selectOrigins")}
          />
        )}
      </div>

      {/* Range Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Price Range */}
        <RangeSlider
          label={t("priceRange")}
          min={DEFAULT_PRICE_RANGE.min}
          max={DEFAULT_PRICE_RANGE.max}
          value={[
            filters.priceRange?.min || DEFAULT_PRICE_RANGE.min,
            filters.priceRange?.max || DEFAULT_PRICE_RANGE.max,
          ]}
          onChange={([min, max]) => {
            filterActions.setPriceRange({
              min,
              max,
              currency: DEFAULT_PRICE_RANGE.currency,
            });
          }}
          step={50000} // $500 increments
          formatValue={formatPriceForSlider}
        />

        {/* Weight Range */}
        <RangeSlider
          label={t("caratWeight")}
          min={DEFAULT_WEIGHT_RANGE.min}
          max={DEFAULT_WEIGHT_RANGE.max}
          value={[
            filters.weightRange?.min || DEFAULT_WEIGHT_RANGE.min,
            filters.weightRange?.max || DEFAULT_WEIGHT_RANGE.max,
          ]}
          onChange={([min, max]) => {
            filterActions.setWeightRange({ min, max });
          }}
          step={0.1}
          formatValue={formatWeight}
        />
      </div>

      {/* Boolean Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-accent min-h-[48px]">
          <input
            type="checkbox"
            checked={filters.inStockOnly || false}
            onChange={(e) => filterActions.toggleInStockOnly(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-ring focus:ring-2 bg-background"
          />
          <span className="text-sm font-medium text-foreground">
            {t("inStockOnly")}
          </span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-accent min-h-[48px]">
          <input
            type="checkbox"
            checked={filters.hasCertification || false}
            onChange={(e) =>
              filterActions.toggleHasCertification(e.target.checked)
            }
            className="w-4 h-4 rounded border-border text-primary focus:ring-ring focus:ring-2 bg-background"
          />
          <span className="text-sm font-medium text-foreground">
            {t("hasCertification")}
          </span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-accent min-h-[48px]">
          <input
            type="checkbox"
            checked={filters.hasImages || false}
            onChange={(e) => filterActions.toggleHasImages(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-ring focus:ring-2 bg-background"
          />
          <span className="text-sm font-medium text-foreground">
            {t("hasImages")}
          </span>
        </label>
      </div>
    </div>
  );
}
