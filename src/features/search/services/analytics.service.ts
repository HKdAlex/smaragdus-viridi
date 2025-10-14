/**
 * Search Analytics Service
 *
 * Handles tracking and retrieval of search analytics data.
 * Tracks queries, result counts, and fuzzy search usage for optimization insights.
 */

import { supabaseAdmin } from "@/lib/supabase";

export interface TrackSearchParams {
  query: string;
  filters?: Record<string, any>;
  resultsCount: number;
  usedFuzzySearch: boolean;
  userId?: string;
  sessionId?: string;
}

export interface AnalyticsSummary {
  search_query: string;
  search_count: number;
  avg_results: number;
  zero_result_count: number;
  fuzzy_usage_count: number;
}

export interface SearchTrend {
  time_bucket: string;
  search_count: number;
  avg_results: number;
  zero_result_count: number;
  fuzzy_usage_count: number;
}

export interface AnalyticsMetrics {
  totalSearches: number;
  uniqueQueries: number;
  avgResultsPerSearch: number;
  zeroResultPercentage: number;
  fuzzySearchUsage: number;
  topQueries: AnalyticsSummary[];
  zeroResultQueries: Array<{
    query: string;
    count: number;
  }>;
}

export class SearchAnalyticsService {
  /**
   * Track a search query (fire and forget - doesn't block search)
   * Privacy-compliant: Only tracks search terms, not user data
   */
  static async trackSearch(params: TrackSearchParams): Promise<void> {
    if (!supabaseAdmin) {
      console.error(
        "[SearchAnalytics] supabaseAdmin is null, skipping tracking"
      );
      return;
    }

    try {
      const { error } = await supabaseAdmin.from("search_analytics").insert({
        search_query: params.query.toLowerCase().trim(),
        filters: params.filters || null,
        results_count: params.resultsCount,
        used_fuzzy_search: params.usedFuzzySearch,
        user_id: params.userId || null,
        session_id: params.sessionId || null,
      });

      if (error) {
        // Don't throw - tracking should never break search
        console.error("[SearchAnalytics] Failed to track search:", error);
      }
    } catch (error) {
      console.error(
        "[SearchAnalytics] Unexpected error tracking search:",
        error
      );
    }
  }

  /**
   * Get aggregated analytics summary (admin only)
   * Returns top queries, averages, and zero-result queries
   */
  static async getAnalyticsSummary(
    daysBack: number = 30
  ): Promise<AnalyticsSummary[]> {
    if (!supabaseAdmin) {
      throw new Error("Database connection failed");
    }

    const { data, error } = await supabaseAdmin.rpc(
      "get_search_analytics_summary",
      {
        days_back: daysBack,
      }
    );

    if (error) {
      console.error("[SearchAnalytics] Failed to get summary:", error);
      throw new Error(`Failed to get analytics summary: ${error.message}`);
    }

    return (data || []) as AnalyticsSummary[];
  }

  /**
   * Get search trends over time (admin only)
   * Shows daily/weekly patterns in search behavior
   */
  static async getSearchTrends(
    daysBack: number = 30,
    timeBucket: "hour" | "day" | "week" = "day"
  ): Promise<SearchTrend[]> {
    if (!supabaseAdmin) {
      throw new Error("Database connection failed");
    }

    const { data, error } = await supabaseAdmin.rpc("get_search_trends", {
      days_back: daysBack,
      bucket_size: timeBucket,
    });

    if (error) {
      console.error("[SearchAnalytics] Failed to get trends:", error);
      throw new Error(`Failed to get search trends: ${error.message}`);
    }

    return (data || []) as SearchTrend[];
  }

  /**
   * Get comprehensive analytics metrics (admin only)
   * Combines summary data with calculated metrics
   */
  static async getAnalyticsMetrics(
    daysBack: number = 30
  ): Promise<AnalyticsMetrics> {
    const summary = await this.getAnalyticsSummary(daysBack);

    // Calculate aggregated metrics
    const totalSearches = summary.reduce(
      (sum, item) => sum + Number(item.search_count),
      0
    );
    const uniqueQueries = summary.length;

    const totalResults = summary.reduce(
      (sum, item) => sum + Number(item.search_count) * Number(item.avg_results),
      0
    );
    const avgResultsPerSearch =
      totalSearches > 0 ? Math.round(totalResults / totalSearches) : 0;

    const totalZeroResults = summary.reduce(
      (sum, item) => sum + Number(item.zero_result_count),
      0
    );
    const zeroResultPercentage =
      totalSearches > 0
        ? Math.round((totalZeroResults / totalSearches) * 100)
        : 0;

    const totalFuzzyUsage = summary.reduce(
      (sum, item) => sum + Number(item.fuzzy_usage_count),
      0
    );
    const fuzzySearchUsage =
      totalSearches > 0
        ? Math.round((totalFuzzyUsage / totalSearches) * 100)
        : 0;

    // Extract zero-result queries
    const zeroResultQueries = summary
      .filter((item) => Number(item.zero_result_count) > 0)
      .map((item) => ({
        query: item.search_query,
        count: Number(item.zero_result_count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      totalSearches,
      uniqueQueries,
      avgResultsPerSearch,
      zeroResultPercentage,
      fuzzySearchUsage,
      topQueries: summary.slice(0, 50),
      zeroResultQueries,
    };
  }

  /**
   * Get user's search history (user-specific, privacy-focused)
   * Only returns user's own searches
   */
  static async getUserSearchHistory(
    userId: string,
    limit: number = 50
  ): Promise<
    Array<{
      query: string;
      resultsCount: number;
      usedFuzzy: boolean;
      timestamp: string;
    }>
  > {
    if (!supabaseAdmin) {
      throw new Error("Database connection failed");
    }

    const { data, error } = await supabaseAdmin
      .from("search_analytics")
      .select("search_query, results_count, used_fuzzy_search, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[SearchAnalytics] Failed to get user history:", error);
      throw new Error(`Failed to get search history: ${error.message}`);
    }

    return (data || []).map((row) => ({
      query: row.search_query,
      resultsCount: row.results_count,
      usedFuzzy: row.used_fuzzy_search ?? false,
      timestamp: row.created_at ?? new Date().toISOString(),
    }));
  }
}
