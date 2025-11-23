/**
 * Use Dashboard Stats Hook
 *
 * React Query wrapper for fetching admin dashboard statistics.
 * Provides intelligent caching, background refetching, and loading states.
 *
 * Cache Strategy:
 * - 2 minutes stale time (stats don't change frequently)
 * - 5 minutes garbage collection time
 * - Automatic refetch on window focus disabled (expensive query)
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { StatisticsService } from "../services/statistics-service";
import type { DashboardStatsWithChanges } from "../services/statistics-service";

export interface UseDashboardStatsOptions {
  enabled?: boolean; // Allow conditional fetching
}

/**
 * Fetch dashboard statistics with React Query caching
 *
 * Benefits:
 * - Automatic caching (2 min stale time)
 * - Background refetching on reconnect
 * - Deduplication of identical requests
 * - Loading and error states
 * - Devtools integration
 */
export function useDashboardStats(
  options: UseDashboardStatsOptions = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.admin.dashboard.stats(),
    queryFn: async () => {
      const result = await StatisticsService.getDashboardStats();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - stats don't change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes - cache garbage collection
    refetchOnWindowFocus: false, // Don't refetch on window focus (expensive query)
    retry: 1, // Retry once on failure
  });
}

