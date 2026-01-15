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
 * Transform AdvancedGemstoneFilters to API-compatible format
 * FILTER-C4.1: Ensures all filter types are properly mapped to API
 */
function transformFiltersForApi(filters: AdvancedGemstoneFilters): Record<string, unknown> {
  const apiFilters: Record<string, unknown> = {};

  // Array filters (direct mapping)
  if (filters.gemstoneTypes?.length) apiFilters.gemstoneTypes = filters.gemstoneTypes;
  if (filters.colors?.length) apiFilters.colors = filters.colors;
  if (filters.cuts?.length) apiFilters.cuts = filters.cuts;
  if (filters.clarities?.length) apiFilters.clarities = filters.clarities;
  if (filters.origins?.length) apiFilters.origins = filters.origins;

  // Professional filters (direct mapping)
  if (filters.treatmentStatus?.length) apiFilters.treatmentStatus = filters.treatmentStatus;
  if (filters.miningCountries?.length) apiFilters.miningCountries = filters.miningCountries;
  if (filters.qualityClassifications?.length) apiFilters.qualityClassifications = filters.qualityClassifications;

  // Boolean filters
  if (filters.inStockOnly !== undefined) apiFilters.inStockOnly = filters.inStockOnly;
  if (filters.hasCertification !== undefined) apiFilters.hasCertification = filters.hasCertification;
  if (filters.hasImages !== undefined) apiFilters.hasImages = filters.hasImages;
  if (filters.hasAIAnalysis !== undefined) apiFilters.hasAIAnalysis = filters.hasAIAnalysis;
  if (filters.hasColorChange !== undefined) apiFilters.hasColorChange = filters.hasColorChange;

  // Range filters (flatten nested objects)
  if (filters.priceRange) {
    apiFilters.minPrice = filters.priceRange.min;
    apiFilters.maxPrice = filters.priceRange.max;
  }

  if (filters.weightRange) {
    apiFilters.minWeight = filters.weightRange.min;
    apiFilters.maxWeight = filters.weightRange.max;
  }

  // Dimension range (flatten nested object)
  if (filters.dimensionRange) {
    if (filters.dimensionRange.minLength !== undefined) apiFilters.minLength = filters.dimensionRange.minLength;
    if (filters.dimensionRange.maxLength !== undefined) apiFilters.maxLength = filters.dimensionRange.maxLength;
    if (filters.dimensionRange.minWidth !== undefined) apiFilters.minWidth = filters.dimensionRange.minWidth;
    if (filters.dimensionRange.maxWidth !== undefined) apiFilters.maxWidth = filters.dimensionRange.maxWidth;
  }

  // Price per carat range (flatten nested object)
  if (filters.pricePerCaratRange) {
    apiFilters.minPricePerCarat = filters.pricePerCaratRange.min;
    apiFilters.maxPricePerCarat = filters.pricePerCaratRange.max;
  }

  return apiFilters;
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

  // Transform filters to API-compatible format
  const apiFilters = transformFiltersForApi(filters);

  const response = await fetch("/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      page,
      pageSize,
      filters: apiFilters,
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
