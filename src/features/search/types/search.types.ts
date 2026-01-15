/**
 * Search Types
 *
 * TypeScript types for search functionality
 */

import type { CatalogGemstone } from "@/features/gemstones/services/gemstone-fetch.service";
import type { Database } from "@/shared/types/database";

// Gemstone type from database
type DbGemstone = Database["public"]["Tables"]["gemstones"]["Row"];

/**
 * Gemstone with Search Metadata
 *
 * Extends CatalogGemstone to ensure type consistency between search and catalog.
 * Adds search-specific metadata (relevance_score, total_count).
 */
export interface GemstoneSearchResult extends CatalogGemstone {
  relevance_score?: number;
  total_count?: number;
}

/**
 * Search Filters
 * Matches AdvancedGemstoneFilters but with search-specific additions
 */
export interface SearchFilters {
  // Price range
  minPrice?: number;
  maxPrice?: number;

  // Weight range
  minWeight?: number;
  maxWeight?: number;

  // Array filters
  gemstoneTypes?: string[];
  colors?: string[];
  cuts?: string[];
  clarities?: string[];
  origins?: string[];

  // Professional filters (FILTER-C3.2)
  treatmentStatus?: string[];
  miningCountries?: string[];
  qualityClassifications?: string[];

  // Boolean filters
  inStockOnly?: boolean;
  hasImages?: boolean;
  hasCertification?: boolean;
  hasAIAnalysis?: boolean;
  hasColorChange?: boolean;

  // Dimension filters (FILTER-C3.2)
  minLength?: number;
  maxLength?: number;
  minWidth?: number;
  maxWidth?: number;

  // Price per carat filter (FILTER-C3.2)
  minPricePerCarat?: number;
  maxPricePerCarat?: number;
}

/**
 * Search Request
 */
export interface SearchRequest {
  query?: string;
  page: number;
  pageSize: number;
  filters: SearchFilters;
  locale: string;
  searchDescriptions?: boolean;
}

/**
 * Search Response
 */
export interface SearchResponse {
  results: GemstoneSearchResult[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  usedFuzzySearch?: boolean;
}

/**
 * Search Suggestion
 */
export interface SearchSuggestion {
  suggestion: string;
  category: "serial_number" | "type" | "color" | "origin";
  relevance: number;
}

/**
 * Search Suggestions Response
 */
export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}

/**
 * Search Analytics Event
 */
export interface SearchAnalyticsEvent {
  search_query?: string;
  filters: SearchFilters;
  results_count: number;
  user_id?: string;
  session_id: string;
  created_at: string;
}
