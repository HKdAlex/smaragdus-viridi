/**
 * Search Results Component
 *
 * Displays search results with infinite scroll.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import type { CatalogGemstone } from "@/features/gemstones/services/gemstone-fetch.service";
import { DescriptionSearchToggle } from "./description-search-toggle";
import { EmptyState } from "@/features/gemstones/components/empty-state";
import { FuzzySearchBanner } from "./fuzzy-search-banner";
import { GemstoneGrid } from "@/features/gemstones/components/gemstone-grid";
import { InfiniteScrollTrigger } from "@/features/gemstones/components/infinite-scroll-trigger";
import { LoadingState } from "@/features/gemstones/components/loading-state";
import { SearchInput } from "./search-input";
import { useFilterCountsQuery } from "@/features/gemstones/hooks/use-filter-counts-query";
import { useFilterState } from "@/features/gemstones/hooks/use-filter-state";
import { useFilterUrlSync } from "@/features/gemstones/hooks/use-filter-url-sync";
import { useInfiniteSearchQuery } from "@/features/search/hooks/use-infinite-search-query";
import { useSearchParams } from "next/navigation";
import { useTypeSafeRouter } from "@/lib/navigation/type-safe-router";

const PAGE_SIZE = 24;

export function SearchResults() {
  const t = useTranslations("search");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useTypeSafeRouter();

  // Ref to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);

  // Get search query from URL
  const query = searchParams.get("q") || "";

  // Filter state
  const { filters, updateFilters, resetFilters, filterCount } =
    useFilterState();

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);

  // URL synchronization (opt-in side effect)
  useFilterUrlSync(filters);

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

  // Use infinite query for search results
  const {
    allResults,
    totalCount,
    usedFuzzySearch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteSearchQuery({
    query,
    filters: memoizedFilters,
    pageSize: PAGE_SIZE,
    locale,
    searchDescriptions,
  });

  // Prepare results with properly sorted images and AI data
  // Translation is handled by GemstoneCard using useGemstoneTranslations hook
  const decoratedResults = useMemo<CatalogGemstone[]>(() => {
    return allResults.map((gemstone) => {
      const baseGemstone = gemstone as CatalogGemstone;

      const sortedImages = [...(baseGemstone.images ?? [])].sort((a, b) => {
        const orderA = typeof a.image_order === "number" ? a.image_order : 0;
        const orderB = typeof b.image_order === "number" ? b.image_order : 0;
        return orderA - orderB;
      });

      return {
        ...baseGemstone,
        images: sortedImages,
        selected_image_uuid: baseGemstone.selected_image_uuid,
        recommended_primary_image_index:
          baseGemstone.recommended_primary_image_index,
        // Pass through AI data if available
        ai_color: (baseGemstone as any).ai_color,
        v6_text: (baseGemstone as any).v6_text,
      };
    });
  }, [allResults]);

  // Fetch filter counts - temporarily disabled to test search functionality
  const { data: filterCountsData } = useFilterCountsQuery({
    enabled: false, // Temporarily disable to test search functionality
  });

  // Fetch fuzzy suggestions when no results are found
  useEffect(() => {
    const fetchFuzzySuggestions = async () => {
      if (query && allResults.length === 0 && !isLoading) {
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
  }, [query, allResults.length, isLoading, locale]);

  // Handle filter change
  const handleFiltersChange = (newFilters: typeof filters) => {
    updateFilters(newFilters);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    // Query will automatically reset when searchDescriptions changes
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
      {usedFuzzySearch && allResults.length > 0 && (
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
      {fuzzySuggestions.length > 0 && allResults.length === 0 && (
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
      {allResults.length === 0 ? (
        <EmptyState
          title={query ? t("noResults") : t("enterSearch")}
          message={query ? t("tryDifferent") : t("searchPrompt")}
        />
      ) : (
        <>
          <GemstoneGrid gemstones={decoratedResults} />

          {/* Infinite Scroll Trigger */}
          <InfiniteScrollTrigger
            onIntersect={handleLoadMore}
            isFetching={isFetchingNextPage}
            hasMore={hasNextPage ?? false}
          />
        </>
      )}
    </div>
  );
}
