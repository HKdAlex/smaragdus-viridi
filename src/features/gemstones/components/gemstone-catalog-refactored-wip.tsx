/**
 * Gemstone Catalog (Refactored)
 *
 * Main catalog view using extracted services and components.
 * Reduced from 709 LOC to ~150 LOC by following SRP and DRY principles.
 *
 * Responsibilities:
 * - Orchestrate filter state
 * - Handle user interactions
 * - Compose UI from shared components
 */

"use client";

import { useCallback, useState } from "react";

import { AdvancedFilters } from "./filters/advanced-filters";
import { AdvancedFiltersV2 } from "./filters/advanced-filters-v2";
import type { AdvancedGemstoneFilters } from "../types/filter.types";
import { CatalogHeader } from "./catalog-header";
import { EmptyState } from "./empty-state";
import { GemstoneGrid } from "./gemstone-grid";
import { PaginationControls } from "./pagination-controls";
import { useFilterCounts } from "../hooks/use-filter-counts";
import { useGemstoneFetch } from "../hooks/use-gemstone-fetch";
import { useTranslations } from "next-intl";

// ===== COMPONENT =====

export function GemstoneCatalogOptimized() {
  const t = useTranslations("catalog");

  // State
  const [filters, setFilters] = useState<AdvancedGemstoneFilters>({});
  const [useVisualFilters, setUseVisualFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  // Fetch gemstones using shared hook
  const { gemstones, loading, pagination } = useGemstoneFetch(
    filters,
    currentPage,
    pageSize
  );

  // Fetch filter counts using shared hook
  const { aggregated: filterOptions } = useFilterCounts();

  // Handlers
  const handleFiltersChange = useCallback(
    (newFilters: AdvancedGemstoneFilters) => {
      setFilters(newFilters);
      setCurrentPage(1); // Reset to first page
    },
    []
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Loading state
  if (loading && !gemstones.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading gemstones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <CatalogHeader title={t("title")} description={t("description")} />

      {/* Filter Toggle */}
      <div className="flex items-center justify-center mb-6 px-4">
        <div className="inline-flex rounded-lg border border-border bg-muted p-1">
          <button
            onClick={() => setUseVisualFilters(false)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] whitespace-nowrap ${
              !useVisualFilters
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("standardFilters")}
          </button>
          <button
            onClick={() => setUseVisualFilters(true)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] whitespace-nowrap ${
              useVisualFilters
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("visualFilters")}
          </button>
        </div>
      </div>

      {/* Filters */}
      {filterOptions && (
        <>
          {useVisualFilters ? (
            <AdvancedFiltersV2
              onFiltersChange={handleFiltersChange}
              options={{
                gemstoneTypes: filterOptions.gemstoneTypes,
                colors: filterOptions.colors,
                cuts: filterOptions.cuts,
                clarities: filterOptions.clarities,
                origins: filterOptions.origins,
                priceRange: {
                  min: 0,
                  max: 5000000,
                  currency: "USD",
                },
                weightRange: {
                  min: 0,
                  max: 20,
                },
              }}
            />
          ) : (
            <AdvancedFilters
              onFiltersChange={handleFiltersChange}
              options={{
                gemstoneTypes: filterOptions.gemstoneTypes,
                colors: filterOptions.colors,
                cuts: filterOptions.cuts,
                clarities: filterOptions.clarities,
                origins: filterOptions.origins,
              }}
            />
          )}
        </>
      )}

      {/* Results */}
      <div className="px-4">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            {pagination
              ? t("showingResults", {
                  current: gemstones.length,
                  total: pagination.totalItems,
                })
              : t("loading")}
          </h2>
        </div>

        {/* Grid or Empty State */}
        {gemstones.length === 0 ? (
          <EmptyState
            title={t("noGemstonesFound")}
            message={t("adjustFiltersMessage")}
          />
        ) : (
          <>
            <GemstoneGrid
              gemstones={gemstones}
              loading={loading}
              variant="catalog"
            />
            {pagination && (
              <PaginationControls
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={loading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
