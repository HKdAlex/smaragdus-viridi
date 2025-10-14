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

    const { query, page, pageSize, filters, locale, searchDescriptions } =
      request;

    const rpcPayload = {
      search_query: query || "",
      search_locale: locale,
      filters: {
        ...((filters || {}) as any),
        searchDescriptions: !!searchDescriptions,
      },
      page_num: page,
      page_size: pageSize,
    };

    // Try exact search first
    const { data, error } = await supabase.rpc(
      "search_gemstones_multilingual",
      rpcPayload
    );

    const resultData = (data ?? []) as any[];

    if (error) {
      console.error("[SearchService] Full-text search error:", error);
      throw new Error(`Search failed: ${error.message}`);
    }

    // If exact search returns no results, try fuzzy search
    if (resultData.length === 0 && query && query.trim().length > 0) {
      console.log(
        `[SearchService] No exact matches for "${query}", trying fuzzy search...`
      );

      const fuzzyFilters = {
        ...(filters || {}),
        useFuzzy: true,
      };

      const { data: fuzzyRaw, error: fuzzyError } = await supabase.rpc(
        "search_gemstones_multilingual",
        {
          ...rpcPayload,
          search_query: query,
          filters: {
            ...((fuzzyFilters || {}) as any),
            searchDescriptions: !!searchDescriptions,
          },
        }
      );

      const fuzzyData = (fuzzyRaw ?? []) as any[];

      if (fuzzyError) {
        console.error("[SearchService] Fuzzy search error:", fuzzyError);
        // Don't throw, just return empty results
      } else if (fuzzyData && fuzzyData.length > 0) {
        console.log(
          `[SearchService] Fuzzy search found ${fuzzyData.length} results`
        );
        return await this.buildSearchResponse(fuzzyData, page, pageSize, true);
      }
    }

    if (resultData.length === 0) {
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

    return await this.buildSearchResponse(resultData, page, pageSize, false);
  }

  /**
   * Build search response from raw data
   * Fetches images for all gemstones in a single query
   */
  private static async buildSearchResponse(
    data: any[],
    page: number,
    pageSize: number,
    usedFuzzy: boolean
  ): Promise<SearchResponse> {
    // Extract total count from first row
    const totalCount = data[0]?.total_count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // If no results, return empty response
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
        usedFuzzySearch: usedFuzzy,
      };
    }

    // Extract gemstone IDs
    const gemstoneIds = data.map((row: any) => row.id);

    // Fetch images for all gemstones in a single query
    if (!supabaseAdmin) {
      console.error(
        "[SearchService] supabaseAdmin is null, skipping image fetch"
      );
      // Return results without images rather than failing completely
      const results = data.map((row: any) => ({
        ...row,
        images: [],
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

    const { data: imagesData, error: imagesError } = await supabaseAdmin
      .from("gemstone_images")
      .select("id, gemstone_id, image_url, is_primary, image_order")
      .in("gemstone_id", gemstoneIds)
      .order("image_order", { ascending: true });

    if (imagesError) {
      console.error("[SearchService] Error fetching images:", imagesError);
    }

    // Group images by gemstone_id
    const imagesByGemstone = new Map<string, any[]>();
    (imagesData || []).forEach((img) => {
      if (!imagesByGemstone.has(img.gemstone_id)) {
        imagesByGemstone.set(img.gemstone_id, []);
      }
      imagesByGemstone.get(img.gemstone_id)!.push(img);
    });

    // Map results with images (handle renamed columns)
    const results = data.map((row: any) => ({
      ...row,
      id: row.gemstone_id || row.id,
      name: row.gemstone_name || row.name, // Handle renamed column
      images: imagesByGemstone.get(row.gemstone_id || row.id) || [],
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
    limit: number = 5,
    locale: string = "en"
  ): Promise<Array<{ suggestion: string; score: number; type: string }>> {
    if (!supabaseAdmin) {
      throw new Error("Database connection failed");
    }

    const supabase = supabaseAdmin;

    // Call the fuzzy_search_suggestions RPC function
    const { data, error } = await supabase.rpc(
      "fuzzy_search_suggestions" as any,
      {
        search_term: query,
        suggestion_limit: limit,
        search_locale: locale,
      }
    );

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
