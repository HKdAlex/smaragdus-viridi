/**
 * Use Gemstone Fetch Hook
 *
 * Custom hook for fetching gemstones with filters and pagination.
 * Temporary implementation before React Query migration.
 * Consolidates fetch logic from catalog, admin, and related components.
 *
 * Following clean-code principles:
 * - Single Responsibility: Only handles gemstone fetching
 * - Reusable: Works across all gemstone list views
 * - Type Safe: Strict typing throughout
 */

"use client";

import type {
  CatalogGemstone,
  FetchGemstonesParams,
  PaginationMeta,
} from "../services/gemstone-fetch.service";
import { useCallback, useEffect, useState } from "react";

import type { AdvancedGemstoneFilters } from "../types/filter.types";
import { GemstoneFetchService } from "../services/gemstone-fetch.service";

// ===== TYPES =====

export interface UseGemstoneFetchOptions {
  enabled?: boolean; // Allow conditional fetching
  onSuccess?: (data: CatalogGemstone[]) => void;
  onError?: (error: Error) => void;
}

export interface UseGemstoneFetchReturn {
  gemstones: CatalogGemstone[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationMeta | null;
  refetch: () => Promise<void>;
}

// ===== HOOK =====

export function useGemstoneFetch(
  filters: AdvancedGemstoneFilters,
  page: number,
  pageSize: number = 24,
  options: UseGemstoneFetchOptions = {}
): UseGemstoneFetchReturn {
  const { enabled = true, onSuccess, onError } = options;

  const [gemstones, setGemstones] = useState<CatalogGemstone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const fetchGemstones = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params: FetchGemstonesParams = {
        filters,
        page,
        pageSize,
      };

      const result = await GemstoneFetchService.fetchGemstones(params);

      setGemstones(result.data);
      setPagination(result.pagination);

      if (onSuccess) {
        onSuccess(result.data);
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch gemstones");
      setError(error);

      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, enabled, onSuccess, onError]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchGemstones();
  }, [fetchGemstones]);

  return {
    gemstones,
    loading,
    error,
    pagination,
    refetch: fetchGemstones,
  };
}
