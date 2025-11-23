/**
 * Use Category Counts Hook
 *
 * Fetches gemstone counts by category for the category tabs.
 * Uses the same filtering logic as the catalog (price > 0 and has images).
 */

"use client";

import { useQuery } from "@tanstack/react-query";

export interface CategoryCount {
  name: string;
  count: number;
}

export interface CategoryCountsResponse {
  categories: CategoryCount[];
  totalCount: number;
}

/**
 * Fetch gemstone counts by category from API endpoint
 * This uses server-side counting to avoid Supabase max_rows limit
 */
async function fetchCategoryCounts(): Promise<CategoryCountsResponse> {
  const response = await fetch("/api/catalog/category-counts");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error || `Failed to fetch category counts: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Hook to fetch gemstone category counts
 */
export function useCategoryCounts() {
  return useQuery({
    queryKey: ["gemstones", "category-counts"],
    queryFn: fetchCategoryCounts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
