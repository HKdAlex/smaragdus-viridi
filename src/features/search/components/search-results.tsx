/**
 * Search Results Component
 *
 * Displays paginated search results with filters.
 */

"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/features/gemstones/components/empty-state";
import { AdvancedFiltersControlled } from "@/features/gemstones/components/filters/advanced-filters-controlled";
import { GemstoneGrid } from "@/features/gemstones/components/gemstone-grid";
import { LoadingState } from "@/features/gemstones/components/loading-state";
import { PaginationControls } from "@/features/gemstones/components/pagination-controls";
import { useFilterCountsQuery } from "@/features/gemstones/hooks/use-filter-counts-query";
import { useFilterState } from "@/features/gemstones/hooks/use-filter-state";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useSearchQuery } from "../hooks/use-search-query";
import { SearchInput } from "./search-input";

const PAGE_SIZE = 24;

export function SearchResults() {
  const t = useTranslations("search");
  const tCatalog = useTranslations("catalog");
  const searchParams = useSearchParams();

  // Get search query from URL
  const query = searchParams.get("q") || "";

  // Filter state
  const { filters, updateFilters, resetFilters, filterCount } =
    useFilterState();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch search results
  const { data, isLoading, error } = useSearchQuery({
    query,
    filters,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  // Fetch filter counts
  const { data: filterCountsData } = useFilterCountsQuery();

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (!data?.pagination.totalCount) return 0;
    return Math.ceil(data.pagination.totalCount / PAGE_SIZE);
  }, [data]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle filter change
  const handleFiltersChange = (newFilters: typeof filters) => {
    updateFilters(newFilters);
    setCurrentPage(1); // Reset to first page
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <SearchInput defaultValue={query} className="max-w-2xl mx-auto" />
        </div>
        <LoadingState count={PAGE_SIZE} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <div className="mb-8">
          <SearchInput defaultValue={query} className="max-w-2xl mx-auto" />
        </div>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">
            {t("error")}:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  const results = data?.results || [];
  const totalCount = data?.pagination.totalCount || 0;

  return (
    <div>
      {/* Search Input */}
      <div className="mb-8">
        <SearchInput defaultValue={query} className="max-w-2xl mx-auto" />
      </div>

      {/* Results Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {query ? (
            <>
              {t("resultsFor")} "{query}"
            </>
          ) : (
            t("searchResults")
          )}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {totalCount} {tCatalog("gemstonesFound")}
        </p>
      </div>

      {/* Filters */}
      {filterCountsData && (
        <div className="mb-6">
          <AdvancedFiltersControlled
            filters={filters}
            onChange={handleFiltersChange}
            options={filterCountsData.aggregated}
          />
        </div>
      )}

      {/* Results */}
      {results.length === 0 ? (
        <EmptyState
          title={query ? t("noResults") : t("enterSearch")}
          message={query ? t("tryDifferent") : t("searchPrompt")}
        />
      ) : (
        <>
          <GemstoneGrid gemstones={results as any} />

          {/* Pagination */}
          {totalPages > 1 && data?.pagination && (
            <div className="mt-8">
              <PaginationControls
                pagination={{
                  page: data.pagination.page,
                  pageSize: data.pagination.pageSize,
                  totalItems: data.pagination.totalCount,
                  totalPages: data.pagination.totalPages,
                  hasNextPage: data.pagination.hasNextPage,
                  hasPrevPage: data.pagination.hasPrevPage,
                }}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
