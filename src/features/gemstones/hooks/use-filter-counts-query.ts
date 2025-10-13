/**
 * Use Filter Counts Query Hook
 * 
 * React Query wrapper for fetching filter counts/options.
 * Provides long-lived caching since filter options change infrequently.
 * 
 * Replaces the custom use-filter-counts hook with React Query.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { GemstoneFetchService } from '../services/gemstone-fetch.service';
import { FilterAggregationService } from '../services/filter-aggregation.service';

export interface UseFilterCountsQueryOptions {
  enabled?: boolean;
}

/**
 * Fetch filter counts with React Query caching
 * 
 * Benefits:
 * - Long cache (10 min stale, 30 min GC) since options change rarely
 * - Automatic aggregation of raw counts
 * - Shared cache across all components
 * - Background refetching on reconnect
 */
export function useFilterCountsQuery(
  options: UseFilterCountsQueryOptions = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.filters.counts(),
    queryFn: async () => {
      const counts = await GemstoneFetchService.fetchFilterCounts();
      // Aggregate raw counts into structured options
      const aggregated = FilterAggregationService.aggregateFilterOptions(counts);
      return { counts, aggregated };
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - filter options change infrequently
    gcTime: 30 * 60 * 1000, // 30 minutes - keep cached longer
  });
}

