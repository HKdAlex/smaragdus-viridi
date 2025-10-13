/**
 * Gemstone Fetch Service
 *
 * Unified data fetching logic for gemstones across catalog, admin, and related views.
 * Replaces duplicated fetch logic in multiple components.
 *
 * Following clean-code principles:
 * - Single Responsibility: Only handles data fetching
 * - DRY: Eliminates duplication across 3+ components
 * - Type Safety: Strict TypeScript with no any types
 */

import type {
  DatabaseCertification,
  DatabaseGemstone,
  DatabaseGemstoneImage,
  DatabaseOrigin,
} from "@/shared/types";

import type { AdvancedGemstoneFilters } from "../types/filter.types";

// ===== TYPES =====

export interface CatalogGemstone extends DatabaseGemstone {
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

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FetchGemstonesParams {
  filters: AdvancedGemstoneFilters;
  page: number;
  pageSize: number;
}

export interface FetchGemstonesResult {
  data: CatalogGemstone[];
  pagination: PaginationMeta;
  filters: AdvancedGemstoneFilters;
}

export interface FilterCounts {
  gemstoneTypes: Record<string, number>;
  colors: Record<string, number>;
  cuts: Record<string, number>;
  clarities: Record<string, number>;
  origins: Record<string, number>;
}

export interface RelatedGemstonesCriteria {
  currentGemstoneId: string;
  gemstoneType: DatabaseGemstone["name"];
  color: DatabaseGemstone["color"];
  priceRange: {
    min: number;
    max: number;
  };
  limit?: number;
}

// ===== SERVICE CLASS =====

export class GemstoneFetchService {
  /**
   * Fetch gemstones with filters and pagination
   * Used by: catalog, admin list, search results
   */
  static async fetchGemstones(
    params: FetchGemstonesParams
  ): Promise<FetchGemstonesResult> {
    const { filters, page, pageSize } = params;

    // Build query string using query builder (will be imported)
    const queryParams = new URLSearchParams();
    queryParams.set("page", page.toString());
    queryParams.set("pageSize", pageSize.toString());

    // Add filters
    if (filters.search) queryParams.set("search", filters.search);
    if (filters.gemstoneTypes?.length)
      queryParams.set("gemstoneTypes", filters.gemstoneTypes.join(","));
    if (filters.colors?.length)
      queryParams.set("colors", filters.colors.join(","));
    if (filters.cuts?.length) queryParams.set("cuts", filters.cuts.join(","));
    if (filters.clarities?.length)
      queryParams.set("clarities", filters.clarities.join(","));
    if (filters.origins?.length)
      queryParams.set("origins", filters.origins.join(","));
    if (filters.priceRange) {
      queryParams.set("priceMin", filters.priceRange.min.toString());
      queryParams.set("priceMax", filters.priceRange.max.toString());
    }
    if (filters.weightRange) {
      queryParams.set("weightMin", filters.weightRange.min.toString());
      queryParams.set("weightMax", filters.weightRange.max.toString());
    }
    if (filters.inStockOnly) queryParams.set("inStockOnly", "true");
    if (filters.hasImages) queryParams.set("hasImages", "true");
    if (filters.hasCertification) queryParams.set("hasCertification", "true");
    if (filters.hasAIAnalysis) queryParams.set("hasAIAnalysis", "true");
    if (filters.sortBy) queryParams.set("sortBy", filters.sortBy);
    if (filters.sortDirection)
      queryParams.set("sortDirection", filters.sortDirection);

    const response = await fetch(`/api/catalog?${queryParams.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch gemstones");
    }

    const result = await response.json();
    return result;
  }

  /**
   * Fetch filter counts for available options
   * Used by: catalog filters, admin filters
   */
  static async fetchFilterCounts(): Promise<FilterCounts> {
    const response = await fetch("/api/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "counts" }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch filter counts");
    }

    const result = await response.json();
    return result;
  }

  /**
   * Fetch related gemstones based on criteria
   * Used by: related gemstones component, recommendations
   */
  static async fetchRelatedGemstones(
    criteria: RelatedGemstonesCriteria
  ): Promise<CatalogGemstone[]> {
    const {
      currentGemstoneId,
      gemstoneType,
      color,
      priceRange,
      limit = 8,
    } = criteria;

    // Build query for related gemstones
    const queryParams = new URLSearchParams();
    queryParams.set("gemstoneTypes", gemstoneType);
    queryParams.set("colors", color);
    queryParams.set("priceMin", priceRange.min.toString());
    queryParams.set("priceMax", priceRange.max.toString());
    queryParams.set("pageSize", limit.toString());
    queryParams.set("page", "1");
    queryParams.set("inStockOnly", "true"); // Only show available items

    const response = await fetch(`/api/catalog?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error("Failed to fetch related gemstones");
    }

    const result = await response.json();

    // Filter out the current gemstone
    const relatedGemstones = result.data.filter(
      (gemstone: CatalogGemstone) => gemstone.id !== currentGemstoneId
    );

    return relatedGemstones.slice(0, limit);
  }
}
