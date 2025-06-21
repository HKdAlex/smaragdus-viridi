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
import type { AdvancedGemstoneFilters } from "../types/filter.types";
import { SafeImage } from "@/shared/components/ui/safe-image";
import { supabase } from "@/lib/supabase";

// Enhanced gemstone interface for the catalog
interface CatalogGemstone extends DatabaseGemstone {
  images?: DatabaseGemstoneImage[];
  origin?: DatabaseOrigin | null;
  certifications?: DatabaseCertification[];
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
}

export function GemstoneCatalog() {
  const [gemstones, setGemstones] = useState<CatalogGemstone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<GemstoneFilters>({
    inStockOnly: true,
  });

  // Handle advanced filters change
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

  // Calculate available filter options from current gemstones
  const availableGemstoneTypes = useMemo(() => {
    const typeCounts = gemstones.reduce((acc, gem) => {
      acc[gem.name] = (acc[gem.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts).map(([value, count]) => ({
      value: value as GemstoneType,
      label: value.charAt(0).toUpperCase() + value.slice(1), // Capitalize first letter
      count,
    }));
  }, [gemstones]);

  const availableColors = useMemo(() => {
    const colorCounts = gemstones.reduce((acc, gem) => {
      acc[gem.color] = (acc[gem.color] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(colorCounts).map(([value, count]) => ({
      value: value as GemColor,
      label: value.charAt(0).toUpperCase() + value.slice(1), // Capitalize first letter
      count,
    }));
  }, [gemstones]);

  const availableCuts = useMemo(() => {
    const cutCounts = gemstones.reduce((acc, gem) => {
      acc[gem.cut] = (acc[gem.cut] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(cutCounts).map(([value, count]) => ({
      value: value as GemCut,
      label: value.charAt(0).toUpperCase() + value.slice(1), // Capitalize first letter
      count,
    }));
  }, [gemstones]);

  const availableClarities = useMemo(() => {
    const clarityCounts = gemstones.reduce((acc, gem) => {
      acc[gem.clarity] = (acc[gem.clarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(clarityCounts).map(([value, count]) => ({
      value: value as GemClarity,
      label: value, // Clarity codes are already properly formatted (e.g., "VVS1", "SI2")
      count,
    }));
  }, [gemstones]);

  const availableOrigins = useMemo(() => {
    const originCounts = gemstones.reduce((acc, gem) => {
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
  }, [gemstones]);

  const fetchGemstones = useCallback(async () => {
    try {
      console.log("🔍 [GemstoneCatalog] Fetching gemstones with filters:", {
        filters,
        timestamp: new Date().toISOString(),
      });

      setLoading(true);

      let query = supabase.from("gemstones").select(`
          *,
          images:gemstone_images(*),
          origin:origins(*),
          certifications:certifications(*)
        `);

      // Apply filters
      if (filters.search) {
        query = query.or(
          `serial_number.ilike.%${filters.search}%,internal_code.ilike.%${filters.search}%`
        );
      }

      if (filters.gemstoneTypes?.length) {
        query = query.in("name", filters.gemstoneTypes as GemstoneType[]);
      }

      if (filters.colors?.length) {
        query = query.in("color", filters.colors as GemColor[]);
      }

      if (filters.cuts?.length) {
        query = query.in("cut", filters.cuts as GemCut[]);
      }

      if (filters.clarities?.length) {
        query = query.in("clarity", filters.clarities as GemClarity[]);
      }

      if (filters.origins?.length) {
        // Filter by origin_id first, we'll need to get origin IDs
        // For now, let's filter in memory after the query
        // TODO: Optimize this with a separate origins query
      }

      if (filters.priceRange) {
        // Convert from dollars to cents for database query
        const minCents = filters.priceRange.min * 100;
        const maxCents = filters.priceRange.max * 100;
        query = query
          .gte("price_amount", minCents)
          .lte("price_amount", maxCents);
      }

      if (filters.weightRange) {
        query = query
          .gte("weight_carats", filters.weightRange.min)
          .lte("weight_carats", filters.weightRange.max);
      }

      if (filters.inStockOnly) {
        query = query.eq("in_stock", true);
      }

      // Note: hasImages and hasCertification will be filtered after query
      // since they depend on related table data

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        throw error;
      }

      // Apply post-query filters for related data
      let filteredData = data || [];

      // Filter by origins (origin names)
      if (filters.origins?.length && filteredData.length > 0) {
        filteredData = filteredData.filter(
          (gemstone) =>
            gemstone.origin?.name &&
            filters.origins!.includes(gemstone.origin.name)
        );
      }

      // Filter by hasImages
      if (filters.hasImages && filteredData.length > 0) {
        filteredData = filteredData.filter(
          (gemstone) => gemstone.images && gemstone.images.length > 0
        );
      }

      // Filter by hasCertification
      if (filters.hasCertification && filteredData.length > 0) {
        filteredData = filteredData.filter(
          (gemstone) =>
            gemstone.certifications && gemstone.certifications.length > 0
        );
      }

      console.log("✅ [GemstoneCatalog] Query completed:", {
        rawResultCount: data?.length || 0,
        filteredResultCount: filteredData.length,
        appliedFilters: Object.keys(filters).filter((key) => {
          const value = filters[key as keyof GemstoneFilters];
          return (
            value !== undefined &&
            value !== "" &&
            (Array.isArray(value) ? value.length > 0 : value !== false)
          );
        }),
      });

      setGemstones(filteredData);
    } catch (error) {
      console.error("❌ [GemstoneCatalog] Error loading gemstones:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGemstones();
  }, [fetchGemstones]);

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

      {/* Advanced Filters */}
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

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {gemstones.length} Gemstone{gemstones.length !== 1 ? "s" : ""} Found
          </h2>
        </div>

        {gemstones.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl text-muted-foreground mb-4">💎</div>
            <h3 className="text-xl font-medium text-foreground mb-2">
              No gemstones found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more results.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {gemstones.map((gemstone) => {
              const primaryImage = getPrimaryImage(gemstone.images);

              return (
                <div
                  key={gemstone.id}
                  className="bg-card border border-border rounded-lg overflow-hidden 
                             hover:shadow-lg hover:shadow-primary/10 
                             transition-all duration-300 group 
                             hover:border-primary/30"
                >
                  {/* Image */}
                  <div className="aspect-square relative bg-muted">
                    {primaryImage ? (
                      <SafeImage
                        src={primaryImage.image_url}
                        alt={`${gemstone.color} ${gemstone.name}`}
                        width={400}
                        height={400}
                        className="object-cover w-full h-full transition-transform duration-300 
                                   group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        onError={(error: string) => {
                          if (process.env.NODE_ENV === "development") {
                            console.warn(
                              `Image failed to load for ${gemstone.serial_number}:`,
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
                      {gemstone.serial_number}
                    </div>

                    {/* Stock status */}
                    {!gemstone.in_stock && (
                      <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
                        Out of Stock
                      </div>
                    )}

                    {/* Availability indicator */}
                    {gemstone.in_stock && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Available
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-card-foreground capitalize leading-tight">
                        {gemstone.color} {gemstone.name}
                      </h3>
                      <span className="text-sm text-muted-foreground capitalize ml-2 flex-shrink-0">
                        {gemstone.cut}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground mb-3">
                      <div className="font-medium text-foreground">
                        {gemstone.weight_carats}ct
                      </div>
                      <div>{gemstone.clarity} clarity</div>
                      {gemstone.origin && (
                        <div className="text-xs">
                          Origin: {gemstone.origin.name}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="text-lg font-bold text-primary">
                        {formatPrice(
                          gemstone.price_amount,
                          gemstone.price_currency
                        )}
                      </div>

                      {gemstone.delivery_days && (
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {gemstone.delivery_days} days
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
