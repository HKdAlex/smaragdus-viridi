/**
 * Search Results Component
 *
 * Displays paginated search results with filters.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import type { CatalogGemstone } from "@/features/gemstones/services/gemstone-fetch.service";
import { DescriptionSearchToggle } from "./description-search-toggle";
import { EmptyState } from "@/features/gemstones/components/empty-state";
import { FilterSidebar } from "@/features/gemstones/components/filters/filter-sidebar";
import { FuzzySearchBanner } from "./fuzzy-search-banner";
import { GemstoneGrid } from "@/features/gemstones/components/gemstone-grid";
import { LoadingState } from "@/features/gemstones/components/loading-state";
import { PaginationControls } from "@/features/gemstones/components/pagination-controls";
import { SearchInput } from "./search-input";
import { TranslationService } from "@/features/translations/services/translation.service";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useFilterCountsQuery } from "@/features/gemstones/hooks/use-filter-counts-query";
import { useFilterState } from "@/features/gemstones/hooks/use-filter-state";
import { useFilterUrlSync } from "@/features/gemstones/hooks/use-filter-url-sync";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useSearchQuery } from "@/features/search/hooks/use-search-query";
import { useTypeSafeRouter } from "@/lib/navigation/type-safe-router";

const PAGE_SIZE = 24;

export function SearchResults() {
  const t = useTranslations("search");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useTypeSafeRouter();

  // Get search query from URL
  const query = searchParams.get("q") || "";

  // Filter state
  const { filters, updateFilters, resetFilters, filterCount } =
    useFilterState();

  // URL synchronization (opt-in side effect)
  useFilterUrlSync(filters);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Fuzzy suggestions state
  const [fuzzySuggestions, setFuzzySuggestions] = useState<
    Array<{ suggestion: string; score: number; type: string }>
  >([]);

  // Fetch search results
  const [searchDescriptions, setSearchDescriptions] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("search:descriptions");
    if (stored !== null) {
      setSearchDescriptions(stored === "true");
    }
  }, []);

  const { data, isLoading, error } = useSearchQuery({
    query,
    filters,
    page: currentPage,
    pageSize: PAGE_SIZE,
    locale,
    searchDescriptions,
  });

  const { data: typeTranslations } = useQuery({
    queryKey: queryKeys.translations.list(locale, "type"),
    queryFn: () => TranslationService.getGemstoneTypes(locale),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const { data: colorTranslations } = useQuery({
    queryKey: queryKeys.translations.list(locale, "color"),
    queryFn: () => TranslationService.getGemColors(locale),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const { data: cutTranslations } = useQuery({
    queryKey: queryKeys.translations.list(locale, "cut"),
    queryFn: () => TranslationService.getGemCuts(locale),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const { data: clarityTranslations } = useQuery({
    queryKey: queryKeys.translations.list(locale, "clarity"),
    queryFn: () => TranslationService.getGemClarities(locale),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const results = data?.results ?? [];
  const decoratedResults = useMemo<CatalogGemstone[]>(() => {
    return results.map((gemstone) => {
      const baseGemstone = gemstone as CatalogGemstone;
      const baseTypeCode = baseGemstone.type_code ?? baseGemstone.name ?? "";
      const baseColorCode = baseGemstone.color_code ?? baseGemstone.color ?? "";
      const baseCutCode = baseGemstone.cut_code ?? baseGemstone.cut ?? "";
      const baseClarityCode =
        baseGemstone.clarity_code ?? baseGemstone.clarity ?? "";

      const displayName =
        (baseTypeCode && typeTranslations?.get(baseTypeCode)?.name) ??
        typeTranslations?.get(baseGemstone.name)?.name ??
        baseGemstone.name;

      const displayColor =
        (baseColorCode && colorTranslations?.get(baseColorCode)?.name) ??
        colorTranslations?.get(baseGemstone.color)?.name ??
        baseGemstone.color;

      const displayCut =
        typeof baseGemstone.cut === "string"
          ? (baseCutCode && cutTranslations?.get(baseCutCode)?.name) ??
            cutTranslations?.get(baseGemstone.cut)?.name ??
            baseGemstone.cut
          : undefined;

      const displayClarity =
        typeof baseGemstone.clarity === "string"
          ? (baseClarityCode &&
              clarityTranslations?.get(baseClarityCode)?.name) ??
            clarityTranslations?.get(baseGemstone.clarity)?.name ??
            baseGemstone.clarity
          : undefined;

      return {
        ...baseGemstone,
        displayName,
        displayColor,
        displayCut,
        displayClarity,
      };
    });
  }, [
    results,
    typeTranslations,
    colorTranslations,
    cutTranslations,
    clarityTranslations,
  ]);

  const totalCount = data?.pagination.totalCount || 0;

  // Fetch filter counts - temporarily disabled to test search functionality
  const { data: filterCountsData } = useFilterCountsQuery({
    enabled: false, // Temporarily disable to test search functionality
  });

  // Fetch fuzzy suggestions when no results are found
  useEffect(() => {
    const fetchFuzzySuggestions = async () => {
      if (query && data && data.results.length === 0 && !isLoading) {
        try {
          // Use API endpoint instead of direct service call
          const response = await fetch(
            `/api/search/fuzzy-suggestions?query=${encodeURIComponent(
              query
            )}&limit=5&locale=${locale}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch fuzzy suggestions");
          }

          const result = await response.json();
          setFuzzySuggestions(result.suggestions || []);
        } catch (error) {
          console.error("Failed to fetch fuzzy suggestions:", error);
          setFuzzySuggestions([]);
        }
      } else {
        setFuzzySuggestions([]);
      }
    };

    fetchFuzzySuggestions();
  }, [query, data, isLoading, locale]);

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

  const handleDescriptionToggle = (enabled: boolean) => {
    setSearchDescriptions(enabled);
    window.localStorage.setItem(
      "search:descriptions",
      enabled ? "true" : "false"
    );
    setCurrentPage(1);
  };

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
              {t("resultsFor")} &quot; {query}&quot;
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

      {/* Description Search Toggle */}
      <div className="mb-6">
        <DescriptionSearchToggle
          value={searchDescriptions}
          onChange={handleDescriptionToggle}
        />
      </div>

      {/* Filter Sidebar - temporarily disabled to test search functionality */}
      {/*
      {filterCountsData && data && data.results.length > 0 && (
        <FilterSidebar
          filters={filters}
          onChange={handleFiltersChange}
          options={filterCountsData.aggregated}
          loading={isLoading}
          defaultOpen={false}
        />
      )}
      */}

      {/* Results */}
      {results.length === 0 ? (
        <EmptyState
          title={query ? t("noResults") : t("enterSearch")}
          message={query ? t("tryDifferent") : t("searchPrompt")}
        />
      ) : (
        <>
          <GemstoneGrid gemstones={decoratedResults} />

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
