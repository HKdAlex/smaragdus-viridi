"use client";

import type {
  AdvancedGemstoneFilters,
  FilterOptions,
} from "@/features/gemstones/types/filter.types";
import { Suspense, useState } from "react";

import { AdvancedFiltersV2 } from "@/features/gemstones/components/filters";

function DemoFiltersV2Content() {
  const [filters, setFilters] = useState<AdvancedGemstoneFilters | null>(null);

  // Mock filter options based on our database
  const mockOptions: FilterOptions = {
    gemstoneTypes: [
      { value: "diamond", label: "Diamond", count: 8 },
      { value: "emerald", label: "Emerald", count: 4 },
      { value: "ruby", label: "Ruby", count: 3 },
      { value: "sapphire", label: "Sapphire", count: 5 },
      { value: "amethyst", label: "Amethyst", count: 2 },
      { value: "topaz", label: "Topaz", count: 3 },
      { value: "garnet", label: "Garnet", count: 2 },
      { value: "peridot", label: "Peridot", count: 2 },
      { value: "citrine", label: "Citrine", count: 3 },
      { value: "tanzanite", label: "Tanzanite", count: 2 },
    ],
    colors: [
      { value: "red", label: "Red", count: 5, category: "colored" },
      { value: "blue", label: "Blue", count: 7, category: "colored" },
      { value: "green", label: "Green", count: 6, category: "colored" },
      { value: "yellow", label: "Yellow", count: 4, category: "colored" },
      { value: "pink", label: "Pink", count: 3, category: "colored" },
      { value: "white", label: "White", count: 2, category: "colored" },
      { value: "colorless", label: "Colorless", count: 8, category: "colored" },
      { value: "D", label: "D Grade", count: 2, category: "diamond" },
      { value: "E", label: "E Grade", count: 2, category: "diamond" },
      { value: "F", label: "F Grade", count: 1, category: "diamond" },
      { value: "G", label: "G Grade", count: 1, category: "diamond" },
      { value: "H", label: "H Grade", count: 1, category: "diamond" },
      { value: "I", label: "I Grade", count: 1, category: "diamond" },
    ],
    cuts: [
      { value: "round", label: "Round", count: 12 },
      { value: "oval", label: "Oval", count: 8 },
      { value: "marquise", label: "Marquise", count: 3 },
      { value: "pear", label: "Pear", count: 2 },
      { value: "emerald", label: "Emerald", count: 4 },
      { value: "princess", label: "Princess", count: 2 },
      { value: "cushion", label: "Cushion", count: 2 },
      { value: "radiant", label: "Radiant", count: 1 },
    ],
    clarities: [
      { value: "FL", label: "Flawless", count: 1, order: 1 },
      { value: "IF", label: "Internally Flawless", count: 2, order: 2 },
      { value: "VVS1", label: "VVS1", count: 3, order: 3 },
      { value: "VVS2", label: "VVS2", count: 4, order: 4 },
      { value: "VS1", label: "VS1", count: 5, order: 5 },
      { value: "VS2", label: "VS2", count: 6, order: 6 },
      { value: "SI1", label: "SI1", count: 7, order: 7 },
      { value: "SI2", label: "SI2", count: 5, order: 8 },
      { value: "I1", label: "I1", count: 1, order: 9 },
    ],
    origins: [
      { value: "colombia", label: "Colombia", count: 4, country: "Colombia" },
      { value: "myanmar", label: "Myanmar", count: 3, country: "Myanmar" },
      {
        value: "sri_lanka",
        label: "Sri Lanka",
        count: 5,
        country: "Sri Lanka",
      },
      {
        value: "madagascar",
        label: "Madagascar",
        count: 4,
        country: "Madagascar",
      },
      { value: "brazil", label: "Brazil", count: 6, country: "Brazil" },
      {
        value: "australia",
        label: "Australia",
        count: 2,
        country: "Australia",
      },
      { value: "tanzania", label: "Tanzania", count: 2, country: "Tanzania" },
      { value: "zambia", label: "Zambia", count: 3, country: "Zambia" },
      { value: "thailand", label: "Thailand", count: 2, country: "Thailand" },
      { value: "india", label: "India", count: 3, country: "India" },
    ],
    priceRange: {
      min: 650, // $6.50 in cents
      max: 4200000, // $42,000 in cents
      currency: "USD" as const,
    },
    weightRange: {
      min: 0.5,
      max: 16.0,
    },
  };

  const handleFiltersChange = (newFilters: AdvancedGemstoneFilters) => {
    setFilters(newFilters);
    console.log("Filters changed:", newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Advanced Filters V2 Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience our new visual filtering system with interactive
            components, segmented controls, and beautiful visual elements
            designed for luxury jewelry shopping.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Filters Panel */}
          <div className="lg:col-span-2">
            <AdvancedFiltersV2
              options={mockOptions}
              onFiltersChange={handleFiltersChange}
              className="sticky top-4"
            />
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Current Filters
              </h3>

              {filters ? (
                <div className="space-y-4">
                  {/* Search */}
                  {filters.search && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Search
                      </h4>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                        "{filters.search}"
                      </p>
                    </div>
                  )}

                  {/* Gemstone Types */}
                  {filters.gemstoneTypes &&
                    filters.gemstoneTypes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                          Gemstone Types
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {filters.gemstoneTypes.map((type) => (
                            <span
                              key={type}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Colors */}
                  {filters.colors && filters.colors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Colors
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {filters.colors.map((color) => (
                          <span
                            key={color}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                          >
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cuts */}
                  {filters.cuts && filters.cuts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Cuts
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {filters.cuts.map((cut) => (
                          <span
                            key={cut}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                          >
                            {cut}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clarities */}
                  {filters.clarities && filters.clarities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Clarities
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {filters.clarities.map((clarity) => (
                          <span
                            key={clarity}
                            className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs"
                          >
                            {clarity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Origins */}
                  {filters.origins && filters.origins.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Origins
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {filters.origins.map((origin) => (
                          <span
                            key={origin}
                            className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs"
                          >
                            {origin}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Range */}
                  {filters.priceRange && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Price Range
                      </h4>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: filters.priceRange.currency,
                        }).format(filters.priceRange.min / 100)}{" "}
                        -{" "}
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: filters.priceRange.currency,
                        }).format(filters.priceRange.max / 100)}
                      </p>
                    </div>
                  )}

                  {/* Weight Range */}
                  {filters.weightRange && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Weight Range
                      </h4>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                        {filters.weightRange.min} - {filters.weightRange.max}{" "}
                        carats
                      </p>
                    </div>
                  )}

                  {/* Boolean Options */}
                  <div className="space-y-2">
                    {filters.inStockOnly && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">
                          In stock only
                        </span>
                      </div>
                    )}
                    {filters.hasImages && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">
                          Has images
                        </span>
                      </div>
                    )}
                    {filters.hasCertification && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span className="text-sm text-gray-600">
                          Has certification
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Filter Count Summary */}
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Active filters: {getActiveFilterCount(filters)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Adjust the filters to see the results here.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            This is a demonstration of the Advanced Filters V2 component.
            <br />
            In the actual catalog, this would filter real gemstone data.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DemoFiltersV2Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <DemoFiltersV2Content />
    </Suspense>
  );
}

function getActiveFilterCount(filters: AdvancedGemstoneFilters): number {
  let count = 0;

  if (filters.search) count++;
  if (filters.gemstoneTypes?.length) count++;
  if (filters.colors?.length) count++;
  if (filters.cuts?.length) count++;
  if (filters.clarities?.length) count++;
  if (filters.origins?.length) count++;
  if (filters.priceRange) count++;
  if (filters.weightRange) count++;
  if (filters.inStockOnly) count++;
  if (filters.hasImages) count++;
  if (filters.hasCertification) count++;

  return count;
}
