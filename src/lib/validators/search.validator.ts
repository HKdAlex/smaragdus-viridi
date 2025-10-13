/**
 * Search Validation Schemas
 *
 * Zod schemas for validating search API requests.
 * Used in /api/search routes for type-safe validation.
 */

import { z } from "zod";

/**
 * Search Query Schema
 * Validates full-text search requests
 */
export const searchQuerySchema = z.object({
  // Search query (optional for browsing without search)
  query: z.string().min(1).max(500).optional(),

  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),

  // Filters
  filters: z
    .object({
      // Price range
      minPrice: z.coerce.number().min(0).optional(),
      maxPrice: z.coerce.number().min(0).optional(),

      // Weight range
      minWeight: z.coerce.number().min(0).optional(),
      maxWeight: z.coerce.number().min(0).optional(),

      // Array filters
      gemstoneTypes: z.array(z.string()).optional(),
      colors: z.array(z.string()).optional(),
      cuts: z.array(z.string()).optional(),
      clarities: z.array(z.string()).optional(),
      origins: z.array(z.string()).optional(),

      // Boolean filters
      inStockOnly: z.coerce.boolean().optional(),
      hasImages: z.coerce.boolean().optional(),
      hasCertification: z.coerce.boolean().optional(),
      hasAIAnalysis: z.coerce.boolean().optional(),
    })
    .optional()
    .default({}),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

/**
 * Search Suggestions Schema
 * Validates autocomplete/suggestions requests
 */
export const searchSuggestionsSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export type SearchSuggestions = z.infer<typeof searchSuggestionsSchema>;

/**
 * Search Response Schema
 * Validates search API responses
 */
export const searchResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string().uuid(),
      serial_number: z.string(),
      name: z.string(),
      gemstone_type: z.string(),
      color: z.string(),
      cut: z.string().nullable(),
      clarity: z.string().nullable(),
      origin: z.string().nullable(),
      weight_carats: z.number(),
      price_amount: z.number(),
      price_currency: z.string(),
      description: z.string().nullable(),
      has_certification: z.boolean(),
      has_ai_analysis: z.boolean(),
      metadata_status: z.string().nullable(),
      created_at: z.string(),
      updated_at: z.string(),
      relevance_score: z.number().optional(),
    })
  ),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;

/**
 * Search Suggestions Response Schema
 */
export const searchSuggestionsResponseSchema = z.object({
  suggestions: z.array(
    z.object({
      suggestion: z.string(),
      category: z.enum(["serial_number", "type", "color", "origin"]),
      relevance: z.number(),
    })
  ),
});

export type SearchSuggestionsResponse = z.infer<
  typeof searchSuggestionsResponseSchema
>;

/**
 * Helper: Parse search query from URL params
 */
export function parseSearchQuery(searchParams: URLSearchParams): SearchQuery {
  const filters: SearchQuery["filters"] = {};

  // Parse price range
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  if (minPrice) filters.minPrice = Number(minPrice);
  if (maxPrice) filters.maxPrice = Number(maxPrice);

  // Parse weight range
  const minWeight = searchParams.get("minWeight");
  const maxWeight = searchParams.get("maxWeight");
  if (minWeight) filters.minWeight = Number(minWeight);
  if (maxWeight) filters.maxWeight = Number(maxWeight);

  // Parse array filters
  const gemstoneTypes = searchParams.get("gemstoneTypes");
  if (gemstoneTypes) filters.gemstoneTypes = gemstoneTypes.split(",");

  const colors = searchParams.get("colors");
  if (colors) filters.colors = colors.split(",");

  const cuts = searchParams.get("cuts");
  if (cuts) filters.cuts = cuts.split(",");

  const clarities = searchParams.get("clarities");
  if (clarities) filters.clarities = clarities.split(",");

  const origins = searchParams.get("origins");
  if (origins) filters.origins = origins.split(",");

  // Parse boolean filters
  const inStockOnly = searchParams.get("inStockOnly");
  if (inStockOnly) filters.inStockOnly = inStockOnly === "true";

  const hasImages = searchParams.get("hasImages");
  if (hasImages) filters.hasImages = hasImages === "true";

  const hasCertification = searchParams.get("hasCertification");
  if (hasCertification) filters.hasCertification = hasCertification === "true";

  const hasAIAnalysis = searchParams.get("hasAIAnalysis");
  if (hasAIAnalysis) filters.hasAIAnalysis = hasAIAnalysis === "true";

  return {
    query: searchParams.get("query") || undefined,
    page: Number(searchParams.get("page") || 1),
    pageSize: Number(searchParams.get("pageSize") || 24),
    filters,
  };
}
