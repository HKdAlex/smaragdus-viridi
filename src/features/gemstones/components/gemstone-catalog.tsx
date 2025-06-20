"use client";

import type {
  DatabaseGemstone,
  DatabaseGemstoneImage,
  DatabaseOrigin,
} from "@/shared/types";
import { useCallback, useEffect, useState } from "react";

import Image from "next/image";
import { supabase } from "@/lib/supabase";

// Enhanced gemstone interface for the catalog
interface CatalogGemstone extends DatabaseGemstone {
  images?: DatabaseGemstoneImage[];
  origin?: DatabaseOrigin | null;
}

interface GemstoneFilters {
  search?: string;
  gemstoneTypes?: string[];
  colors?: string[];
  cuts?: string[];
  inStockOnly?: boolean;
}

export function GemstoneCatalog() {
  const [gemstones, setGemstones] = useState<CatalogGemstone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<GemstoneFilters>({
    inStockOnly: true,
  });

  // Available filter options
  const [filterOptions, setFilterOptions] = useState({
    gemstoneTypes: [] as string[],
    colors: [] as string[],
    cuts: [] as string[],
  });

  const fetchGemstones = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase.from("gemstones").select(`
          *,
          images:gemstone_images(*),
          origin:origins(*)
        `);

      // Apply filters
      if (filters.search) {
        query = query.or(
          `serial_number.ilike.%${filters.search}%,internal_code.ilike.%${filters.search}%`
        );
      }

      if (filters.gemstoneTypes?.length) {
        query = query.in("name", filters.gemstoneTypes as any);
      }

      if (filters.colors?.length) {
        query = query.in("color", filters.colors as any);
      }

      if (filters.cuts?.length) {
        query = query.in("cut", filters.cuts as any);
      }

      if (filters.inStockOnly) {
        query = query.eq("in_stock", true);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        throw error;
      }

      setGemstones(data || []);
    } catch (error) {
      console.error("Error loading gemstones:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const [{ data: types }, { data: colors }, { data: cuts }] =
        await Promise.all([
          supabase.from("gemstones").select("name").not("name", "is", null),
          supabase.from("gemstones").select("color").not("color", "is", null),
          supabase.from("gemstones").select("cut").not("cut", "is", null),
        ]);

      setFilterOptions({
        gemstoneTypes: [
          ...new Set(types?.map((t) => t.name).filter(Boolean) || []),
        ],
        colors: [...new Set(colors?.map((c) => c.color).filter(Boolean) || [])],
        cuts: [...new Set(cuts?.map((c) => c.cut).filter(Boolean) || [])],
      });
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  }, []);

  useEffect(() => {
    fetchGemstones();
  }, [fetchGemstones]);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Gemstone Catalog
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover our carefully curated collection of premium gemstones from
          around the world
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              placeholder="Serial number or code..."
              value={filters.search || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    inStockOnly: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">In Stock Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {gemstones.length} Gemstone{gemstones.length !== 1 ? "s" : ""} Found
          </h2>
        </div>

        {gemstones.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl text-gray-300 mb-4">💎</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No gemstones found
            </h3>
            <p className="text-gray-500">
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
                  className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <div className="aspect-square relative bg-gray-100">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.image_url}
                        alt={`${gemstone.color} ${gemstone.name}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-4xl">💎</div>
                      </div>
                    )}

                    {/* Serial number overlay */}
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                      {gemstone.serial_number}
                    </div>

                    {/* Stock status */}
                    {!gemstone.in_stock && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Out of Stock
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {gemstone.color} {gemstone.name}
                      </h3>
                      <span className="text-sm text-gray-500 capitalize">
                        {gemstone.cut}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div>{gemstone.weight_carats}ct</div>
                      <div>{gemstone.clarity} clarity</div>
                      {gemstone.origin && (
                        <div className="text-xs">
                          Origin: {gemstone.origin.name}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(
                          gemstone.price_amount,
                          gemstone.price_currency
                        )}
                      </div>

                      {gemstone.delivery_days && (
                        <div className="text-xs text-gray-500">
                          {gemstone.delivery_days} days delivery
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
