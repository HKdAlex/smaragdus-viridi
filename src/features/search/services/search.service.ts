/**
 * Search Service
 *
 * Business logic for full-text search functionality.
 * Uses Supabase RPC functions for database queries.
 */

import type {
  SearchRequest,
  SearchResponse,
  SearchSuggestion,
  SearchSuggestionsResponse,
} from "../types/search.types";

import { supabaseAdmin } from "@/lib/supabase";

export class SearchService {
  /**
   * Full-text search with relevance ranking and fuzzy fallback
   */
  static async searchGemstones(
    request: SearchRequest
  ): Promise<SearchResponse> {
    if (!supabaseAdmin) {
      throw new Error("Database connection failed");
    }

    const supabase = supabaseAdmin;

    const { query, page, pageSize, filters } = request;

    // Try exact search first
    const { data, error } = await supabase.rpc("search_gemstones_fulltext", {
      search_query: query || "",
      filters: (filters || {}) as any,
      page_num: page,
      page_size: pageSize,
    });

    if (error) {
      console.error("[SearchService] Full-text search error:", error);
      throw new Error(`Search failed: ${error.message}`);
    }

    // If exact search returns no results, try fuzzy search
    if ((!data || data.length === 0) && query && query.trim().length > 0) {
      console.log(
        `[SearchService] No exact matches for "${query}", trying fuzzy search...`
      );

      const fuzzyFilters = {
        ...(filters || {}),
        useFuzzy: true,
      };

      const { data: fuzzyData, error: fuzzyError } = await supabase.rpc(
        "search_gemstones_fulltext",
        {
          search_query: query,
          filters: fuzzyFilters as any,
          page_num: page,
          page_size: pageSize,
        }
      );

      if (fuzzyError) {
        console.error("[SearchService] Fuzzy search error:", fuzzyError);
        // Don't throw, just return empty results
      } else if (fuzzyData && fuzzyData.length > 0) {
        console.log(
          `[SearchService] Fuzzy search found ${fuzzyData.length} results`
        );
        return this.buildSearchResponse(fuzzyData, page, pageSize, true);
      }
    }

    if (!data || data.length === 0) {
      return {
        results: [],
        pagination: {
          page,
          pageSize,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        usedFuzzySearch: false,
      };
    }

    return this.buildSearchResponse(data, page, pageSize, false);
  }

  /**
   * Build search response from raw data
   */
  private static buildSearchResponse(
    data: any[],
    page: number,
    pageSize: number,
    usedFuzzy: boolean
  ): SearchResponse {
    // Extract total count from first row
    const totalCount = data[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Map results
    const results = data.map((row: any) => ({
      id: row.id,
      serial_number: row.serial_number,
      name: row.name,
      gemstone_type: row.gemstone_type,
      color: row.color,
      cut: row.cut,
      clarity: row.clarity,
      origin_id: row.origin_id,
      weight_carats: row.weight_carats,
      price_amount: row.price_amount,
      price_currency: row.price_currency,
      description: row.description,
      in_stock: row.in_stock,
      has_certification: row.has_certification,
      has_ai_analysis: row.has_ai_analysis,
      metadata_status: row.metadata_status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      relevance_score: row.relevance_score,
    }));

    return {
      results: results as any,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      usedFuzzySearch: usedFuzzy,
    };
  }

  /**
   * Get fuzzy search suggestions for "Did you mean?"
   */
  static async getFuzzySuggestions(
    query: string,
    limit: number = 5
  ): Promise<Array<{ suggestion: string; score: number; type: string }>> {
    if (!supabaseAdmin) {
      throw new Error("Database connection failed");
    }

    const supabase = supabaseAdmin;

    // Call the fuzzy_search_suggestions RPC function
    const { data, error } = await supabase.rpc("fuzzy_search_suggestions", {
      search_term: query,
      suggestion_limit: limit,
    });

    if (error) {
      console.error("[SearchService] Fuzzy suggestions error:", error);
      return [];
    }

    return (data || []).map((row: any) => ({
      suggestion: row.suggestion,
      score: row.similarity_score,
      type: row.match_type,
    }));
  }

  /**
   * Get search suggestions (autocomplete)
   */
  static async getSuggestions(
    query: string,
    limit: number = 10
  ): Promise<SearchSuggestionsResponse> {
    if (!supabaseAdmin) {
      throw new Error("Database connection failed");
    }

    const supabase = supabaseAdmin;

    // Call the get_search_suggestions RPC function
    const { data, error } = await supabase.rpc("get_search_suggestions", {
      query,
      limit_count: limit,
    });

    if (error) {
      console.error("[SearchService] Suggestions error:", error);
      throw new Error(`Suggestions failed: ${error.message}`);
    }

    const suggestions: SearchSuggestion[] = (data || []).map((row: any) => ({
      suggestion: row.suggestion,
      category: row.category,
      relevance: row.relevance,
    }));

    return { suggestions };
  }

  /**
   * Validate search query (basic sanitization)
   */
  static sanitizeSearchQuery(query: string): string {
    // Remove special characters that could break tsquery
    return query
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/[&|!()]/g, "") // Remove boolean operators
      .trim();
  }

  /**
   * Build search query with weights
   *
   * Example: "ruby 2ct" -> "ruby:A & 2ct:B"
   * A = highest weight (serial_number)
   * B = high weight (name, type)
   * C = medium weight (color, origin)
   * D = low weight (description)
   */
  static buildWeightedSearchQuery(query: string): string {
    const sanitized = this.sanitizeSearchQuery(query);
    const terms = sanitized.split(/\s+/).filter(Boolean);

    if (terms.length === 0) return "";

    // Weight terms: first term gets highest weight
    return terms
      .map((term, index) => {
        const weight = index === 0 ? "A" : "B";
        return `${term}:${weight}`;
      })
      .join(" & ");
  }
}
