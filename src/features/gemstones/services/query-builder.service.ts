/**
 * Query Builder Service
 *
 * Handles conversion between filters and URL query strings.
 * Single source of truth for URL state management.
 */

import type {
  AdvancedGemstoneFilters,
  MutableAdvancedGemstoneFilters,
} from "../types/filter.types";
import {
  parseGemClarities,
  parseGemColors,
  parseGemCuts,
  parseGemstoneTypes,
  parseSortBy,
  parseSortDirection,
} from "@/lib/validators/enum-parser";

export class QueryBuilderService {
  /**
   * Convert filters to URL query string
   */
  static filtersToQueryString(filters: AdvancedGemstoneFilters): string {
    const params = new URLSearchParams();

    // Text search
    if (filters.search) {
      params.set("search", filters.search);
    }

    // Categorical filters (arrays)
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

    return params.toString();
  }

  /**
   * Parse query string back to filters
   * Used for URL state restoration
   */
  static parseQueryToFilters(query: URLSearchParams): AdvancedGemstoneFilters {
    const result: MutableAdvancedGemstoneFilters = {};

    // Text search
    const search = query.get("search");
    if (search) result.search = search;

    // Categorical filters
    const gemstoneTypes = query.get("gemstoneTypes");
    if (gemstoneTypes) {
      result.gemstoneTypes = parseGemstoneTypes(gemstoneTypes);
    }

    const colors = query.get("colors");
    if (colors) {
      result.colors = parseGemColors(colors);
    }

    const cuts = query.get("cuts");
    if (cuts) {
      result.cuts = parseGemCuts(cuts);
    }

    const clarities = query.get("clarities");
    if (clarities) {
      result.clarities = parseGemClarities(clarities);
    }

    const origins = query.get("origins");
    if (origins) {
      result.origins = origins.split(",");
    }

    // Range filters
    const priceMin = query.get("priceMin");
    const priceMax = query.get("priceMax");
    if (priceMin && priceMax) {
      result.priceRange = {
        min: parseFloat(priceMin),
        max: parseFloat(priceMax),
        currency: "USD",
      };
    }

    const weightMin = query.get("weightMin");
    const weightMax = query.get("weightMax");
    if (weightMin && weightMax) {
      result.weightRange = {
        min: parseFloat(weightMin),
        max: parseFloat(weightMax),
      };
    }

    // Boolean filters
    if (query.get("inStockOnly") === "true") {
      result.inStockOnly = true;
    }
    if (query.get("hasImages") === "true") {
      result.hasImages = true;
    }
    if (query.get("hasCertification") === "true") {
      result.hasCertification = true;
    }
    if (query.get("hasAIAnalysis") === "true") {
      result.hasAIAnalysis = true;
    }

    // Sorting
    const sortBy = query.get("sortBy");
    if (sortBy) {
      result.sortBy = parseSortBy(sortBy);
    }
    const sortDirection = query.get("sortDirection");
    if (sortDirection) {
      result.sortDirection = parseSortDirection(sortDirection);
    }

    // Return as read-only AdvancedGemstoneFilters
    return result;
  }
}
