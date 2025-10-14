/**
 * API Route: GET /api/search/fuzzy-suggestions
 *
 * Returns fuzzy search suggestions for "Did you mean?" functionality.
 * Uses the fuzzy_search_suggestions RPC function with trigram similarity.
 */

import { NextRequest, NextResponse } from "next/server";

import { SearchService } from "@/features/search/services/search.service";
import { z } from "zod";

// Schema for query parameters
const fuzzySuggestionsSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().int().min(1).max(10).default(5),
});

// Force dynamic rendering (no static optimization)
export const dynamic = "force-dynamic";

/**
 * GET /api/search/fuzzy-suggestions
 * Get fuzzy search suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query params
    const query = searchParams.get("query");
    const limit = Number(searchParams.get("limit") || 5);

    // Validate
    const validatedData = fuzzySuggestionsSchema.parse({ query, limit });

    // Get fuzzy suggestions
    const suggestions = await SearchService.getFuzzySuggestions(
      validatedData.query,
      validatedData.limit
    );

    // Return suggestions
    return NextResponse.json(
      { suggestions },
      {
        status: 200,
        headers: {
          // Cache suggestions for 5 minutes
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("[API /search/fuzzy-suggestions] Error:", error);

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
          error: "Fuzzy Suggestions Failed",
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
