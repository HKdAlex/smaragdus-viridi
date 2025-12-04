/**
 * Use Admin Gemstones Query Hook
 *
 * React Query wrapper for fetching paginated admin gemstone list.
 * Provides intelligent caching, background refetching, and loading states.
 *
 * Cache Strategy:
 * - 1 minute stale time (admin list changes frequently)
 * - 5 minutes garbage collection time
 * - keepPreviousData for smooth pagination/filtering transitions
 */

"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import type { SearchFilters } from "../components/enhanced-search";
import type { GemstoneWithRelations } from "../services/gemstone-admin-service";

export interface PaginatedGemstonesResponse {
  gemstones: GemstoneWithRelations[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  error?: string;
}

/**
 * Fetch admin gemstones from API
 */
async function fetchAdminGemstones(
  filters: SearchFilters,
  page: number,
  pageSize: number
): Promise<PaginatedGemstonesResponse> {
  // Build query parameters
  const params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("pageSize", pageSize.toString());
  params.set("sortBy", filters.sortBy);
  params.set("sortDirection", filters.sortOrder);

  if (filters.query) {
    params.set("search", filters.query);
  }
  if (filters.types.length > 0) {
    params.set("types", filters.types.join(","));
  }
  if (filters.colors.length > 0) {
    params.set("colors", filters.colors.join(","));
  }
  if (filters.cuts.length > 0) {
    params.set("cuts", filters.cuts.join(","));
  }
  if (filters.clarities.length > 0) {
    params.set("clarities", filters.clarities.join(","));
  }
  if (filters.origins.length > 0) {
    params.set("origins", filters.origins.join(","));
  }
  if (filters.priceMin !== undefined) {
    params.set("priceMin", filters.priceMin.toString());
  }
  if (filters.priceMax !== undefined) {
    params.set("priceMax", filters.priceMax.toString());
  }
  if (filters.weightMin !== undefined) {
    params.set("weightMin", filters.weightMin.toString());
  }
  if (filters.weightMax !== undefined) {
    params.set("weightMax", filters.weightMax.toString());
  }
  if (filters.inStock !== undefined) {
    params.set("inStock", filters.inStock.toString());
  }
  if (filters.withoutMedia) {
    params.set("withoutMedia", "true");
  }
  if (filters.withoutPrice) {
    params.set("withoutPrice", "true");
  }

  const response = await fetch(`/api/admin/gemstones?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch gemstones");
  }

  return response.json();
}

export interface UseAdminGemstonesOptions {
  enabled?: boolean;
}

/**
 * Fetch admin gemstones with React Query caching
 *
 * Benefits:
 * - Automatic caching (1 min stale time)
 * - Background refetching on reconnect
 * - Deduplication of identical requests
 * - Loading and error states
 * - keepPreviousData for smooth transitions
 * - DevTools integration
 */
export function useAdminGemstones(
  filters: SearchFilters,
  page: number,
  pageSize: number,
  options: UseAdminGemstonesOptions = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.admin.gemstones.list(filters, page, pageSize),
    queryFn: () => fetchAdminGemstones(filters, page, pageSize),
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute - admin list changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes - cache garbage collection
    refetchOnWindowFocus: false, // Don't refetch on window focus (can be expensive)
    retry: 1, // Retry once on failure
    placeholderData: keepPreviousData, // Keep previous data while fetching new
  });
}

