/**
 * React Query Key Factory
 *
 * Centralized query key management for type-safe, consistent cache keys.
 * Following best practices from TanStack Query documentation.
 */

import type { AdvancedGemstoneFilters } from "@/features/gemstones/types/filter.types";
import type { SearchFilters } from "@/features/admin/components/enhanced-search";

export const queryKeys = {
  // Gemstones
  gemstones: {
    all: ["gemstones"] as const,
    lists: () => [...queryKeys.gemstones.all, "list"] as const,
    list: (filters: AdvancedGemstoneFilters, page: number, pageSize: number) =>
      [...queryKeys.gemstones.lists(), { filters, page, pageSize }] as const,
    infinite: (filters: AdvancedGemstoneFilters, pageSize: number) =>
      [...queryKeys.gemstones.all, "infinite", { filters, pageSize }] as const,
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

  // Images (long TTL - Phase 6)
  images: {
    all: ["images"] as const,
    detail: (url: string) => [...queryKeys.images.all, "detail", url] as const,
  },

  // Translations
  translations: {
    all: ["translations"] as const,
    list: (locale: string, kind: "type" | "color" | "cut" | "clarity") =>
      [...queryKeys.translations.all, locale, kind] as const,
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

  // Admin Dashboard
  admin: {
    all: ["admin"] as const,
    dashboard: {
      all: () => [...queryKeys.admin.all, "dashboard"] as const,
      stats: () => [...queryKeys.admin.dashboard.all(), "stats"] as const,
    },
    gemstones: {
      all: () => [...queryKeys.admin.all, "gemstones"] as const,
      lists: () => [...queryKeys.admin.gemstones.all(), "list"] as const,
      list: (filters: SearchFilters, page: number, pageSize: number) =>
        [...queryKeys.admin.gemstones.lists(), { filters, page, pageSize }] as const,
      details: () => [...queryKeys.admin.gemstones.all(), "detail"] as const,
      detail: (id: string) => [...queryKeys.admin.gemstones.details(), id] as const,
    },
    mediaStats: {
      all: () => [...queryKeys.admin.all, "mediaStats"] as const,
      stats: () => [...queryKeys.admin.mediaStats.all(), "stats"] as const,
    },
  },
} as const;
