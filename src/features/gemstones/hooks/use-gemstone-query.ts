/**
 * Use Gemstone Query Hook
 * 
 * React Query wrapper for fetching gemstones with filters and pagination.
 * Provides intelligent caching, background refetching, and loading states.
 * 
 * Replaces the custom use-gemstone-fetch hook with React Query's powerful features.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { GemstoneFetchService } from '../services/gemstone-fetch.service';
import type { AdvancedGemstoneFilters } from '../types/filter.types';

export interface UseGemstoneQueryOptions {
  enabled?: boolean; // Allow conditional fetching
}

/**
 * Fetch gemstones with React Query caching
 * 
 * Benefits over custom hook:
 * - Automatic caching (5 min stale time)
 * - Background refetching
 * - Deduplication of identical requests
 * - Loading and error states
 * - Devtools integration
 */
export function useGemstoneQuery(
  filters: AdvancedGemstoneFilters,
  page: number,
  pageSize: number = 24,
  options: UseGemstoneQueryOptions = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.gemstones.list(filters, page, pageSize),
    queryFn: () => GemstoneFetchService.fetchGemstones({ filters, page, pageSize }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection
  });
}

