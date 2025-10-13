/**
 * Query Builder Service Tests
 *
 * Unit tests for QueryBuilderService following clean-code principles.
 */

import { describe, expect, it } from "vitest";

import type { AdvancedGemstoneFilters } from "../../types/filter.types";
import { QueryBuilderService } from "../query-builder.service";

describe("QueryBuilderService", () => {
  describe("buildSearchQuery", () => {
    it("should build query with pagination only", () => {
      const filters: AdvancedGemstoneFilters = {};
      const result = QueryBuilderService.buildSearchQuery(filters, 1, 24);

      expect(result.get("page")).toBe("1");
      expect(result.get("pageSize")).toBe("24");
    });

    it("should include search term", () => {
      const filters: AdvancedGemstoneFilters = {
        search: "emerald",
      };
      const result = QueryBuilderService.buildSearchQuery(filters, 1);

      expect(result.get("search")).toBe("emerald");
    });

    it("should include gemstone types", () => {
      const filters: AdvancedGemstoneFilters = {
        gemstoneTypes: ["emerald", "ruby"],
      };
      const result = QueryBuilderService.buildSearchQuery(filters, 1);

      expect(result.get("gemstoneTypes")).toBe("emerald,ruby");
    });

    it("should include colors", () => {
      const filters: AdvancedGemstoneFilters = {
        colors: ["green", "red"],
      };
      const result = QueryBuilderService.buildSearchQuery(filters, 1);

      expect(result.get("colors")).toBe("green,red");
    });

    it("should include price range", () => {
      const filters: AdvancedGemstoneFilters = {
        priceRange: {
          min: 10000,
          max: 50000,
          currency: "USD",
        },
      };
      const result = QueryBuilderService.buildSearchQuery(filters, 1);

      expect(result.get("priceMin")).toBe("10000");
      expect(result.get("priceMax")).toBe("50000");
    });

    it("should include weight range", () => {
      const filters: AdvancedGemstoneFilters = {
        weightRange: {
          min: 1.0,
          max: 5.0,
        },
      };
      const result = QueryBuilderService.buildSearchQuery(filters, 1);

      expect(result.get("weightMin")).toBe("1");
      expect(result.get("weightMax")).toBe("5");
    });

    it("should include boolean filters", () => {
      const filters: AdvancedGemstoneFilters = {
        inStockOnly: true,
        hasImages: true,
        hasCertification: true,
        hasAIAnalysis: true,
      };
      const result = QueryBuilderService.buildSearchQuery(filters, 1);

      expect(result.get("inStockOnly")).toBe("true");
      expect(result.get("hasImages")).toBe("true");
      expect(result.get("hasCertification")).toBe("true");
      expect(result.get("hasAIAnalysis")).toBe("true");
    });

    it("should include sorting", () => {
      const filters: AdvancedGemstoneFilters = {
        sortBy: "price_amount",
        sortDirection: "asc",
      };
      const result = QueryBuilderService.buildSearchQuery(filters, 1);

      expect(result.get("sortBy")).toBe("price_amount");
      expect(result.get("sortDirection")).toBe("asc");
    });

    it("should build complex query with all filters", () => {
      const filters: AdvancedGemstoneFilters = {
        search: "emerald",
        gemstoneTypes: ["emerald"],
        colors: ["green"],
        cuts: ["oval"],
        clarities: ["VVS1"],
        origins: ["Colombia"],
        priceRange: {
          min: 10000,
          max: 50000,
          currency: "USD",
        },
        weightRange: {
          min: 1.0,
          max: 5.0,
        },
        inStockOnly: true,
        sortBy: "created_at",
        sortDirection: "desc",
      };
      const result = QueryBuilderService.buildSearchQuery(filters, 2, 48);

      expect(result.get("page")).toBe("2");
      expect(result.get("pageSize")).toBe("48");
      expect(result.get("search")).toBe("emerald");
      expect(result.get("gemstoneTypes")).toBe("emerald");
      expect(result.get("colors")).toBe("green");
      expect(result.get("cuts")).toBe("oval");
      expect(result.get("clarities")).toBe("VVS1");
      expect(result.get("origins")).toBe("Colombia");
      expect(result.get("priceMin")).toBe("10000");
      expect(result.get("priceMax")).toBe("50000");
      expect(result.get("weightMin")).toBe("1");
      expect(result.get("weightMax")).toBe("5");
      expect(result.get("inStockOnly")).toBe("true");
      expect(result.get("sortBy")).toBe("created_at");
      expect(result.get("sortDirection")).toBe("desc");
    });
  });

  describe("parseQueryToFilters", () => {
    it("should parse search term", () => {
      const params = new URLSearchParams("search=emerald");
      const result = QueryBuilderService.parseQueryToFilters(params);

      expect(result.search).toBe("emerald");
    });

    it("should parse gemstone types", () => {
      const params = new URLSearchParams("gemstoneTypes=emerald,ruby");
      const result = QueryBuilderService.parseQueryToFilters(params);

      expect(result.gemstoneTypes).toEqual(["emerald", "ruby"]);
    });

    it("should parse price range", () => {
      const params = new URLSearchParams("priceMin=10000&priceMax=50000");
      const result = QueryBuilderService.parseQueryToFilters(params);

      expect(result.priceRange).toEqual({
        min: 10000,
        max: 50000,
        currency: "USD",
      });
    });

    it("should parse weight range", () => {
      const params = new URLSearchParams("weightMin=1&weightMax=5");
      const result = QueryBuilderService.parseQueryToFilters(params);

      expect(result.weightRange).toEqual({
        min: 1,
        max: 5,
      });
    });

    it("should parse boolean filters", () => {
      const params = new URLSearchParams(
        "inStockOnly=true&hasImages=true&hasCertification=true&hasAIAnalysis=true"
      );
      const result = QueryBuilderService.parseQueryToFilters(params);

      expect(result.inStockOnly).toBe(true);
      expect(result.hasImages).toBe(true);
      expect(result.hasCertification).toBe(true);
      expect(result.hasAIAnalysis).toBe(true);
    });

    it("should parse sorting", () => {
      const params = new URLSearchParams(
        "sortBy=price_amount&sortDirection=asc"
      );
      const result = QueryBuilderService.parseQueryToFilters(params);

      expect(result.sortBy).toBe("price_amount");
      expect(result.sortDirection).toBe("asc");
    });

    it("should handle empty query string", () => {
      const params = new URLSearchParams("");
      const result = QueryBuilderService.parseQueryToFilters(params);

      expect(result).toEqual({});
    });

    it("should roundtrip filters correctly", () => {
      const originalFilters: AdvancedGemstoneFilters = {
        search: "emerald",
        gemstoneTypes: ["emerald"],
        colors: ["green"],
        priceRange: {
          min: 10000,
          max: 50000,
          currency: "USD",
        },
        inStockOnly: true,
        sortBy: "price_amount",
        sortDirection: "asc",
      };

      const queryParams = QueryBuilderService.buildSearchQuery(
        originalFilters,
        1
      );
      const parsedFilters =
        QueryBuilderService.parseQueryToFilters(queryParams);

      // Compare relevant fields
      expect(parsedFilters.search).toBe(originalFilters.search);
      expect(parsedFilters.gemstoneTypes).toEqual(
        originalFilters.gemstoneTypes
      );
      expect(parsedFilters.colors).toEqual(originalFilters.colors);
      expect(parsedFilters.priceRange).toEqual(originalFilters.priceRange);
      expect(parsedFilters.inStockOnly).toBe(originalFilters.inStockOnly);
      expect(parsedFilters.sortBy).toBe(originalFilters.sortBy);
      expect(parsedFilters.sortDirection).toBe(originalFilters.sortDirection);
    });
  });

  describe("buildFilterCountsQuery", () => {
    it("should return POST request configuration", () => {
      const result = QueryBuilderService.buildFilterCountsQuery();

      expect(result.method).toBe("POST");
      expect(result.headers).toEqual({ "Content-Type": "application/json" });
      expect(result.body).toBe(JSON.stringify({ type: "counts" }));
    });
  });

  describe("buildRelatedQuery", () => {
    it("should build query for related gemstones", () => {
      const criteria = {
        currentGemstoneId: "123",
        gemstoneType: "emerald" as any,
        color: "green" as any,
        priceRange: {
          min: 5000,
          max: 15000,
        },
        limit: 8,
      };

      const result = QueryBuilderService.buildRelatedQuery(criteria);

      expect(result.get("gemstoneTypes")).toBe("emerald");
      expect(result.get("colors")).toBe("green");
      expect(result.get("priceMin")).toBe("5000");
      expect(result.get("priceMax")).toBe("15000");
      expect(result.get("pageSize")).toBe("8");
      expect(result.get("page")).toBe("1");
      expect(result.get("inStockOnly")).toBe("true");
    });

    it("should respect custom limit", () => {
      const criteria = {
        currentGemstoneId: "123",
        gemstoneType: "emerald" as any,
        color: "green" as any,
        priceRange: {
          min: 5000,
          max: 15000,
        },
        limit: 12,
      };

      const result = QueryBuilderService.buildRelatedQuery(criteria);

      expect(result.get("pageSize")).toBe("12");
    });

    it("should use default pageSize when no limit provided", () => {
      const criteria = {
        currentGemstoneId: "123",
        gemstoneType: "emerald" as any,
        color: "green" as any,
        priceRange: {
          min: 5000,
          max: 15000,
        },
      };

      const result = QueryBuilderService.buildRelatedQuery(criteria, 10);

      expect(result.get("pageSize")).toBe("10");
    });
  });
});
