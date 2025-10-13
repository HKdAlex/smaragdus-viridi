/**
 * Search Suggestions API Route
 * 
 * GET /api/search/suggestions?query=ruby&limit=10
 * 
 * Provides autocomplete suggestions using trigram similarity.
 * Returns suggestions from serial numbers, types, colors, and origins.
 * 
 * Features:
 * - Fuzzy matching with pg_trgm
 * - Multiple suggestion categories
 * - Relevance scoring
 * - Fast response (<100ms)
 */

import { NextRequest, NextResponse } from "next/server";
import { searchSuggestionsSchema } from "@/lib/validators/search.validator";
import { SearchService } from "@/features/search/services/search.service";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * GET /api/search/suggestions
 * Get autocomplete suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse and validate query params
    const query = searchParams.get("query");
    const limit = Number(searchParams.get("limit") || 10);
    
    // Validate
    const validatedData = searchSuggestionsSchema.parse({ query, limit });
    
    // Get suggestions
    const suggestions = await SearchService.getSuggestions(
      validatedData.query,
      validatedData.limit
    );
    
    // Return suggestions
    return NextResponse.json(suggestions, {
      status: 200,
      headers: {
        // Cache suggestions for 5 minutes
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("[API /search/suggestions] Error:", error);
    
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
          error: "Suggestions Failed",
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

