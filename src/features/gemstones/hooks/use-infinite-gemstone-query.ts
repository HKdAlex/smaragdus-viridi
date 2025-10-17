/**
 * Use Infinite Gemstone Query Hook
 *
 * React Query infinite query wrapper for catalog with automatic pagination.
 * Fetches pages of gemstones as user scrolls, with intelligent caching.
 */

"use client";

import type {
  CatalogGemstone,
  PaginationMeta,
} from "../services/gemstone-fetch.service";

import type { AdvancedGemstoneFilters } from "../types/filter.types";
import { GemstoneFetchService } from "../services/gemstone-fetch.service";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export interface UseInfiniteGemstoneQueryOptions {
  enabled?: boolean;
}

export interface InfiniteGemstoneResponse {
  data: CatalogGemstone[];
  pagination: PaginationMeta;
}

/**
 * Fetch gemstones with infinite scroll support
 *
 * Features:
 * - Automatic page fetching as user scrolls
 * - Intelligent caching (5 min stale time)
 * - Flattened array of all loaded gemstones
 * - Total count tracking
 *
 * @param filters - Advanced filters to apply
 * @param pageSize - Items per page (default: 24)
 * @param options - Query options (enabled, etc.)
 */
export function useInfiniteGemstoneQuery(
  filters: AdvancedGemstoneFilters,
  pageSize: number = 24,
  options: UseInfiniteGemstoneQueryOptions = {}
) {
  const { enabled = true } = options;

  const query = useInfiniteQuery({
    queryKey: queryKeys.gemstones.infinite(filters, pageSize),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await GemstoneFetchService.fetchGemstones({
        filters,
        page: pageParam,
        pageSize,
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNextPage) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Prevent multiple simultaneous fetches
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Flatten all pages into single array
  const allGemstones = useMemo(() => {
    if (!query.data?.pages) return [];
    return query.data.pages.flatMap((page) => page.data);
  }, [query.data?.pages]);

  // Get total count from first page
  const totalCount = useMemo(() => {
    return query.data?.pages[0]?.pagination.totalItems ?? 0;
  }, [query.data?.pages]);

  return {
    ...query,
    allGemstones,
    totalCount,
  };
}
