/**
 * React Query Key Factory
 *
 * Centralized query key management for type-safe, consistent cache keys.
 * Following best practices from TanStack Query documentation.
 */

import type { AdvancedGemstoneFilters } from "@/features/gemstones/types/filter.types";

export const queryKeys = {
  // Gemstones
  gemstones: {
    all: ["gemstones"] as const,
    lists: () => [...queryKeys.gemstones.all, "list"] as const,
    list: (filters: AdvancedGemstoneFilters, page: number, pageSize: number) =>
      [...queryKeys.gemstones.lists(), { filters, page, pageSize }] as const,
    details: () => [...queryKeys.gemstones.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.gemstones.details(), id] as const,
  },

  // Filters
  filters: {
    all: ["filters"] as const,
    counts: () => [...queryKeys.filters.all, "counts"] as const,
    options: () => [...queryKeys.filters.all, "options"] as const,
  },

  // Related Gemstones
  related: {
    all: ["related"] as const,
    list: (gemstoneId: string) =>
      [...queryKeys.related.all, gemstoneId] as const,
  },

  // Images (long TTL)
  images: {
    all: ["images"] as const,
    image: (url: string) => [...queryKeys.images.all, url] as const,
  },

  // Search (Phase 2+)
  search: {
    all: ["search"] as const,
    results: (query: string, filters: AdvancedGemstoneFilters) =>
      [...queryKeys.search.all, "results", { query, filters }] as const,
    suggestions: (query: string) =>
      [...queryKeys.search.all, "suggestions", query] as const,
  },

  // Analytics (Phase 5+)
  analytics: {
    all: ["analytics"] as const,
    popular: () => [...queryKeys.analytics.all, "popular"] as const,
  },
} as const;
