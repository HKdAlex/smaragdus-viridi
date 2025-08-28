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

import { supabase } from "@/lib/supabase";
import { SafeImage } from "@/shared/components/ui/safe-image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { AdvancedGemstoneFilters } from "../types/filter.types";
import { AdvancedFilters } from "./filters/advanced-filters";
import { AdvancedFiltersV2 } from "./filters/advanced-filters-v2";

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
    | null; // Array since there can be multiple AI analyses
}

interface GemstoneFilters {
  search?: string;
  gemstoneTypes?: string[];
  colors?: string[];
  cuts?: string[];
  clarities?: string[];
  origins?: string[];
  priceRange?: { min: number; max: number; currency: string };
  weightRange?: { min: number; max: number };
  inStockOnly?: boolean;
  hasImages?: boolean;
  hasCertification?: boolean;
  hasAIAnalysis?: boolean;
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

export function GemstoneCatalog() {
  const t = useTranslations("catalog");

  const [allGemstones, setAllGemstones] = useState<CatalogGemstone[]>([]);
  const [filteredGemstones, setFilteredGemstones] = useState<CatalogGemstone[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<GemstoneFilters>({});
  const [useVisualFilters, setUseVisualFilters] = useState(false);

  const handleAdvancedFiltersChange = useCallback(
    (advancedFilters: AdvancedGemstoneFilters) => {
      console.log("🎯 [GemstoneCatalog] Received filter changes:", {
        advancedFilters,
        timestamp: new Date().toISOString(),
      });

      const newFilters: GemstoneFilters = {
        search: advancedFilters.search || "",
        inStockOnly: advancedFilters.inStockOnly || false,
        gemstoneTypes: advancedFilters.gemstoneTypes || [],
        colors: advancedFilters.colors || [],
        cuts: advancedFilters.cuts || [],
        clarities: advancedFilters.clarities || [],
        origins: advancedFilters.origins || [],
        priceRange: advancedFilters.priceRange
          ? {
              min: advancedFilters.priceRange.min,
              max: advancedFilters.priceRange.max,
              currency: advancedFilters.priceRange.currency,
            }
          : undefined,
        weightRange: advancedFilters.weightRange
          ? {
              min: advancedFilters.weightRange.min,
              max: advancedFilters.weightRange.max,
            }
          : undefined,
        hasImages: advancedFilters.hasImages,
        hasCertification: advancedFilters.hasCertification,
      };

      console.log("🔄 [GemstoneCatalog] Setting new filters:", {
        newFilters,
      });

      setFilters(newFilters);
    },
    [] // Remove filters dependency to prevent callback recreation
  );

  // Client-side filtering function
  const applyFilters = useCallback(
    (gemstones: CatalogGemstone[], filters: GemstoneFilters) => {
      console.log("🔍 [GemstoneCatalog] Applying client-side filters:", {
        filters,
      });

      let filtered = [...gemstones];

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter((gem) => {
          const dbGem = gem as DatabaseGemstone;
          return (
            dbGem.serial_number.toLowerCase().includes(searchTerm) ||
            dbGem.internal_code?.toLowerCase().includes(searchTerm) ||
            dbGem.name.toLowerCase().includes(searchTerm) ||
            dbGem.color.toLowerCase().includes(searchTerm) ||
            dbGem.cut.toLowerCase().includes(searchTerm)
          );
        });
      }

      // Gemstone types filter
      if (filters.gemstoneTypes?.length) {
        filtered = filtered.filter((gem) =>
          filters.gemstoneTypes!.includes((gem as DatabaseGemstone).name)
        );
      }

      // Colors filter
      if (filters.colors?.length) {
        filtered = filtered.filter((gem) =>
          filters.colors!.includes((gem as DatabaseGemstone).color)
        );
      }

      // Cuts filter
      if (filters.cuts?.length) {
        filtered = filtered.filter((gem) =>
          filters.cuts!.includes((gem as DatabaseGemstone).cut)
        );
      }

      // Clarities filter
      if (filters.clarities?.length) {
        filtered = filtered.filter((gem) =>
          filters.clarities!.includes((gem as DatabaseGemstone).clarity)
        );
      }

      // Origins filter
      if (filters.origins?.length) {
        filtered = filtered.filter(
          (gem) =>
            gem.origin?.name && filters.origins!.includes(gem.origin.name)
        );
      }

      // Price range filter
      if (filters.priceRange) {
        const minCents = filters.priceRange.min * 100;
        const maxCents = filters.priceRange.max * 100;
        filtered = filtered.filter(
          (gem) =>
            (gem as DatabaseGemstone).price_amount >= minCents &&
            (gem as DatabaseGemstone).price_amount <= maxCents
        );
      }

      // Weight range filter
      if (filters.weightRange) {
        filtered = filtered.filter(
          (gem) =>
            (gem as DatabaseGemstone).weight_carats >=
              filters.weightRange!.min &&
            (gem as DatabaseGemstone).weight_carats <= filters.weightRange!.max
        );
      }

      // In stock filter
      if (filters.inStockOnly) {
        filtered = filtered.filter((gem) => (gem as DatabaseGemstone).in_stock);
      }

      // Has images filter
      if (filters.hasImages) {
        filtered = filtered.filter(
          (gem) => gem.images && gem.images.length > 0
        );
      }

      // Has certification filter
      if (filters.hasCertification) {
        filtered = filtered.filter(
          (gem) => gem.certifications && gem.certifications.length > 0
        );
      }

      // Has AI analysis filter
      if (filters.hasAIAnalysis) {
        filtered = filtered.filter((gem) =>
          hasMeaningfulAIAnalysis(gem.ai_analysis)
        );
      }

      console.log("✅ [GemstoneCatalog] Client-side filtering completed:", {
        originalCount: gemstones.length,
        filteredCount: filtered.length,
        appliedFilters: Object.keys(filters).filter((key) => {
          const value = filters[key as keyof GemstoneFilters];
          return (
            value !== undefined &&
            value !== "" &&
            (Array.isArray(value) ? value.length > 0 : value !== false)
          );
        }),
      });

      return filtered;
    },
    []
  );

  // Apply filters whenever filters change
  useEffect(() => {
    const filtered = applyFilters(allGemstones, filters);
    setFilteredGemstones(filtered);
  }, [allGemstones, filters, applyFilters]);

  // Calculate available filter options from ALL gemstones (not filtered)
  const availableGemstoneTypes = useMemo(() => {
    const typeCounts = allGemstones.reduce((acc, gem) => {
      acc[(gem as DatabaseGemstone).name] =
        (acc[(gem as DatabaseGemstone).name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([value, count]) => ({
      value: value as GemstoneType,
      label: value.charAt(0).toUpperCase() + value.slice(1), // Capitalize first letter
      count,
    }));
  }, [allGemstones]);

  const availableColors = useMemo(() => {
    const colorCounts = allGemstones.reduce((acc, gem) => {
      acc[(gem as DatabaseGemstone).color] =
        (acc[(gem as DatabaseGemstone).color] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
  }, [allGemstones]);

  const availableCuts = useMemo(() => {
    const cutCounts = allGemstones.reduce((acc, gem) => {
      acc[(gem as DatabaseGemstone).cut] =
        (acc[(gem as DatabaseGemstone).cut] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(cutCounts).map(([value, count]) => ({
      value: value as GemCut,
      label: value.charAt(0).toUpperCase() + value.slice(1), // Capitalize first letter
      count,
    }));
  }, [allGemstones]);

  const availableClarities = useMemo(() => {
    const clarityCounts = allGemstones.reduce((acc, gem) => {
      acc[(gem as DatabaseGemstone).clarity] =
        (acc[(gem as DatabaseGemstone).clarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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
  }, [allGemstones]);

  const availableOrigins = useMemo(() => {
    const originCounts = allGemstones.reduce((acc, gem) => {
      if (gem.origin?.name) {
        const key = gem.origin.name;
        if (!acc[key]) {
          acc[key] = {
            value: gem.origin.name,
            label: gem.origin.name,
            country: gem.origin.country || "Unknown",
            count: 0,
          };
        }
        acc[key].count += 1;
      }
      return acc;
    }, {} as Record<string, { value: string; label: string; country: string; count: number }>);

    return Object.values(originCounts);
  }, [allGemstones]);

  // Load all gemstones once on mount
  const fetchAllGemstones = useCallback(async () => {
    try {
      console.log("🔍 [GemstoneCatalog] Loading all gemstones...");
      setLoading(true);

      const { data, error } = await supabase
        .from("gemstones")
        .select(
          `
          *,
          images:gemstone_images(*),
          origin:origins(*),
          certifications:certifications(*),
          ai_analysis:ai_analysis_results(id, confidence_score, analysis_type, extracted_data, created_at)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      console.log("✅ [GemstoneCatalog] All gemstones loaded:", {
        count: data?.length || 0,
      });

      // Transform data to match expected CatalogGemstone format
      const transformedData = (data || []).map((gemstone) => ({
        ...gemstone,
        ai_analysis: (gemstone.ai_analysis || []).map((analysis: any) => ({
          ...analysis,
          created_at: analysis.created_at || new Date().toISOString(),
          extracted_data: analysis.extracted_data || {},
        })),
      }));

      setAllGemstones(transformedData);
    } catch (error) {
      console.error("❌ [GemstoneCatalog] Error loading gemstones:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAllGemstones();
  }, [fetchAllGemstones]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Gemstone Catalog
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover our carefully curated collection of premium gemstones from
          around the world
        </p>
      </div>

      {/* Toggle between filters */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex rounded-lg border border-border bg-muted p-1">
          <button
            onClick={() => setUseVisualFilters(false)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              !useVisualFilters
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("standardFilters")}
          </button>
          <button
            onClick={() => setUseVisualFilters(true)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {t("resultsFound", { count: filteredGemstones.length })}
          </h2>
        </div>

        {filteredGemstones.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl text-muted-foreground mb-4">💎</div>
            <h3 className="text-xl font-medium text-foreground mb-2">
              {t("noGemstonesFound")}
            </h3>
            <p className="text-muted-foreground">
              {t("adjustFiltersMessage")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGemstones.map((gemstone) => {
              const primaryImage = getPrimaryImage(gemstone.images);

              return (
                <Link
                  key={(gemstone as DatabaseGemstone).id}
                  href={`/catalog/${(gemstone as DatabaseGemstone).id}`}
                  className="bg-card border border-border rounded-lg overflow-hidden 
                             hover:shadow-lg hover:shadow-primary/10 
                             transition-all duration-300 group 
                             hover:border-primary/30 block"
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
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                      {(gemstone as DatabaseGemstone).serial_number}
                    </div>

                    {/* Stock status */}
                    {!(gemstone as DatabaseGemstone).in_stock && (
                      <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
                        Out of Stock
                      </div>
                    )}

                    {/* Availability indicator */}
                    {(gemstone as DatabaseGemstone).in_stock && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
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
                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-2 py-1 rounded flex items-center space-x-1 shadow-sm">
                              <span>🤖</span>
                              <span>AI</span>
                            </div>
                            {bestAnalysis?.confidence_score &&
                              bestAnalysis.confidence_score >= 0.5 && (
                                <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white text-xs px-2 py-1 rounded shadow-sm">
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
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-card-foreground capitalize leading-tight">
                        {(gemstone as DatabaseGemstone).color}{" "}
                        {(gemstone as DatabaseGemstone).name}
                      </h3>
                      <span className="text-sm text-muted-foreground capitalize ml-2 flex-shrink-0">
                        {(gemstone as DatabaseGemstone).cut}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
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

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="text-lg font-bold text-primary">
                        {formatPrice(
                          (gemstone as DatabaseGemstone).price_amount,
                          (gemstone as DatabaseGemstone).price_currency
                        )}
                      </div>

                      {(gemstone as DatabaseGemstone).delivery_days && (
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {(gemstone as DatabaseGemstone).delivery_days} days
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
