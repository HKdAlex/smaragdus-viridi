/**
 * Unified Search API Route
 *
 * POST /api/search
 *
 * Full-text search with relevance ranking and comprehensive filtering.
 * Uses PostgreSQL full-text search with ts_rank_cd for relevance scoring.
 *
 * Features:
 * - Full-text search across multiple fields
 * - Relevance ranking
 * - All catalog filters supported
 * - Pagination
 * - Type-safe with Zod validation
 */

import { NextRequest, NextResponse } from "next/server";

import { SearchAnalyticsService } from "@/features/search/services/analytics.service";
import type { SearchRequest } from "@/features/search/types/search.types";
import { SearchService } from "@/features/search/services/search.service";
import { createServerSupabaseClient } from "@/lib/supabase";
import { searchQuerySchema } from "@/lib/validators/search.validator";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * POST /api/search
 * Full-text search with filters
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = searchQuerySchema.parse(body);

    const headerLocale =
      request.headers.get("x-locale") ||
      request.headers.get("accept-language")?.split(",")[0]?.slice(0, 2) ||
      "en";
    const effectiveLocale = validatedData.locale || headerLocale;

    // Build search request
    const searchRequest: SearchRequest = {
      query: validatedData.query,
      page: validatedData.page,
      pageSize: validatedData.pageSize,
      filters: validatedData.filters || {},
      locale: effectiveLocale,
      searchDescriptions: validatedData.searchDescriptions,
    };

    // Execute search
    const results = await SearchService.searchGemstones(searchRequest);

    // Track search analytics (fire and forget - don't await)
    if (validatedData.query) {
      // Get user ID if authenticated
      let userId: string | undefined;
      try {
        const supabase = await createServerSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        userId = user?.id;
      } catch (error) {
        // Anonymous tracking is fine
      }

      SearchAnalyticsService.trackSearch({
        query: validatedData.query,
        filters: validatedData.filters,
        resultsCount: results.results.length,
        usedFuzzySearch: results.usedFuzzySearch || false,
        userId,
      }).catch((error) => {
        console.error("[SearchAnalytics] Background tracking failed:", error);
      });
    }

    // Return results
    return NextResponse.json(results, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[API /search] Error:", error);

    // Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Validation Error",
          details: error.message,
        },
        { status: 400 }
      );
    }

    // Service errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Search Failed",
          message: error.message,
        },
        { status: 500 }
      );
    }

    // Unknown errors
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search
 * Alternative GET endpoint for simple searches (without complex filters)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query params
    const query = searchParams.get("query") || undefined;
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 24);

    // Build search request (minimal filters via GET)
    const headerLocale =
      request.headers.get("x-locale") ||
      request.headers.get("accept-language")?.split(",")[0]?.slice(0, 2) ||
      "en";

    const searchRequest: SearchRequest = {
      query,
      page,
      pageSize,
      filters: {},
      locale: headerLocale,
      searchDescriptions: false,
    };

    // Execute search
    const results = await SearchService.searchGemstones(searchRequest);

    // Track search analytics (fire and forget - don't await)
    if (query) {
      // Get user ID if authenticated
      let userId: string | undefined;
      try {
        const supabase = await createServerSupabaseClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        userId = user?.id;
      } catch (error) {
        // Anonymous tracking is fine
      }

      SearchAnalyticsService.trackSearch({
        query,
        filters: {},
        resultsCount: results.results.length,
        usedFuzzySearch: results.usedFuzzySearch || false,
        userId,
      }).catch((error) => {
        console.error("[SearchAnalytics] Background tracking failed:", error);
      });
    }

    // Return results
    return NextResponse.json(results, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[API /search GET] Error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Search Failed",
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
