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

import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

// React Query hooks
import { useGemstoneQuery } from "../hooks/use-gemstone-query";
import { useFilterCountsQuery } from "../hooks/use-filter-counts-query";

// Filter state hooks
import { useFilterState } from "../hooks/use-filter-state";
import { useFilterUrlSync } from "../hooks/use-filter-url-sync";

// Controlled filter components
import { AdvancedFiltersControlled } from "./filters/advanced-filters-controlled";
import { AdvancedFiltersV2Controlled } from "./filters/advanced-filters-v2-controlled";

// Shared components from Phase 0
import { GemstoneGrid } from "./gemstone-grid";
import { PaginationControls } from "./pagination-controls";
import { CatalogHeader } from "./catalog-header";
import { EmptyState } from "./empty-state";
import { LoadingState } from "./loading-state";

// Types
import type { AdvancedGemstoneFilters } from "../types/filter.types";
import { queryStringToFilters } from "../utils/filter-url.utils";

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
  const {filters, setFilters } = useFilterState({ initialFilters });
  
  // URL synchronization (opt-in side effect)
  useFilterUrlSync(filters);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Filter UI toggle
  const [useVisualFilters, setUseVisualFilters] = useState(false);

  // React Query: Fetch gemstones
  const {
    data: gemstonesData,
    isLoading: gemstonesLoading,
    error: gemstonesError,
  } = useGemstoneQuery(filters, currentPage, PAGE_SIZE);

  // React Query: Fetch filter counts
  const {
    data: filterCountsData,
    isLoading: filterCountsLoading,
  } = useFilterCountsQuery();

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: AdvancedGemstoneFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  }, [setFilters]);

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
      <CatalogHeader 
        title={t("title")} 
        description={t("description")} 
      />

      {/* Filter Toggle */}
      <div className="flex items-center justify-center mb-6 px-4">
        <div className="inline-flex rounded-lg border border-border bg-muted p-1">
          <button
            onClick={() => setUseVisualFilters(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !useVisualFilters
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("standardFilters")}
          </button>
          <button
            onClick={() => setUseVisualFilters(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              useVisualFilters
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("visualFilters")}
          </button>
        </div>
      </div>

      {/* Controlled Filters */}
      {filterOptions && (
        useVisualFilters ? (
          <AdvancedFiltersV2Controlled
            filters={filters}
            onChange={handleFiltersChange}
            options={filterOptions}
            loading={filterCountsLoading || gemstonesLoading}
          />
        ) : (
          <AdvancedFiltersControlled
            filters={filters}
            onChange={handleFiltersChange}
            options={filterOptions}
            loading={filterCountsLoading || gemstonesLoading}
          />
        )
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

