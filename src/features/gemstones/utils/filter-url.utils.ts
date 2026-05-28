// URL Parameter Utilities for Advanced Gemstone Filtering
// Following Type Governance: Import from feature types

import { parseColorFilterTokens } from "@/shared/config/basic-gem-colors";
import type {
    GemClarity,
    GemColor,
    // CUT-C3.1: GemCut enum removed
    GemstoneType,
} from "@/shared/types";
import type {
    AdvancedGemstoneFilters,
    FilterUrlParams,
    GemstoneSort,
    MutableAdvancedGemstoneFilters,
    PriceRange,
    TreatmentStatus,
    WeightRange,
} from "../types/filter.types";
import {
    DEFAULT_ADVANCED_FILTERS,
    DEFAULT_PRICE_RANGE,
    DEFAULT_WEIGHT_RANGE,
} from "../types/filter.types";

export const FILTER_PARAM_KEYS = [
  "search",
  "types",
  "colors",
  "cuts",
  "clarities",
  "origins",
  "priceMin",
  "priceMax",
  "weightMin",
  "weightMax",
  "treatmentStatus",
  "miningCountries",
  "qualityClassifications",
  "hasColorChange",
  "minLength",
  "maxLength",
  "minWidth",
  "maxWidth",
  "minPricePerCarat",
  "maxPricePerCarat",
  "inStock",
  "certified",
  "hasImages",
  "sort",
  "dir",
] as const;

// ===== URL SERIALIZATION =====

export const filtersToUrlParams = (
  filters: AdvancedGemstoneFilters
): FilterUrlParams => {
  const params: Record<string, string> = {};

  if (filters.search) {
    params.search = filters.search;
  }

  if (filters.gemstoneTypes?.length) {
    params.types = filters.gemstoneTypes.join(",");
  }

  if (filters.colors?.length) {
    params.colors = filters.colors.join(",");
  }

  if (filters.cuts?.length) {
    params.cuts = filters.cuts.join(",");
  }

  if (filters.clarities?.length) {
    params.clarities = filters.clarities.join(",");
  }

  if (filters.origins?.length) {
    params.origins = filters.origins.join(",");
  }

  if (filters.priceRange) {
    params.priceMin = filters.priceRange.min.toString();
    params.priceMax = filters.priceRange.max.toString();
  }

  if (filters.weightRange) {
    params.weightMin = filters.weightRange.min.toString();
    params.weightMax = filters.weightRange.max.toString();
  }

  if (filters.treatmentStatus?.length) {
    params.treatmentStatus = filters.treatmentStatus.join(",");
  }

  if (filters.miningCountries?.length) {
    params.miningCountries = filters.miningCountries.join(",");
  }

  if (filters.qualityClassifications?.length) {
    params.qualityClassifications = filters.qualityClassifications.join(",");
  }

  if (filters.hasColorChange !== undefined) {
    params.hasColorChange = filters.hasColorChange.toString();
  }

  if (filters.dimensionRange) {
    if (filters.dimensionRange.minLength !== undefined) {
      params.minLength = filters.dimensionRange.minLength.toString();
    }
    if (filters.dimensionRange.maxLength !== undefined) {
      params.maxLength = filters.dimensionRange.maxLength.toString();
    }
    if (filters.dimensionRange.minWidth !== undefined) {
      params.minWidth = filters.dimensionRange.minWidth.toString();
    }
    if (filters.dimensionRange.maxWidth !== undefined) {
      params.maxWidth = filters.dimensionRange.maxWidth.toString();
    }
  }

  if (filters.pricePerCaratRange) {
    params.minPricePerCarat = filters.pricePerCaratRange.min.toString();
    params.maxPricePerCarat = filters.pricePerCaratRange.max.toString();
  }

  if (filters.inStockOnly !== undefined) {
    params.inStock = filters.inStockOnly.toString();
  }

  if (filters.hasCertification) {
    params.certified = "true";
  }

  if (filters.hasImages) {
    params.hasImages = "true";
  }

  if (filters.sortBy) {
    params.sort = filters.sortBy;
  }

  if (filters.sortDirection) {
    params.dir = filters.sortDirection;
  }

  return params as FilterUrlParams;
};

// ===== URL DESERIALIZATION =====

export const urlParamsToFilters = (
  params: FilterUrlParams
): AdvancedGemstoneFilters => {
  const filters: MutableAdvancedGemstoneFilters = {
    ...DEFAULT_ADVANCED_FILTERS,
  };

  // Text search
  if (params.search) {
    filters.search = params.search;
  }

  // Arrays - split comma separated values
  if (params.types) {
    filters.gemstoneTypes = params.types
      .split(",")
      .filter(Boolean) as GemstoneType[];
  }

  if (params.colors) {
    filters.colors = parseColorFilterTokens(params.colors) as GemColor[];
  }

  // CUT-C3.1: cuts are now strings
  if (params.cuts) {
    filters.cuts = params.cuts.split(",").filter(Boolean);
  }

  if (params.clarities) {
    filters.clarities = params.clarities
      .split(",")
      .filter(Boolean) as GemClarity[];
  }

  if (params.origins) {
    filters.origins = params.origins.split(",").filter(Boolean);
  }

  // Price range
  if (params.priceMin || params.priceMax) {
    const priceRange: PriceRange = {
      min: params.priceMin
        ? parseInt(params.priceMin, 10)
        : DEFAULT_PRICE_RANGE.min,
      max: params.priceMax
        ? parseInt(params.priceMax, 10)
        : DEFAULT_PRICE_RANGE.max,
      currency: DEFAULT_PRICE_RANGE.currency,
    };
    filters.priceRange = priceRange;
  }

  // Weight range
  if (params.weightMin || params.weightMax) {
    const weightRange: WeightRange = {
      min: params.weightMin
        ? parseFloat(params.weightMin)
        : DEFAULT_WEIGHT_RANGE.min,
      max: params.weightMax
        ? parseFloat(params.weightMax)
        : DEFAULT_WEIGHT_RANGE.max,
    };
    filters.weightRange = weightRange;
  }

  if (params.treatmentStatus) {
    const statuses = params.treatmentStatus
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const validStatuses = statuses.filter(isTreatmentStatus);
    if (validStatuses.length) {
      filters.treatmentStatus = validStatuses;
    }
  }

  if (params.miningCountries) {
    filters.miningCountries = params.miningCountries.split(",").filter(Boolean);
  }

  if (params.qualityClassifications) {
    filters.qualityClassifications = params.qualityClassifications
      .split(",")
      .filter(Boolean);
  }

  if (params.hasColorChange) {
    filters.hasColorChange = params.hasColorChange === "true";
  }

  if (
    params.minLength ||
    params.maxLength ||
    params.minWidth ||
    params.maxWidth
  ) {
    filters.dimensionRange = {
      minLength: params.minLength ? parseFloat(params.minLength) : undefined,
      maxLength: params.maxLength ? parseFloat(params.maxLength) : undefined,
      minWidth: params.minWidth ? parseFloat(params.minWidth) : undefined,
      maxWidth: params.maxWidth ? parseFloat(params.maxWidth) : undefined,
    };
  }

  if (params.minPricePerCarat || params.maxPricePerCarat) {
    filters.pricePerCaratRange = {
      min: params.minPricePerCarat
        ? parseInt(params.minPricePerCarat, 10)
        : DEFAULT_PRICE_RANGE.min,
      max: params.maxPricePerCarat
        ? parseInt(params.maxPricePerCarat, 10)
        : DEFAULT_PRICE_RANGE.max,
      currency: DEFAULT_PRICE_RANGE.currency,
    };
  }

  // Boolean filters
  if (params.inStock) {
    filters.inStockOnly = params.inStock === "true";
  }

  if (params.certified) {
    filters.hasCertification = params.certified === "true";
  }

  if (params.hasImages) {
    filters.hasImages = params.hasImages === "true";
  }

  // Sorting
  if (params.sort && isValidGemstoneSort(params.sort)) {
    filters.sortBy = params.sort;
  }

  if (params.dir && (params.dir === "asc" || params.dir === "desc")) {
    filters.sortDirection = params.dir;
  }

  return filters as AdvancedGemstoneFilters;
};

// ===== URL QUERY STRING UTILITIES =====

export const filtersToQueryString = (
  filters: AdvancedGemstoneFilters
): string => {
  const params = filtersToUrlParams(filters);
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, value);
    }
  });

  return searchParams.toString();
};

export const queryStringToFilters = (
  queryString: string
): AdvancedGemstoneFilters => {
  const searchParams = new URLSearchParams(queryString);
  const params: Record<string, string> = {};

  // Convert URLSearchParams to our FilterUrlParams interface
  for (const [key, value] of searchParams.entries()) {
    if (isValidFilterParam(key)) {
      params[key] = value;
    }
  }

  return urlParamsToFilters(params as FilterUrlParams);
};

// ===== VALIDATION UTILITIES =====

const isValidGemstoneSort = (sort: string): sort is GemstoneSort => {
  const validSorts: GemstoneSort[] = [
    "created_at",
    "price_amount",
    "weight_carats",
    "name",
    "color",
    "cut",
  ];
  return validSorts.includes(sort as GemstoneSort);
};

const isTreatmentStatus = (value: string): value is TreatmentStatus => {
  const validStatuses: TreatmentStatus[] = [
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
  return validStatuses.includes(value as TreatmentStatus);
};

const isValidFilterParam = (param: string): boolean => {
  const validParams = [
    "search",
    "types",
    "colors",
    "cuts",
    "clarities",
    "origins",
    "priceMin",
    "priceMax",
    "weightMin",
    "weightMax",
    "treatmentStatus",
    "miningCountries",
    "qualityClassifications",
    "hasColorChange",
    "minLength",
    "maxLength",
    "minWidth",
    "maxWidth",
    "minPricePerCarat",
    "maxPricePerCarat",
    "inStock",
    "certified",
    "hasImages",
    "sort",
    "dir",
  ];
  return validParams.includes(param);
};

// ===== BROWSER HISTORY UTILITIES =====

export const updateUrlWithFilters = (
  filters: AdvancedGemstoneFilters,
  replace: boolean = false
): void => {
  if (typeof window === "undefined") return;

  const queryString = filtersToQueryString(filters);
  const url = queryString
    ? `${window.location.pathname}?${queryString}`
    : window.location.pathname;

  if (replace) {
    window.history.replaceState({}, "", url);
  } else {
    window.history.pushState({}, "", url);
  }
};

export const getFiltersFromCurrentUrl = (): AdvancedGemstoneFilters => {
  if (typeof window === "undefined") return DEFAULT_ADVANCED_FILTERS;

  return queryStringToFilters(window.location.search.slice(1));
};

// ===== FILTER COMPARISON UTILITIES =====

export const areFiltersEqual = (
  filters1: AdvancedGemstoneFilters,
  filters2: AdvancedGemstoneFilters
): boolean => {
  // Simple deep comparison for filter objects
  return JSON.stringify(filters1) === JSON.stringify(filters2);
};

export const getFilterDifferences = (
  oldFilters: AdvancedGemstoneFilters,
  newFilters: AdvancedGemstoneFilters
): Partial<AdvancedGemstoneFilters> => {
  const differences: Partial<AdvancedGemstoneFilters> = {};

  // Compare each filter property
  const keys = Object.keys(newFilters) as Array<keyof AdvancedGemstoneFilters>;

  keys.forEach((key) => {
    const oldValue = oldFilters[key];
    const newValue = newFilters[key];

    // Handle array comparisons
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (JSON.stringify(oldValue.sort()) !== JSON.stringify(newValue.sort())) {
        (differences as Record<string, unknown>)[key] = newValue;
      }
    }
    // Handle object comparisons (price/weight ranges)
    else if (typeof oldValue === "object" && typeof newValue === "object") {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        (differences as Record<string, unknown>)[key] = newValue;
      }
    }
    // Handle primitive comparisons
    else if (oldValue !== newValue) {
      (differences as Record<string, unknown>)[key] = newValue;
    }
  });

  return differences;
};

// ===== CLEAN URL UTILITIES =====

export const cleanUrlParams = (params: FilterUrlParams): FilterUrlParams => {
  const cleaned: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "false") {
      cleaned[key] = value;
    }
  });

  return cleaned as FilterUrlParams;
};

export const getMinimalUrlParams = (
  filters: AdvancedGemstoneFilters
): FilterUrlParams => {
  const params = filtersToUrlParams(filters);
  const defaults = filtersToUrlParams(DEFAULT_ADVANCED_FILTERS);
  const minimal: Record<string, string> = {};

  // Only include params that differ from defaults
  Object.entries(params).forEach(([key, value]) => {
    const defaultValue = defaults[key as keyof FilterUrlParams];
    if (value !== defaultValue && value !== undefined && value !== "") {
      minimal[key] = value;
    }
  });

  return minimal as FilterUrlParams;
};
