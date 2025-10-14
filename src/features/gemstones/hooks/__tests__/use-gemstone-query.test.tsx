/**
 * Unit Tests: useGemstoneQuery Hook
 *
 * Tests React Query integration for gemstone fetching
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import type { AdvancedGemstoneFilters } from "../../types/filter.types";
import type {
  CatalogGemstone,
  FetchGemstonesResult,
} from "../../services/gemstone-fetch.service";
import { GemstoneFetchService } from "../../services/gemstone-fetch.service";
import React from "react";
import { useGemstoneQuery } from "../use-gemstone-query";

// Mock the service
vi.mock("../../services/gemstone-fetch.service", () => ({
  GemstoneFetchService: {
    fetchGemstones: vi.fn(),
  },
}));

const baseGemstone: CatalogGemstone = {
  id: "gem-1",
  name: "ruby",
  type_code: "ruby",
  color: "red",
  color_code: "red",
  cut: "round",
  cut_code: "round",
  clarity: "VS1",
  clarity_code: "VS1",
  weight_carats: 1,
  length_mm: 1,
  width_mm: 1,
  depth_mm: 1,
  price_amount: 1000,
  price_currency: "USD",
  premium_price_amount: null,
  premium_price_currency: null,
  price_per_carat: null,
  quantity: 1,
  in_stock: true,
  delivery_days: null,
  internal_code: null,
  serial_number: "SER-1",
  origin_id: null,
  ai_analyzed: null,
  ai_confidence_score: null,
  ai_analysis_date: null,
  ai_data_completeness: null,
  metadata_status: null,
  description: null,
  promotional_text: null,
  marketing_highlights: null,
  import_batch_id: null,
  import_folder_path: null,
  import_notes: null,
  created_at: null,
  updated_at: null,
  search_vector_en: null,
  search_vector_ru: null,
  description_vector_en: null,
  description_vector_ru: null,
};

const createMockGemstone = (
  overrides: Partial<CatalogGemstone> = {}
): CatalogGemstone => {
  const gemstone = {
    ...baseGemstone,
    ...overrides,
  };

  return {
    ...gemstone,
    type_code: overrides.type_code ?? gemstone.name,
    color_code: overrides.color_code ?? gemstone.color,
    cut_code: overrides.cut_code ?? gemstone.cut,
    clarity_code: overrides.clarity_code ?? gemstone.clarity,
  };
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGemstoneQuery", () => {
  it("should fetch gemstones with filters", async () => {
    const mockData: FetchGemstonesResult = {
      data: [
        createMockGemstone({
          id: "1",
          name: "ruby",
          type_code: "ruby",
          color: "red",
          color_code: "red",
          weight_carats: 1.5,
          serial_number: "SER-1",
        }),
        createMockGemstone({
          id: "2",
          name: "sapphire",
          type_code: "sapphire",
          color: "blue",
          color_code: "blue",
          weight_carats: 2,
          serial_number: "SER-2",
        }),
      ],
      pagination: {
        page: 1,
        pageSize: 24,
        totalItems: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {},
    };

    vi.mocked(GemstoneFetchService.fetchGemstones).mockResolvedValue(mockData);

    const filters: AdvancedGemstoneFilters = {
      gemstoneTypes: ["ruby"],
    };

    const { result } = renderHook(() => useGemstoneQuery(filters, 1, 24), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(GemstoneFetchService.fetchGemstones).toHaveBeenCalledWith({
      ...filters,
      page: 1,
      pageSize: 24,
    });
  });

  it("should handle errors gracefully", async () => {
    vi.mocked(GemstoneFetchService.fetchGemstones).mockRejectedValue(
      new Error("API Error")
    );

    const { result } = renderHook(() => useGemstoneQuery({}, 1, 24), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it("should cache results with correct query key", async () => {
    const mockData: FetchGemstonesResult = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 24,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {},
    };

    vi.mocked(GemstoneFetchService.fetchGemstones).mockResolvedValue(mockData);

    const filters: AdvancedGemstoneFilters = {
      search: "ruby",
    };

    const { result, rerender } = renderHook(
      ({ f, p }) => useGemstoneQuery(f, p, 24),
      {
        wrapper: createWrapper(),
        initialProps: { f: filters, p: 1 },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Service should be called once
    expect(GemstoneFetchService.fetchGemstones).toHaveBeenCalledTimes(1);

    // Re-render with same filters should use cache
    rerender({ f: filters, p: 1 });

    // Should still only have been called once (using cache)
    expect(GemstoneFetchService.fetchGemstones).toHaveBeenCalledTimes(1);
  });

  it("should refetch when filters change", async () => {
    const mockData: FetchGemstonesResult = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 24,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      filters: {},
    };

    vi.mocked(GemstoneFetchService.fetchGemstones).mockResolvedValue(mockData);

    const { result, rerender } = renderHook(
      ({ f, p }) => useGemstoneQuery(f, p, 24),
      {
        wrapper: createWrapper(),
        initialProps: { f: { search: "ruby" }, p: 1 },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Change filters
    rerender({ f: { search: "sapphire" }, p: 1 });

    // Should fetch again with new filters
    await waitFor(() => {
      expect(GemstoneFetchService.fetchGemstones).toHaveBeenCalledTimes(2);
    });
  });
});
