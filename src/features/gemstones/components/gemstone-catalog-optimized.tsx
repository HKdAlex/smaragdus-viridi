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

import { useCallback, useMemo, useState } from "react";

// Types
import type { AdvancedGemstoneFilters } from "../types/filter.types";
import { CatalogHeader } from "./catalog-header";
import { EmptyState } from "./empty-state";
// Filter sidebar component
import { FilterSidebar } from "./filters/filter-sidebar";
import { GemstoneGrid } from "./gemstone-grid";
import { LoadingState } from "./loading-state";
import { PaginationControls } from "./pagination-controls";
// Shared components from Phase 0
import { queryStringToFilters } from "../utils/filter-url.utils";
import { useFilterCountsQuery } from "../hooks/use-filter-counts-query";
import { useFilterState } from "../hooks/use-filter-state";
import { useFilterUrlSync } from "../hooks/use-filter-url-sync";
import { useGemstoneQuery } from "../hooks/use-gemstone-query";
// React Query hooks
import { useSearchParams } from "next/navigation";
// Filter state hooks
import { useTranslations } from "next-intl";

const PAGE_SIZE = 24;

export function GemstoneCatalogOptimized() {
  const t = useTranslations("catalog");
  const searchParams = useSearchParams();

  // Parse initial filters from URL
  const initialFilters = useMemo(() => {
    const queryString = searchParams.toString();
    return queryString ? queryStringToFilters(queryString) : {};
  }, [searchParams]);

  // Local filter state (single source of truth)
  const { filters, setFilters } = useFilterState({ initialFilters });

  // URL synchronization (opt-in side effect)
  useFilterUrlSync(filters);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // React Query: Fetch gemstones
  const {
    data: gemstonesData,
    isLoading: gemstonesLoading,
    error: gemstonesError,
  } = useGemstoneQuery(filters, currentPage, PAGE_SIZE);

  // React Query: Fetch filter counts
  const { data: filterCountsData, isLoading: filterCountsLoading } =
    useFilterCountsQuery();

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: AdvancedGemstoneFilters) => {
      setFilters(newFilters);
      setCurrentPage(1); // Reset to first page on filter change
    },
    [setFilters]
  );

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Show loading state on initial load
  if (gemstonesLoading && !gemstonesData) {
    return <LoadingState />;
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

  const gemstones = gemstonesData?.data || [];
  const pagination = gemstonesData?.pagination;
  const filterOptions = filterCountsData?.aggregated;

  return (
    <div className="space-y-8">
      {/* Header */}
      <CatalogHeader title={t("title")} description={t("description")} />

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
        {pagination && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              {pagination.totalItems} {t("gemstonesFound")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("page")} {pagination.page} {t("of")} {pagination.totalPages}
            </p>
          </div>
        )}

        {/* Gemstones Grid or Empty State */}
        {gemstones.length === 0 ? (
          <EmptyState
            title={t("noGemstonesFound")}
            message={t("adjustFiltersMessage")}
          />
        ) : (
          <>
            <GemstoneGrid
              gemstones={gemstones}
              loading={gemstonesLoading}
              variant="catalog"
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <PaginationControls
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={gemstonesLoading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
