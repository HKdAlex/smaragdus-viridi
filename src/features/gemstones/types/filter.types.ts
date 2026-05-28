// Advanced Filtering Types for Gemstone Catalog
// Following Type Governance: Import from shared types ONLY

import type {
    CurrencyCode,
    GemClarity,
    GemColor,
    // CUT-C3.1: GemCut enum removed
    GemstoneType,
} from "@/shared/types";

// ===== CORE FILTER INTERFACES =====

export interface PriceRange {
  readonly min: number; // In smallest currency unit (cents)
  readonly max: number;
  readonly currency: CurrencyCode;
}

export interface WeightRange {
  readonly min: number; // In carats
  readonly max: number;
}

export type TreatmentStatus =
  | "natural"
  | "heated"
  | "oiled"
  | "diffused"
  | "irradiated"
  | "filled"
  | "coated"
  | "untreated"
  | "unknown"
  | "other";

export interface DimensionRange {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minWidth?: number;
  readonly maxWidth?: number;
}

export interface AdvancedGemstoneFilters {
  // Text search
  readonly search?: string;

  // Categorical filters (multi-select)
  readonly gemstoneTypes?: GemstoneType[];
  readonly colors?: GemColor[];
  readonly cuts?: string[]; // CUT-C3.1: cuts are now strings
  readonly clarities?: GemClarity[];
  readonly origins?: string[]; // Origin names

  // Range filters
  readonly priceRange?: PriceRange;
  readonly weightRange?: WeightRange;

  // Boolean filters
  readonly inStockOnly?: boolean;
  readonly hasCertification?: boolean;
  readonly hasImages?: boolean;
  readonly hasAIAnalysis?: boolean;

  // Professional filters (multi-select + boolean)
  readonly treatmentStatus?: TreatmentStatus[];
  readonly miningCountries?: string[];
  readonly qualityClassifications?: string[];
  readonly hasColorChange?: boolean;

  // Technical filters
  readonly dimensionRange?: DimensionRange;
  readonly pricePerCaratRange?: PriceRange;

  // Sorting
  readonly sortBy?: GemstoneSort;
  readonly sortDirection?: "asc" | "desc";
}

// Mutable version for internal use (URL utilities, etc.)
export interface MutableAdvancedGemstoneFilters {
  // Text search
  search?: string;

  // Categorical filters (multi-select)
  gemstoneTypes?: GemstoneType[];
  colors?: GemColor[];
  cuts?: string[]; // CUT-C3.1: cuts are now strings
  clarities?: GemClarity[];
  origins?: string[]; // Origin names

  // Range filters
  priceRange?: PriceRange;
  weightRange?: WeightRange;

  // Boolean filters
  inStockOnly?: boolean;
  hasCertification?: boolean;
  hasImages?: boolean;
  hasAIAnalysis?: boolean;

  // Professional filters (multi-select + boolean)
  treatmentStatus?: TreatmentStatus[];
  miningCountries?: string[];
  qualityClassifications?: string[];
  hasColorChange?: boolean;

  // Technical filters
  dimensionRange?: DimensionRange;
  pricePerCaratRange?: PriceRange;

  // Sorting
  sortBy?: GemstoneSort;
  sortDirection?: "asc" | "desc";
}

export type GemstoneSort =
  | "created_at"
  | "price_amount"
  | "weight_carats"
  | "name"
  | "color"
  | "cut";

// ===== FILTER OPTIONS FOR UI =====

export interface FilterOptions {
  readonly gemstoneTypes: Array<{
    value: GemstoneType;
    label: string;
    count: number;
  }>;
  readonly colors: Array<{
    value: GemColor;
    label: string;
    count: number;
    category: "diamond" | "colored";
  }>;
  readonly cuts: Array<{
    value: string; // CUT-C3.1: cuts are now strings
    label: string;
    count: number;
  }>;
  readonly clarities: Array<{
    value: GemClarity;
    label: string;
    count: number;
    order: number;
  }>;
  readonly origins: Array<{
    value: string;
    label: string;
    country: string;
    count: number;
  }>;
  readonly priceRange: {
    min: number;
    max: number;
    currency: CurrencyCode;
  };
  readonly weightRange: {
    min: number;
    max: number;
  };
}

// ===== FILTER STATE MANAGEMENT =====

export interface FilterState {
  readonly filters: AdvancedGemstoneFilters;
  readonly isLoading: boolean;
  readonly resultCount: number;
  readonly appliedFilterCount: number;
}

export type FilterAction =
  | { type: "SET_SEARCH"; payload: string }
  | { type: "TOGGLE_GEMSTONE_TYPE"; payload: GemstoneType }
  | { type: "TOGGLE_COLOR"; payload: GemColor }
  | { type: "TOGGLE_CUT"; payload: string } // CUT-C3.1: cuts are now strings
  | { type: "TOGGLE_CLARITY"; payload: GemClarity }
  | { type: "TOGGLE_ORIGIN"; payload: string }
  | { type: "SET_PRICE_RANGE"; payload: PriceRange }
  | { type: "SET_WEIGHT_RANGE"; payload: WeightRange }
  | { type: "TOGGLE_IN_STOCK_ONLY"; payload: boolean }
  | { type: "TOGGLE_HAS_CERTIFICATION"; payload: boolean }
  | { type: "TOGGLE_HAS_IMAGES"; payload: boolean }
  | { type: "TOGGLE_HAS_AI_ANALYSIS"; payload: boolean }
  | {
      type: "SET_SORT";
      payload: { sortBy: GemstoneSort; sortDirection: "asc" | "desc" };
    }
  | { type: "RESET_FILTERS" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_RESULT_COUNT"; payload: number };

// ===== URL PARAMS MAPPING =====

export interface FilterUrlParams {
  readonly search?: string;
  readonly types?: string; // comma-separated
  readonly colors?: string; // comma-separated
  readonly cuts?: string; // comma-separated
  readonly clarities?: string; // comma-separated
  readonly origins?: string; // comma-separated
  readonly priceMin?: string;
  readonly priceMax?: string;
  readonly weightMin?: string;
  readonly weightMax?: string;
  readonly treatmentStatus?: string; // comma-separated
  readonly miningCountries?: string; // comma-separated
  readonly qualityClassifications?: string; // comma-separated
  readonly hasColorChange?: string; // 'true' | 'false'
  readonly minLength?: string;
  readonly maxLength?: string;
  readonly minWidth?: string;
  readonly maxWidth?: string;
  readonly minPricePerCarat?: string;
  readonly maxPricePerCarat?: string;
  readonly inStock?: string; // 'true' | 'false'
  readonly certified?: string; // 'true' | 'false'
  readonly hasImages?: string; // 'true' | 'false'
  readonly sort?: string;
  readonly dir?: string; // 'asc' | 'desc'
}

// ===== HELPER TYPES =====

export interface FilterSummary {
  readonly totalFiltersApplied: number;
  readonly activeCategories: string[];
  readonly priceRangeActive: boolean;
  readonly weightRangeActive: boolean;
  readonly searchActive: boolean;
}

// ===== CONSTANTS =====

export const DEFAULT_PRICE_RANGE: PriceRange = {
  min: 650, // $6.50 (stored in cents)
  max: 4200000, // $42,000.00 (stored in cents)
  currency: "USD",
};

export const DEFAULT_WEIGHT_RANGE: WeightRange = {
  min: 0.5,
  max: 16.0,
};

export const DEFAULT_ADVANCED_FILTERS: AdvancedGemstoneFilters = {
  inStockOnly: true,
  sortBy: "created_at",
  sortDirection: "desc",
};

// Color labels: use useFilterLabels() (gemstones.colors.*) — not hardcoded here.

// CUT-C3.1: cuts are now strings
export const CUT_LABELS: Record<string, string> = {
  round: "Round",
  oval: "Oval",
  marquise: "Marquise",
  pear: "Pear",
  emerald: "Emerald",
  princess: "Princess",
  cushion: "Cushion",
  radiant: "Radiant",
  fantasy: "Fantasy",
  code: "Designer",
  baguette: "Baguette",
  asscher: "Asscher",
  rhombus: "Rhombus",
  trapezoid: "Trapezoid",
  triangle: "Triangle",
  heart: "Heart",
  cabochon: "Cabochon",
  pentagon: "Pentagon",
  hexagon: "Hexagon",
};

export const CLARITY_LABELS: Record<GemClarity, string> = {
  FL: "FL",
  IF: "IF",
  VVS1: "VVS1",
  VVS2: "VVS2",
  VS1: "VS1",
  VS2: "VS2",
  SI1: "SI1",
  SI2: "SI2",
  I1: "I1",
};

export const SORT_LABELS: Record<GemstoneSort, string> = {
  created_at: "Newest First",
  price_amount: "Price",
  weight_carats: "Carat Weight",
  name: "Gemstone Type",
  color: "Color",
  cut: "Cut",
};

// ===== FILTER UTILITY FUNCTIONS =====

export const hasActiveFilters = (filters: AdvancedGemstoneFilters): boolean => {
  return !!(
    filters.search ||
    filters.gemstoneTypes?.length ||
    filters.colors?.length ||
    filters.cuts?.length ||
    filters.clarities?.length ||
    filters.origins?.length ||
    filters.priceRange ||
    filters.weightRange ||
    filters.treatmentStatus?.length ||
    filters.miningCountries?.length ||
    filters.qualityClassifications?.length ||
    filters.hasColorChange ||
    filters.dimensionRange ||
    filters.pricePerCaratRange ||
    filters.hasCertification ||
    filters.hasImages ||
    filters.hasAIAnalysis
  );
};

export const getActiveFilterCount = (
  filters: AdvancedGemstoneFilters
): number => {
  let count = 0;
  if (filters.search) count++;
  if (filters.gemstoneTypes?.length) count++;
  if (filters.colors?.length) count++;
  if (filters.cuts?.length) count++;
  if (filters.clarities?.length) count++;
  if (filters.origins?.length) count++;
  if (filters.priceRange) count++;
  if (filters.weightRange) count++;
  if (filters.treatmentStatus?.length) count++;
  if (filters.miningCountries?.length) count++;
  if (filters.qualityClassifications?.length) count++;
  if (filters.hasColorChange) count++;
  if (filters.dimensionRange) count++;
  if (filters.pricePerCaratRange) count++;
  if (filters.hasCertification) count++;
  if (filters.hasImages) count++;
  if (filters.hasAIAnalysis) count++;
  return count;
};

export const clearAllFilters = (): AdvancedGemstoneFilters =>
  DEFAULT_ADVANCED_FILTERS;

// ===== CLARITY ORDERING =====

export const CLARITY_ORDER: Record<GemClarity, number> = {
  FL: 1,
  IF: 2,
  VVS1: 3,
  VVS2: 4,
  VS1: 5,
  VS2: 6,
  SI1: 7,
  SI2: 8,
  I1: 9,
};
