// Advanced Filtering Types for Gemstone Catalog
// Following Type Governance: Import from shared types ONLY

import type {
  CurrencyCode,
  GemClarity,
  GemColor,
  GemCut,
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

export interface AdvancedGemstoneFilters {
  // Text search
  readonly search?: string;

  // Categorical filters (multi-select)
  readonly gemstoneTypes?: GemstoneType[];
  readonly colors?: GemColor[];
  readonly cuts?: GemCut[];
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
  cuts?: GemCut[];
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
    category: "diamond" | "colored" | "fancy";
  }>;
  readonly cuts: Array<{
    value: GemCut;
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
  | { type: "TOGGLE_CUT"; payload: GemCut }
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

// ===== FILTER LABELS =====

export const GEMSTONE_TYPE_LABELS: Record<GemstoneType, string> = {
  diamond: "Diamond",
  emerald: "Emerald",
  ruby: "Ruby",
  sapphire: "Sapphire",
  amethyst: "Amethyst",
  topaz: "Topaz",
  garnet: "Garnet",
  peridot: "Peridot",
  citrine: "Citrine",
  tanzanite: "Tanzanite",
  aquamarine: "Aquamarine",
  morganite: "Morganite",
  tourmaline: "Tourmaline",
  zircon: "Zircon",
  apatite: "Apatite",
  quartz: "Quartz",
  paraiba: "Paraiba",
  spinel: "Spinel",
  alexandrite: "Alexandrite",
  agate: "Agate",
};

export const COLOR_LABELS: Record<GemColor, string> = {
  // Diamond colors
  D: "D (Colorless)",
  E: "E (Colorless)",
  F: "F (Colorless)",
  G: "G (Near Colorless)",
  H: "H (Near Colorless)",
  I: "I (Near Colorless)",
  J: "J (Near Colorless)",
  K: "K (Faint)",
  L: "L (Faint)",
  M: "M (Faint)",
  // Basic colors
  red: "Red",
  blue: "Blue",
  green: "Green",
  yellow: "Yellow",
  pink: "Pink",
  white: "White",
  black: "Black",
  colorless: "Colorless",
  // Fancy colors
  "fancy-yellow": "Fancy Yellow",
  "fancy-blue": "Fancy Blue",
  "fancy-pink": "Fancy Pink",
  "fancy-green": "Fancy Green",
};

export const CUT_LABELS: Record<GemCut, string> = {
  round: "Round",
  oval: "Oval",
  marquise: "Marquise",
  pear: "Pear",
  emerald: "Emerald",
  princess: "Princess",
  cushion: "Cushion",
  radiant: "Radiant",
  fantasy: "Fantasy",
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
  FL: "FL (Flawless)",
  IF: "IF (Internally Flawless)",
  VVS1: "VVS1 (Very Very Slightly Included)",
  VVS2: "VVS2 (Very Very Slightly Included)",
  VS1: "VS1 (Very Slightly Included)",
  VS2: "VS2 (Very Slightly Included)",
  SI1: "SI1 (Slightly Included)",
  SI2: "SI2 (Slightly Included)",
  I1: "I1 (Included)",
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
  if (filters.hasCertification) count++;
  if (filters.hasImages) count++;
  if (filters.hasAIAnalysis) count++;
  return count;
};

export const clearAllFilters = (): AdvancedGemstoneFilters =>
  DEFAULT_ADVANCED_FILTERS;

// ===== COLOR CATEGORIZATION =====

export const categorizeColor = (
  color: GemColor
): "diamond" | "colored" | "fancy" => {
  const diamondColors: GemColor[] = [
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
  ];
  const fancyColors: GemColor[] = [
    "fancy-yellow",
    "fancy-blue",
    "fancy-pink",
    "fancy-green",
  ];

  if (diamondColors.includes(color)) return "diamond";
  if (fancyColors.includes(color)) return "fancy";
  return "colored";
};

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
