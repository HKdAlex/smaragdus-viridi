/**
 * Search Query Hook
 *
 * React Query hook for full-text search with filters and pagination.
 */

"use client";

import type { AdvancedGemstoneFilters } from "@/features/gemstones/types/filter.types";
import type { CatalogGemstone } from "@/features/gemstones/services/gemstone-fetch.service";
import { useQuery } from "@tanstack/react-query";

export interface SearchQueryParams {
  query: string;
  filters?: AdvancedGemstoneFilters;
  page?: number;
  pageSize?: number;
  locale: string;
  searchDescriptions?: boolean;
}

export type SearchResult = CatalogGemstone;

export interface SearchResponse {
  results: SearchResult[];
  pagination: {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  usedFuzzySearch?: boolean;
}

/**
 * Fetch search results from API
 */
async function fetchSearchResults(
  params: SearchQueryParams
): Promise<SearchResponse> {
  const {
    query,
    filters = {},
    page = 1,
    pageSize = 24,
    locale,
    searchDescriptions = false,
  } = params;

  const response = await fetch("/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      page,
      pageSize,
      filters,
      locale,
      searchDescriptions,
    }),
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * React Query hook for full-text search
 *
 * Features:
 * - Intelligent caching (5 min stale time)
 * - Automatic refetch on filter/page changes
 * - Loading and error states
 *
 * @param params - Search parameters
 */
export function useSearchQuery(params: SearchQueryParams) {
  const {
    query,
    filters = {},
    page = 1,
    pageSize = 24,
    locale,
    searchDescriptions = false,
  } = params;

  return useQuery({
    queryKey: [
      "search",
      query,
      filters,
      page,
      pageSize,
      locale,
      searchDescriptions,
    ],
    queryFn: () => fetchSearchResults(params),
    enabled: query.length > 0, // Only search if query exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
