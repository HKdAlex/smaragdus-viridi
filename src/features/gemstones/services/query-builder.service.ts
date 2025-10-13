/**
 * Query Builder Service
 *
 * DRY utility for constructing URL query strings for gemstone searches.
 * Eliminates duplication of query building logic across components.
 *
 * Following clean-code principles:
 * - DRY: Single source of truth for query construction
 * - Type Safety: Strongly typed inputs and outputs
 * - Pure Functions: No side effects, testable
 */

import type { AdvancedGemstoneFilters } from "../types/filter.types";
import type { RelatedGemstonesCriteria } from "./gemstone-fetch.service";

export class QueryBuilderService {
  /**
   * Build search query parameters from filters
   * Used for catalog and admin searches
   */
  static buildSearchQuery(
    filters: AdvancedGemstoneFilters,
    page: number,
    pageSize: number = 24
  ): URLSearchParams {
    const params = new URLSearchParams();

    // Pagination
    params.set("page", page.toString());
    params.set("pageSize", pageSize.toString());

    // Text search
    if (filters.search) {
      params.set("search", filters.search);
    }

    // Categorical filters
    if (filters.gemstoneTypes?.length) {
      params.set("gemstoneTypes", filters.gemstoneTypes.join(","));
    }
    if (filters.colors?.length) {
      params.set("colors", filters.colors.join(","));
    }
    if (filters.cuts?.length) {
      params.set("cuts", filters.cuts.join(","));
    }
    if (filters.clarities?.length) {
      params.set("clarities", filters.clarities.join(","));
    }
    if (filters.origins?.length) {
      params.set("origins", filters.origins.join(","));
    }

    // Range filters
    if (filters.priceRange) {
      params.set("priceMin", filters.priceRange.min.toString());
      params.set("priceMax", filters.priceRange.max.toString());
    }
    if (filters.weightRange) {
      params.set("weightMin", filters.weightRange.min.toString());
      params.set("weightMax", filters.weightRange.max.toString());
    }

    // Boolean filters
    if (filters.inStockOnly) {
      params.set("inStockOnly", "true");
    }
    if (filters.hasImages) {
      params.set("hasImages", "true");
    }
    if (filters.hasCertification) {
      params.set("hasCertification", "true");
    }
    if (filters.hasAIAnalysis) {
      params.set("hasAIAnalysis", "true");
    }

    // Sorting
    if (filters.sortBy) {
      params.set("sortBy", filters.sortBy);
    }
    if (filters.sortDirection) {
      params.set("sortDirection", filters.sortDirection);
    }

    return params;
  }

  /**
   * Build filter counts query
   * Used for fetching available filter options
   */
  static buildFilterCountsQuery(): RequestInit {
    return {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "counts" }),
    };
  }

  /**
   * Build related gemstones query
   * Used for "You might also like" sections
   */
  static buildRelatedQuery(
    criteria: RelatedGemstonesCriteria,
    pageSize: number = 8
  ): URLSearchParams {
    const params = new URLSearchParams();

    params.set("gemstoneTypes", criteria.gemstoneType);
    params.set("colors", criteria.color);
    params.set("priceMin", criteria.priceRange.min.toString());
    params.set("priceMax", criteria.priceRange.max.toString());
    params.set("pageSize", (criteria.limit || pageSize).toString());
    params.set("page", "1");
    params.set("inStockOnly", "true");

    return params;
  }

  /**
   * Parse query string back to filters
   * Used for URL state restoration
   */
  static parseQueryToFilters(query: URLSearchParams): AdvancedGemstoneFilters {
    const filters: Partial<AdvancedGemstoneFilters> = {};

    // Text search
    const search = query.get("search");
    if (search) filters.search = search;

    // Categorical filters
    const gemstoneTypes = query.get("gemstoneTypes");
    if (gemstoneTypes) {
      filters.gemstoneTypes = gemstoneTypes.split(",") as any[];
    }

    const colors = query.get("colors");
    if (colors) {
      filters.colors = colors.split(",") as any[];
    }

    const cuts = query.get("cuts");
    if (cuts) {
      filters.cuts = cuts.split(",") as any[];
    }

    const clarities = query.get("clarities");
    if (clarities) {
      filters.clarities = clarities.split(",") as any[];
    }

    const origins = query.get("origins");
    if (origins) {
      filters.origins = origins.split(",");
    }

    // Range filters
    const priceMin = query.get("priceMin");
    const priceMax = query.get("priceMax");
    if (priceMin && priceMax) {
      filters.priceRange = {
        min: parseFloat(priceMin),
        max: parseFloat(priceMax),
        currency: "USD",
      };
    }

    const weightMin = query.get("weightMin");
    const weightMax = query.get("weightMax");
    if (weightMin && weightMax) {
      filters.weightRange = {
        min: parseFloat(weightMin),
        max: parseFloat(weightMax),
      };
    }

    // Boolean filters
    if (query.get("inStockOnly") === "true") {
      filters.inStockOnly = true;
    }
    if (query.get("hasImages") === "true") {
      filters.hasImages = true;
    }
    if (query.get("hasCertification") === "true") {
      filters.hasCertification = true;
    }
    if (query.get("hasAIAnalysis") === "true") {
      filters.hasAIAnalysis = true;
    }

    // Sorting
    const sortBy = query.get("sortBy");
    if (sortBy) {
      filters.sortBy = sortBy as any;
    }
    const sortDirection = query.get("sortDirection");
    if (sortDirection) {
      filters.sortDirection = sortDirection as "asc" | "desc";
    }

    return filters;
  }
}
