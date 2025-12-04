/**
 * Use Admin Gemstone Query Hook
 *
 * React Query wrapper for fetching a single gemstone by ID.
 * Provides intelligent caching, background refetching, and loading states.
 *
 * Cache Strategy:
 * - 5 minutes stale time (individual gemstone data is stable)
 * - 10 minutes garbage collection time
 * - Only enabled when ID is provided
 */

"use client";

import { GemstoneAdminApiService } from "../services/gemstone-admin-api-service";
import type { GemstoneWithRelations } from "../services/gemstone-admin-service";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQuery } from "@tanstack/react-query";

export interface UseAdminGemstoneOptions {
  enabled?: boolean;
}

/**
 * Fetch a single gemstone by ID with React Query caching
 *
 * Benefits:
 * - Automatic caching (5 min stale time)
 * - Background refetching on reconnect
 * - Deduplication of identical requests
 * - Loading and error states
 * - DevTools integration
 * - Only fetches when ID is provided
 */
export function useAdminGemstone(
  id: string | null | undefined,
  options: UseAdminGemstoneOptions = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.admin.gemstones.detail(id!),
    queryFn: async () => {
      const result = await GemstoneAdminApiService.getGemstoneById(id!);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch gemstone");
      }
      return result.data as GemstoneWithRelations;
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes - individual gemstone data is stable
    gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 1, // Retry once on failure
  });
}
