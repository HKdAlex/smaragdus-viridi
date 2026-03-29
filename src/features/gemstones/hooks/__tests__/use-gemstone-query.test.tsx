/**
 * Unit Tests: useGemstoneQuery Hook
 *
 * Tests React Query integration for gemstone fetching
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
    CatalogGemstone,
    FetchGemstonesResult,
} from "../../services/gemstone-fetch.service";

import React from "react";
import { GemstoneFetchService } from "../../services/gemstone-fetch.service";
import type { AdvancedGemstoneFilters } from "../../types/filter.types";
import { useGemstoneQuery } from "../use-gemstone-query";

// Mock the service
vi.mock("../../services/gemstone-fetch.service", () => ({
  GemstoneFetchService: {
    fetchGemstones: vi.fn(),
  },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
}));

const baseGemstone: CatalogGemstone = {
  id: "gem-1",
  name: "ruby",
  type_code: "ruby",
  color: "red",
  color_code: "red",
  color_change_description: null,
  color_custom: null,
  cut: "round",
  cut_code: "round",
  cut_custom: null,
  cut_id: "00000000-0000-0000-0000-000000000001",
  cutting_country: null,
  clarity: "VS1",
  clarity_code: "VS1",
  clarity_custom: null,
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
  enhancement_notes: null,
  internal_code: null,
  mining_country: null,
  name_custom: null,
  quality_classification: null,
  serial_number: "SER-1",
  origin_id: null,
  ai_text_generated_v6: false,
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
  // Add missing AI fields
  ai_analysis_v5: false,
  ai_analysis_v5_date: null,
  ai_clarity: null,
  ai_color: null,
  ai_color_code: null,
  ai_color_description: null,
  ai_cut: null,
  ai_depth_mm: null,
  ai_description_cost_usd: null,
  ai_length_mm: null,
  ai_origin: null,
  ai_width_mm: null,
  ai_description_date: null,
  ai_description_model: null,
  ai_extracted_date: null,
  ai_extraction_confidence: null,
  ai_quality_grade: null,
  ai_text_generated_v6_date: null,
  ai_treatment: null,
  ai_weight_carats: null,
  primary_image_url: null,
  primary_video_url: null,
  treatment_status: null,
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
    cut_code: overrides.cut_code ?? gemstone.cut_code,
    clarity_code: overrides.clarity_code ?? gemstone.clarity,
  };
};

/** One shared client per test so React Query cache behaves as in production. */
const createTestEnv = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, TestWrapper };
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

    const { TestWrapper } = createTestEnv();
    const { result } = renderHook(() => useGemstoneQuery(filters, 1, 24), {
      wrapper: TestWrapper,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(GemstoneFetchService.fetchGemstones).toHaveBeenCalledWith({
      filters,
      page: 1,
      pageSize: 24,
      locale: "en",
    });
  });

  it("should handle errors gracefully", async () => {
    vi.mocked(GemstoneFetchService.fetchGemstones).mockRejectedValue(
      new Error("API Error")
    );

    const { TestWrapper } = createTestEnv();
    const { result } = renderHook(() => useGemstoneQuery({}, 1, 24), {
      wrapper: TestWrapper,
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

    const { TestWrapper } = createTestEnv();
    const { result, rerender } = renderHook(
      ({ f, p }) => useGemstoneQuery(f, p, 24),
      {
        wrapper: TestWrapper,
        initialProps: { f: filters, p: 1 },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const fetchCountAfterLoad =
      vi.mocked(GemstoneFetchService.fetchGemstones).mock.calls.length;

    // Re-render with same filters should use cache (Strict Mode may run mount effects more than once)
    rerender({ f: filters, p: 1 });

    expect(vi.mocked(GemstoneFetchService.fetchGemstones).mock.calls.length).toBe(
      fetchCountAfterLoad
    );
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

    const { TestWrapper } = createTestEnv();
    const { result, rerender } = renderHook(
      ({ f, p }) => useGemstoneQuery(f, p, 24),
      {
        wrapper: TestWrapper,
        initialProps: { f: { search: "ruby" }, p: 1 },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const fetchCountForRuby =
      vi.mocked(GemstoneFetchService.fetchGemstones).mock.calls.length;

    // Change filters
    rerender({ f: { search: "sapphire" }, p: 1 });

    await waitFor(() => {
      expect(
        vi.mocked(GemstoneFetchService.fetchGemstones).mock.calls.length
      ).toBeGreaterThan(fetchCountForRuby);
    });

    expect(GemstoneFetchService.fetchGemstones).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ search: "sapphire" }),
        page: 1,
        pageSize: 24,
        locale: "en",
      })
    );
  });
});
