/**
 * Use Filter Counts Hook
 *
 * Custom hook for fetching filter counts/options.
 * Temporary implementation before React Query migration.
 *
 * Following clean-code principles:
 * - Single Responsibility: Only handles filter counts
 * - Caching: Implements simple caching to avoid redundant API calls
 * - Type Safe: Strict typing throughout
 */

"use client";

import { useCallback, useEffect, useState } from "react";

import type { AggregatedFilterOptions } from "../services/filter-aggregation.service";
import { FilterAggregationService } from "../services/filter-aggregation.service";
import type { FilterCounts } from "../services/gemstone-fetch.service";
import { GemstoneFetchService } from "../services/gemstone-fetch.service";

// ===== TYPES =====

export interface UseFilterCountsOptions {
  enabled?: boolean;
  cacheTime?: number; // Cache duration in milliseconds
  onSuccess?: (data: AggregatedFilterOptions) => void;
  onError?: (error: Error) => void;
}

export interface UseFilterCountsReturn {
  counts: FilterCounts | null;
  aggregated: AggregatedFilterOptions | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache
let cachedCounts: FilterCounts | null = null;
let cacheTimestamp: number | null = null;

// ===== HOOK =====

export function useFilterCounts(
  options: UseFilterCountsOptions = {}
): UseFilterCountsReturn {
  const {
    enabled = true,
    cacheTime = 10 * 60 * 1000, // 10 minutes default
    onSuccess,
    onError,
  } = options;

  const [counts, setCounts] = useState<FilterCounts | null>(null);
  const [aggregated, setAggregated] = useState<AggregatedFilterOptions | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFilterCounts = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const now = Date.now();
      if (cachedCounts && cacheTimestamp && now - cacheTimestamp < cacheTime) {
        setCounts(cachedCounts);
        const aggregatedOptions =
          FilterAggregationService.aggregateFilterOptions(cachedCounts);
        setAggregated(aggregatedOptions);

        if (onSuccess) {
          onSuccess(aggregatedOptions);
        }

        setLoading(false);
        return;
      }

      // Fetch fresh data
      const result = await GemstoneFetchService.fetchFilterCounts();

      // Update cache
      cachedCounts = result;
      cacheTimestamp = now;

      setCounts(result);

      // Aggregate options
      const aggregatedOptions =
        FilterAggregationService.aggregateFilterOptions(result);
      setAggregated(aggregatedOptions);

      if (onSuccess) {
        onSuccess(aggregatedOptions);
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch filter counts");
      setError(error);

      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, cacheTime, onSuccess, onError]);

  // Fetch on mount
  useEffect(() => {
    fetchFilterCounts();
  }, [fetchFilterCounts]);

  return {
    counts,
    aggregated,
    loading,
    error,
    refetch: fetchFilterCounts,
  };
}

// Export utility to clear cache
export function clearFilterCountsCache() {
  cachedCounts = null;
  cacheTimestamp = null;
}
