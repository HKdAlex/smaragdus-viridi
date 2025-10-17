/**
 * Gemstone Catalog (Refactored - Phase 1)
 *
 * Clean catalog implementation using:
 * - React Query for server state (gemstones, filter counts)
 * - Simplified filter state hooks (use-filter-state, use-filter-url-sync)
 * - Controlled filter components (zero internal state)
 *
 * Reduced from 708 LOC to ~250 LOC by:
 * - Using React Query (replaces custom caching)
 * - Using controlled filters (removes state duplication)
 * - Using Phase 0 shared components (GemstoneGrid, PaginationControls, etc.)
 * - Clear separation of concerns
 */

"use client";

import type {
  AdvancedGemstoneFilters,
  FilterOptions,
} from "../types/filter.types";
// Types
import { useCallback, useMemo, useRef } from "react";

import { CatalogHeader } from "./catalog-header";
import { CategoryTabs } from "./category-tabs";
import { EmptyState } from "./empty-state";
import { FilterSidebar } from "./filters/filter-sidebar";
import { GemstoneGrid } from "./gemstone-grid";
import { InfiniteScrollTrigger } from "./infinite-scroll-trigger";
import { LoadingState } from "./loading-state";
// Filter sidebar component
import { queryStringToFilters } from "../utils/filter-url.utils";
// Shared components from Phase 0
import { useCategoryCounts } from "../hooks/use-category-counts";
import { useFilterCountsQuery } from "../hooks/use-filter-counts-query";
import { useFilterState } from "../hooks/use-filter-state";
import { useFilterUrlSync } from "../hooks/use-filter-url-sync";
import { useInfiniteGemstoneQuery } from "../hooks/use-infinite-gemstone-query";
// React Query hooks
import { useSearchParams } from "next/navigation";
// Filter state hooks
import { useTranslations } from "next-intl";

const PAGE_SIZE = 24;

export function GemstoneCatalogOptimized() {
  const t = useTranslations("catalog");
  const searchParams = useSearchParams();

  // Ref to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);

  // Get active category from URL
  const activeCategory = searchParams.get("category") || "all";

  // Parse initial filters from URL
  const initialFilters = useMemo(() => {
    const queryString = searchParams.toString();
    const filters = queryString ? queryStringToFilters(queryString) : {};
    
    // Add category filter if specified
    if (activeCategory !== "all") {
      return {
        ...filters,
        gemstoneTypes: [activeCategory as any], // Cast to satisfy TypeScript enum
      };
    }
    
    return filters;
  }, [searchParams, activeCategory]);

  // Local filter state (single source of truth)
  const { filters, setFilters } = useFilterState({ initialFilters });

  // URL synchronization (opt-in side effect)
  useFilterUrlSync(filters);

  // Fetch category counts for tabs
  const { data: categoryData } = useCategoryCounts();

  // React Query: Fetch gemstones with infinite scroll
  const {
    allGemstones,
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: gemstonesLoading,
    error: gemstonesError,
  } = useInfiniteGemstoneQuery(filters, PAGE_SIZE);

  // React Query: Fetch filter counts
  const { data: filterCountsData, isLoading: filterCountsLoading } =
    useFilterCountsQuery();

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: AdvancedGemstoneFilters) => {
      setFilters(newFilters);
      // Infinite query automatically resets when filters change
    },
    [setFilters]
  );

  // Handle load more (with ref-based lock to prevent rapid calls)
  const handleLoadMore = useCallback(() => {
    // Use ref to prevent multiple simultaneous fetches
    if (hasNextPage && !isFetchingNextPage && !isFetchingRef.current) {
      isFetchingRef.current = true;
      fetchNextPage().finally(() => {
        // Reset the lock after fetch completes (success or error)
        isFetchingRef.current = false;
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Prepare category tabs data
  const categoryTabs = useMemo(() => {
    if (!categoryData?.categories) return [];
    
    return categoryData.categories
      .filter(cat => cat.count > 0) // Only show categories with items
      .map(cat => ({
        id: cat.name,
        name: t(`gemstoneTypes.${cat.name}`) || cat.name,
        count: cat.count,
        href: `/catalog/${cat.name}`,
      }));
  }, [categoryData, t]);

  // Show loading state on initial load
  if (gemstonesLoading && allGemstones.length === 0) {
    return <LoadingState showHeader={true} />;
  }

  // Show error state
  if (gemstonesError) {
    return (
      <EmptyState
        title="Error Loading Gemstones"
        message="Please try refreshing the page or adjusting your filters."
      />
    );
  }

  const aggregatedOptions = filterCountsData?.aggregated;

  // Convert AggregatedFilterOptions to FilterOptions for FilterSidebar
  const filterOptions: FilterOptions | undefined = aggregatedOptions
    ? {
        gemstoneTypes: aggregatedOptions.gemstoneTypes.map((opt) => ({
          value: opt.value,
          label: opt.label,
          count: opt.count,
        })),
        colors: aggregatedOptions.colors.map((opt) => ({
          value: opt.value,
          label: opt.label,
          count: opt.count,
          category: opt.category,
        })),
        cuts: aggregatedOptions.cuts.map((opt) => ({
          value: opt.value,
          label: opt.label,
          count: opt.count,
        })),
        clarities: aggregatedOptions.clarities.map((opt) => ({
          value: opt.value,
          label: opt.label,
          count: opt.count,
          order: opt.order,
        })),
        origins: aggregatedOptions.origins.map((opt) => ({
          value: opt.value,
          label: opt.label,
          country: opt.country,
          count: opt.count,
        })),
        priceRange: aggregatedOptions.priceRange,
        weightRange: aggregatedOptions.weightRange,
      }
    : undefined;

  return (
    <div className="">
      {/* Header */}
      <CatalogHeader title={t("title")} description={t("description")} />

      {/* Category Tabs */}
      <div className="px-4 mt-6">
        <CategoryTabs
          categories={categoryTabs}
          activeCategory={activeCategory}
        />
      </div>

      {/* Filter Sidebar */}
      {filterOptions && (
        <FilterSidebar
          filters={filters}
          onChange={handleFiltersChange}
          options={filterOptions}
          loading={filterCountsLoading || gemstonesLoading}
          defaultOpen={true}
        />
      )}

      {/* Results Section */}
      <div className="px-4">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            {totalCount} {t("gemstonesFound")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("showing")} {allGemstones.length} {t("of")} {totalCount}
          </p>
        </div>

        {/* Gemstones Grid or Empty State */}
        {allGemstones.length === 0 ? (
          <EmptyState
            title={t("noGemstonesFound")}
            message={t("adjustFiltersMessage")}
          />
        ) : (
          <>
            <GemstoneGrid
              gemstones={allGemstones}
              loading={gemstonesLoading}
              variant="catalog"
            />

            {/* Infinite Scroll Trigger */}
            <InfiniteScrollTrigger
              onIntersect={handleLoadMore}
              isFetching={isFetchingNextPage}
              hasMore={hasNextPage ?? false}
            />
          </>
        )}
      </div>
    </div>
  );
}
