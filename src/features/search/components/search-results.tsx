/**
 * Search Results Component
 *
 * Displays paginated search results with filters.
 */

"use client";

import { useEffect, useMemo, useState } from "react";

import { AdvancedFiltersControlled } from "@/features/gemstones/components/filters/advanced-filters-controlled";
import { EmptyState } from "@/features/gemstones/components/empty-state";
import { FuzzySearchBanner } from "./fuzzy-search-banner";
import { GemstoneGrid } from "@/features/gemstones/components/gemstone-grid";
import { LoadingState } from "@/features/gemstones/components/loading-state";
import { PaginationControls } from "@/features/gemstones/components/pagination-controls";
import { SearchInput } from "./search-input";
import { SearchService } from "../services/search.service";
import { useFilterCountsQuery } from "@/features/gemstones/hooks/use-filter-counts-query";
import { useFilterState } from "@/features/gemstones/hooks/use-filter-state";
import { useSearchParams } from "next/navigation";
import { useSearchQuery } from "@/features/search/hooks/use-search-query";
import { useTranslations } from "next-intl";
import { useTypeSafeRouter } from "@/lib/navigation/type-safe-router";

const PAGE_SIZE = 24;

export function SearchResults() {
  const t = useTranslations("search");
  const tCatalog = useTranslations("catalog");
  const searchParams = useSearchParams();
  const router = useTypeSafeRouter();

  // Get search query from URL
  const query = searchParams.get("q") || "";

  // Filter state
  const { filters, updateFilters, resetFilters, filterCount } =
    useFilterState();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Fuzzy suggestions state
  const [fuzzySuggestions, setFuzzySuggestions] = useState<
    Array<{ suggestion: string; score: number; type: string }>
  >([]);

  // Fetch search results
  const { data, isLoading, error } = useSearchQuery({
    query,
    filters,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  // Fetch filter counts
  const { data: filterCountsData } = useFilterCountsQuery();

  // Fetch fuzzy suggestions when no results are found
  useEffect(() => {
    const fetchFuzzySuggestions = async () => {
      if (query && data && data.results.length === 0 && !isLoading) {
        try {
          const suggestions = await SearchService.getFuzzySuggestions(query, 5);
          setFuzzySuggestions(suggestions);
        } catch (error) {
          console.error("Failed to fetch fuzzy suggestions:", error);
          setFuzzySuggestions([]);
        }
      } else {
        setFuzzySuggestions([]);
      }
    };

    fetchFuzzySuggestions();
  }, [query, data, isLoading]);

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

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    router.pushDynamic(`/search?q=${encodeURIComponent(suggestion)}`);
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

      {/* Fuzzy Search Banner */}
      {data?.usedFuzzySearch && results.length > 0 && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <span className="font-medium">
              {t("fuzzySearch.approximateMatches")}
            </span>{" "}
            {t("fuzzySearch.noExactMatch")}
          </p>
        </div>
      )}

      {/* Did You Mean Banner */}
      {fuzzySuggestions.length > 0 && results.length === 0 && (
        <FuzzySearchBanner
          originalQuery={query}
          suggestions={fuzzySuggestions}
          onSuggestionClick={handleSuggestionClick}
        />
      )}

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
