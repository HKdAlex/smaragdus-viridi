/**
 * Use Infinite Search Query Hook
 *
 * React Query infinite query wrapper for search with automatic pagination.
 * Fetches pages of search results as user scrolls, with intelligent caching.
 */

"use client";

import type { CatalogGemstone } from "@/features/gemstones/services/gemstone-fetch.service";
import type { AdvancedGemstoneFilters } from "@/features/gemstones/types/filter.types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export interface UseInfiniteSearchQueryParams {
  query: string;
  filters?: AdvancedGemstoneFilters;
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
  params: UseInfiniteSearchQueryParams,
  page: number
): Promise<SearchResponse> {
  const {
    query,
    filters = {},
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
 * React Query infinite query hook for search
 *
 * Features:
 * - Automatic page fetching as user scrolls
 * - Intelligent caching (5 min stale time)
 * - Flattened array of all loaded results
 * - Total count tracking
 * - Fuzzy search indicator
 *
 * @param params - Search parameters
 */
export function useInfiniteSearchQuery(params: UseInfiniteSearchQueryParams) {
  const {
    query,
    filters = {},
    pageSize = 24,
    locale,
    searchDescriptions = false,
  } = params;

  const infiniteQuery = useInfiniteQuery({
    queryKey: [
      "search",
      "infinite",
      query,
      filters,
      pageSize,
      locale,
      searchDescriptions,
    ],
    queryFn: ({ pageParam = 1 }) => fetchSearchResults(params, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNextPage) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: true, // Always enabled, let the API handle empty queries
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Prevent multiple simultaneous fetches
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Flatten all pages into single array
  const allResults = useMemo(() => {
    if (!infiniteQuery.data?.pages) return [];
    return infiniteQuery.data.pages.flatMap((page) => page.results);
  }, [infiniteQuery.data?.pages]);

  // Get total count from first page
  const totalCount = useMemo(() => {
    return infiniteQuery.data?.pages[0]?.pagination.totalCount ?? 0;
  }, [infiniteQuery.data?.pages]);

  // Check if any page used fuzzy search
  const usedFuzzySearch = useMemo(() => {
    return (
      infiniteQuery.data?.pages.some((page) => page.usedFuzzySearch) ?? false
    );
  }, [infiniteQuery.data?.pages]);

  return {
    ...infiniteQuery,
    allResults,
    totalCount,
    usedFuzzySearch,
  };
}
