"use client";

import type {
  DatabaseCertification,
  DatabaseGemstone,
  DatabaseGemstoneImage,
  DatabaseOrigin,
  GemClarity,
  GemColor,
  GemCut,
  GemstoneType,
} from "@/shared/types";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdvancedFilters } from "./filters/advanced-filters";
import { AdvancedFiltersV2 } from "./filters/advanced-filters-v2";
import type { AdvancedGemstoneFilters } from "../types/filter.types";
import Link from "next/link";
import { SafeImage } from "@/shared/components/ui/safe-image";
import { catalogCache } from "../services/catalog-cache";
import { useTranslations } from "next-intl";

// Enhanced gemstone interface for the catalog
interface CatalogGemstone extends DatabaseGemstone {
  images?: DatabaseGemstoneImage[];
  origin?: DatabaseOrigin | null;
  certifications?: DatabaseCertification[];
  ai_analysis?:
    | {
        id: string;
        confidence_score: number | null;
        analysis_type: string;
        extracted_data: any;
        created_at: string;
      }[]
    | null;
}

interface CatalogResponse {
  data: CatalogGemstone[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: any;
  error?: string;
}

interface FilterCounts {
  gemstoneTypes: Record<string, number>;
  colors: Record<string, number>;
  cuts: Record<string, number>;
  clarities: Record<string, number>;
  origins: Record<string, number>;
}

// Helper function to check if gemstone has meaningful AI analysis
const hasMeaningfulAIAnalysis = (
  aiAnalysis: any[] | null | undefined
): boolean => {
  if (!aiAnalysis || !Array.isArray(aiAnalysis) || aiAnalysis.length === 0) {
    return false;
  }

  // Check if any analysis has high confidence score and meaningful extracted data
  return aiAnalysis.some((analysis) => {
    const hasHighConfidence =
      analysis.confidence_score && analysis.confidence_score >= 0.5;
    const hasExtractedData =
      analysis.extracted_data &&
      typeof analysis.extracted_data === "object" &&
      Object.keys(analysis.extracted_data).length > 0;

    return hasHighConfidence && hasExtractedData;
  });
};

// Get the best AI analysis for display
const getBestAIAnalysis = (aiAnalysis: any[] | null | undefined) => {
  if (!aiAnalysis || !Array.isArray(aiAnalysis) || aiAnalysis.length === 0) {
    return null;
  }

  // Return the analysis with highest confidence score
  return aiAnalysis.reduce((best, current) => {
    const currentScore = current.confidence_score || 0;
    const bestScore = best.confidence_score || 0;
    return currentScore > bestScore ? current : best;
  });
};

export function GemstoneCatalogOptimized() {
  const t = useTranslations("catalog");

  const [gemstones, setGemstones] = useState<CatalogGemstone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AdvancedGemstoneFilters>({});
  const [useVisualFilters, setUseVisualFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(24); // Fixed page size for optimal performance
  const [pagination, setPagination] = useState<
    CatalogResponse["pagination"] | null
  >(null);
  const [filterCounts, setFilterCounts] = useState<FilterCounts | null>(null);

  // Build query string from filters and pagination
  const buildQueryString = useCallback(
    (filters: AdvancedGemstoneFilters, page: number) => {
      const params = new URLSearchParams();

      // Add pagination
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      // Add filters
      if (filters.search) params.set("search", filters.search);
      if (filters.gemstoneTypes?.length)
        params.set("gemstoneTypes", filters.gemstoneTypes.join(","));
      if (filters.colors?.length)
        params.set("colors", filters.colors.join(","));
      if (filters.cuts?.length) params.set("cuts", filters.cuts.join(","));
      if (filters.clarities?.length)
        params.set("clarities", filters.clarities.join(","));
      if (filters.origins?.length)
        params.set("origins", filters.origins.join(","));
      if (filters.priceRange) {
        params.set("priceMin", filters.priceRange.min.toString());
        params.set("priceMax", filters.priceRange.max.toString());
      }
      if (filters.weightRange) {
        params.set("weightMin", filters.weightRange.min.toString());
        params.set("weightMax", filters.weightRange.max.toString());
      }
      if (filters.inStockOnly) params.set("inStockOnly", "true");
      if (filters.hasImages) params.set("hasImages", "true");
      if (filters.hasCertification) params.set("hasCertification", "true");
      if (filters.hasAIAnalysis) params.set("hasAIAnalysis", "true");
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortDirection)
        params.set("sortDirection", filters.sortDirection);

      return params.toString();
    },
    [pageSize]
  );

  // Fetch gemstones with server-side filtering and pagination
  const fetchGemstones = useCallback(
    async (filters: AdvancedGemstoneFilters, page: number) => {
      try {
        setLoading(true);

        // Check cache first
        const cacheKey = catalogCache.getSearchResultsKey(
          filters,
          page,
          pageSize
        );
        const cachedResult = catalogCache.get<CatalogResponse>(cacheKey);

        if (cachedResult) {
          console.log("📦 [GemstoneCatalogOptimized] Using cached result:", {
            count: cachedResult.data.length,
            page: cachedResult.pagination.page,
            cacheKey,
          });
          setGemstones(cachedResult.data);
          setPagination(cachedResult.pagination);
          setLoading(false);
          return;
        }

        const queryString = buildQueryString(filters, page);

        console.log("🔍 [GemstoneCatalogOptimized] Fetching with query:", {
          filters,
          page,
          queryString,
          timestamp: new Date().toISOString(),
        });

        const response = await fetch(`/api/catalog?${queryString}`);
        const result: CatalogResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch gemstones");
        }

        console.log("✅ [GemstoneCatalogOptimized] Fetched gemstones:", {
          count: result.data.length,
          totalItems: result.pagination.totalItems,
          page: result.pagination.page,
          totalPages: result.pagination.totalPages,
        });

        // Cache the result
        catalogCache.set(cacheKey, result, 2 * 60 * 1000); // 2 minutes TTL

        setGemstones(result.data);
        setPagination(result.pagination);
      } catch (error) {
        console.error(
          "❌ [GemstoneCatalogOptimized] Error fetching gemstones:",
          error
        );
      } finally {
        setLoading(false);
      }
    },
    [buildQueryString, pageSize]
  );

  // Fetch filter counts for available options
  const fetchFilterCounts = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = catalogCache.getFilterOptionsKey();
      const cachedResult = catalogCache.get<FilterCounts>(cacheKey);

      if (cachedResult) {
        console.log("📦 [GemstoneCatalogOptimized] Using cached filter counts");
        setFilterCounts(cachedResult);
        return;
      }

      const response = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "counts" }),
      });

      const result = await response.json();
      if (response.ok) {
        // Cache the result for 10 minutes since filter options change less frequently
        catalogCache.set(cacheKey, result, 10 * 60 * 1000);
        setFilterCounts(result);
      }
    } catch (error) {
      console.error("Error fetching filter counts:", error);
    }
  }, []);

  // Handle filter changes
  const handleAdvancedFiltersChange = useCallback(
    (advancedFilters: AdvancedGemstoneFilters) => {
      console.log("🎯 [GemstoneCatalogOptimized] Filter change received:", {
        advancedFilters,
        timestamp: new Date().toISOString(),
      });

      setFilters(advancedFilters);
      setCurrentPage(1); // Reset to first page when filters change

      // Invalidate search cache when filters change
      catalogCache.invalidateSearchResults();
    },
    []
  );

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Load filter counts on mount
  useEffect(() => {
    fetchFilterCounts();
  }, [fetchFilterCounts]);

  // Fetch gemstones when filters or page changes
  useEffect(() => {
    fetchGemstones(filters, currentPage);
  }, [filters, currentPage, fetchGemstones]);

  // Calculate available filter options from counts
  const availableGemstoneTypes = useMemo(() => {
    if (!filterCounts) return [];
    return Object.entries(filterCounts.gemstoneTypes).map(([value, count]) => ({
      value: value as GemstoneType,
      label: value.charAt(0).toUpperCase() + value.slice(1), // Capitalize first letter
      count,
    }));
  }, [filterCounts]);

  const availableColors = useMemo(() => {
    if (!filterCounts) return [];
    const colorCounts = filterCounts.colors;

    // Helper function to categorize colors
    const getColorCategory = (
      color: GemColor
    ): "diamond" | "colored" | "fancy" => {
      if (["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"].includes(color)) {
        return "diamond";
      }
      if (color.startsWith("fancy-")) {
        return "fancy";
      }
      return "colored";
    };

    return Object.entries(colorCounts).map(([value, count]) => ({
      value: value as GemColor,
      label: value.charAt(0).toUpperCase() + value.slice(1), // Capitalize first letter
      count,
      category: getColorCategory(value as GemColor),
    }));
  }, [filterCounts]);

  const availableCuts = useMemo(() => {
    if (!filterCounts) return [];
    return Object.entries(filterCounts.cuts).map(([value, count]) => ({
      value: value as GemCut,
      label: value.charAt(0).toUpperCase() + value.slice(1), // Capitalize first letter
      count,
    }));
  }, [filterCounts]);

  const availableClarities = useMemo(() => {
    if (!filterCounts) return [];
    const clarityCounts = filterCounts.clarities;

    // Clarity order for proper sorting
    const clarityOrder: Record<GemClarity, number> = {
      FL: 1,
      IF: 2,
      VVS1: 3,
      VVS2: 4,
      VS1: 5,
      VS2: 6,
      SI1: 7,
      SI2: 8,
      I1: 9,
    };

    return Object.entries(clarityCounts).map(([value, count]) => ({
      value: value as GemClarity,
      label: value, // Clarity codes are already properly formatted (e.g., "VVS1", "SI2")
      count,
      order: clarityOrder[value as GemClarity] || 10,
    }));
  }, [filterCounts]);

  const availableOrigins = useMemo(() => {
    if (!filterCounts) return [];
    return Object.entries(filterCounts.origins).map(([value, count]) => ({
      value: value,
      label: value,
      country: "Various", // Default country for origins without specific country data
      count,
    }));
  }, [filterCounts]);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100); // Convert from cents
  };

  const getPrimaryImage = (images?: DatabaseGemstoneImage[]) => {
    if (!images?.length) return null;
    return images.find((img) => img.is_primary) || images[0];
  };

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
      <div className="text-center px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
          {t("title")}
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t("description")}
        </p>
      </div>

      {/* Toggle between filters */}
      <div className="flex items-center justify-center mb-6 px-4">
        <div className="inline-flex rounded-lg border border-border bg-muted p-1 w-full max-w-xs sm:w-auto">
          <button
            onClick={() => setUseVisualFilters(false)}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
              !useVisualFilters
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("standardFilters")}
          </button>
          <button
            onClick={() => setUseVisualFilters(true)}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] ${
              useVisualFilters
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("visualFilters")}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {useVisualFilters ? (
        <AdvancedFiltersV2
          onFiltersChange={handleAdvancedFiltersChange}
          options={{
            gemstoneTypes: availableGemstoneTypes,
            colors: availableColors,
            cuts: availableCuts,
            clarities: availableClarities,
            origins: availableOrigins,
            priceRange: {
              min: 0,
              max: 5000000, // $50,000 in cents
              currency: "USD",
            },
            weightRange: {
              min: 0,
              max: 20, // 20 carats
            },
          }}
        />
      ) : (
        <AdvancedFilters
          onFiltersChange={handleAdvancedFiltersChange}
          options={{
            gemstoneTypes: availableGemstoneTypes,
            colors: availableColors,
            cuts: availableCuts,
            clarities: availableClarities,
            origins: availableOrigins,
          }}
        />
      )}

      {/* Results */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            {pagination
              ? `Showing ${gemstones.length} of ${pagination.totalItems} gemstones`
              : `Loading gemstones...`}
          </h2>
        </div>

        {gemstones.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-4xl sm:text-6xl text-muted-foreground mb-4">
              💎
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-foreground mb-2">
              {t("noGemstonesFound")}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              {t("adjustFiltersMessage")}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {gemstones.map((gemstone) => {
                const primaryImage = getPrimaryImage(gemstone.images);

                return (
                  <Link
                    key={(gemstone as DatabaseGemstone).id}
                    href={`/catalog/${(gemstone as DatabaseGemstone).id}`}
                    className="bg-card border border-border rounded-lg overflow-hidden
                               hover:shadow-lg hover:shadow-primary/10
                               transition-all duration-300 group
                               hover:border-primary/30 block
                               min-h-[320px] sm:min-h-[360px]"
                  >
                    {/* Image */}
                    <div className="aspect-square relative bg-muted">
                      {primaryImage ? (
                        <SafeImage
                          src={primaryImage.image_url}
                          alt={`${(gemstone as DatabaseGemstone).color} ${
                            (gemstone as DatabaseGemstone).name
                          }`}
                          width={400}
                          height={400}
                          className="object-cover w-full h-full transition-transform duration-300
                                     group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          onError={(error: string) => {
                            if (process.env.NODE_ENV === "development") {
                              console.warn(
                                `Image failed to load for ${
                                  (gemstone as DatabaseGemstone).serial_number
                                }:`,
                                error
                              );
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <div className="text-4xl">💎</div>
                        </div>
                      )}

                      {/* Serial number overlay */}
                      <div className="absolute bottom-2 right-2 bg-black/75 dark:bg-black/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        {(gemstone as DatabaseGemstone).serial_number}
                      </div>

                      {/* Stock status */}
                      {!(gemstone as DatabaseGemstone).in_stock && (
                        <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded shadow-sm">
                          Out of Stock
                        </div>
                      )}

                      {/* Availability indicator */}
                      {(gemstone as DatabaseGemstone).in_stock && (
                        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-sm">
                          Available
                        </div>
                      )}

                      {/* AI Analysis indicator - only show when there's meaningful data */}
                      {hasMeaningfulAIAnalysis(gemstone.ai_analysis) &&
                        (() => {
                          const bestAnalysis = getBestAIAnalysis(
                            gemstone.ai_analysis
                          );
                          return (
                            <div className="absolute top-2 right-2 flex items-center space-x-1">
                              <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs px-2 py-1 rounded flex items-center space-x-1 shadow-sm">
                                <span>🤖</span>
                                <span>AI</span>
                              </div>
                              {bestAnalysis?.confidence_score &&
                                bestAnalysis.confidence_score >= 0.5 && (
                                  <div className="bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground text-xs px-2 py-1 rounded shadow-sm">
                                    {(
                                      bestAnalysis.confidence_score * 100
                                    ).toFixed(0)}
                                    %
                                  </div>
                                )}
                            </div>
                          );
                        })()}
                    </div>

                    {/* Details */}
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground capitalize leading-tight text-sm sm:text-base">
                          {(gemstone as DatabaseGemstone).color}{" "}
                          {(gemstone as DatabaseGemstone).name}
                        </h3>
                        <span className="text-xs sm:text-sm text-muted-foreground capitalize ml-2 flex-shrink-0">
                          {(gemstone as DatabaseGemstone).cut}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs sm:text-sm text-muted-foreground mb-3">
                        <div className="font-medium text-foreground">
                          {(gemstone as DatabaseGemstone).weight_carats}ct
                        </div>
                        <div>
                          {(gemstone as DatabaseGemstone).clarity} clarity
                        </div>
                        {gemstone.origin && (
                          <div className="text-xs">
                            Origin: {gemstone.origin.name}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border gap-2">
                        <div className="text-base sm:text-lg font-bold text-primary">
                          {formatPrice(
                            (gemstone as DatabaseGemstone).price_amount,
                            (gemstone as DatabaseGemstone).price_currency
                          )}
                        </div>

                        {(gemstone as DatabaseGemstone).delivery_days && (
                          <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded self-start sm:self-auto">
                            {(gemstone as DatabaseGemstone).delivery_days} days
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center mt-8 space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Previous
                </button>

                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="px-4 py-2 border border-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
