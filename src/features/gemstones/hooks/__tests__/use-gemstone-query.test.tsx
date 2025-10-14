/**
 * Unit Tests: useGemstoneQuery Hook
 *
 * Tests React Query integration for gemstone fetching
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import type { AdvancedGemstoneFilters } from "../../types/filter.types";
import { GemstoneFetchService } from "../../services/gemstone-fetch.service";
import React from "react";
import { useGemstoneQuery } from "../use-gemstone-query";

// Mock the service
vi.mock("../../services/gemstone-fetch.service", () => ({
  GemstoneFetchService: {
    fetchGemstones: vi.fn(),
  },
}));

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
    const mockData = {
      data: [
        { id: "1", name: "ruby", weight_carats: 1.5 },
        { id: "2", name: "sapphire", weight_carats: 2.0 },
      ],
      pagination: {
        page: 1,
        pageSize: 24,
        totalItems: 2,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
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
    const mockData = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 24,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
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
    const mockData = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 24,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
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
