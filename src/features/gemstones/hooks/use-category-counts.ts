/**
 * Use Category Counts Hook
 *
 * Fetches gemstone counts by category for the category tabs.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface CategoryCount {
  name: string;
  count: number;
}

export interface CategoryCountsResponse {
  categories: CategoryCount[];
}

/**
 * Fetch gemstone counts by category
 */
async function fetchCategoryCounts(): Promise<CategoryCountsResponse> {
  const { data, error } = await supabase
    .from("gemstones")
    .select("name")
    .eq("in_stock", true)
    .gt("price_amount", 0);

  if (error) {
    throw new Error(`Failed to fetch category counts: ${error.message}`);
  }

  // Count gemstones by name
  const counts = data.reduce((acc, gemstone) => {
    const name = gemstone.name;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Convert to array and sort by count
  const categories = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { categories };
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
