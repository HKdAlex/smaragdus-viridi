/**
 * Search Types
 * 
 * TypeScript types for search functionality
 */

import type { Database } from "@/types/database";

// Gemstone type from database
type type DbGemstone = DatabasDbGemstone = Database["public"]["Tables"]["gemstones"]["Row"];

/**
 * Gemstone with Search Metadata
 */
export interface GemstoneSearchResult extends DbGemstone {
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
  
  // Boolean filters
  inStockOnly?: boolean;
  hasImages?: boolean;
  hasCertification?: boolean;
  hasAIAnalysis?: boolean;
}

/**
 * Search Request
 */
export interface SearchRequest {
  query?: string;
  page: number;
  pageSize: number;
  filters: SearchFilters;
}

/**
 * Search Response
 */
export interface SearchResponse {
  data: GemstoneSearchResult[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Search Suggestion
 */
export interface SearchSuggestion {
  suggestion: string;
  category: 'serial_number' | 'type' | 'color' | 'origin';
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

