/**
 * SearchAnalyticsService Unit Tests
 *
 * Tests tracking and retrieval of search analytics data
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { SearchAnalyticsService } from "../analytics.service";
import type { TrackSearchParams } from "../analytics.service";

// Mock supabaseAdmin!
vi.mock("@/lib/supabase", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        error: null,
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
    rpc: vi.fn(() => ({
      data: [],
      error: null,
    })),
  },
}));

describe("SearchAnalyticsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trackSearch", () => {
    it("should track a search query successfully", async () => {
      const params: TrackSearchParams = {
        query: "ruby",
        filters: { color: "red" },
        resultsCount: 15,
        usedFuzzySearch: false,
        userId: "user-123",
        sessionId: "session-456",
      };

      // Should not throw
      await expect(
        SearchAnalyticsService.trackSearch(params)
      ).resolves.toBeUndefined();
    });

    it("should handle tracking without optional fields", async () => {
      const params: TrackSearchParams = {
        query: "sapphire",
        resultsCount: 8,
        usedFuzzySearch: true,
      };

      await expect(
        SearchAnalyticsService.trackSearch(params)
      ).resolves.toBeUndefined();
    });

    it("should normalize query to lowercase", async () => {
      const { supabaseAdmin } = await import("@/lib/supabase");
      const insertMock = vi.fn(() => ({ error: null }));

      vi.mocked(supabaseAdmin!!.from).mockReturnValue({
        insert: insertMock,
      } as any);

      await SearchAnalyticsService.trackSearch({
        query: "DIAMOND",
        resultsCount: 5,
        usedFuzzySearch: false,
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          search_query: "diamond",
        })
      );
    });

    it("should not throw on tracking error", async () => {
      const { supabaseAdmin } = await import("@/lib/supabase");
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      vi.mocked(supabaseAdmin!.from).mockReturnValue({
        insert: vi.fn(() => ({ error: { message: "Database error" } })),
      } as any);

      await expect(
        SearchAnalyticsService.trackSearch({
          query: "test",
          resultsCount: 0,
          usedFuzzySearch: false,
        })
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("getAnalyticsSummary", () => {
    it("should fetch analytics summary with default days", async () => {
      const mockData = [
        {
          search_query: "ruby",
          search_count: 100,
          avg_results: 15,
          zero_result_count: 5,
          fuzzy_usage_count: 10,
        },
      ];

      const { supabaseAdmin } = await import("@/lib/supabase");
      vi.mocked(supabaseAdmin!.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await SearchAnalyticsService.getAnalyticsSummary();

      expect(supabaseAdmin!.rpc).toHaveBeenCalledWith(
        "get_search_analytics_summary",
        { days_back: 30 }
      );
      expect(result).toEqual(mockData);
    });

    it("should fetch analytics summary with custom days", async () => {
      const { supabaseAdmin } = await import("@/lib/supabase");

      await SearchAnalyticsService.getAnalyticsSummary(7);

      expect(supabaseAdmin!.rpc).toHaveBeenCalledWith(
        "get_search_analytics_summary",
        { days_back: 7 }
      );
    });

    it("should throw on RPC error", async () => {
      const { supabaseAdmin } = await import("@/lib/supabase");
      vi.mocked(supabaseAdmin!.rpc).mockResolvedValue({
        data: null,
        error: { message: "Permission denied" },
      } as any);

      await expect(
        SearchAnalyticsService.getAnalyticsSummary()
      ).rejects.toThrow("Failed to get analytics summary");
    });
  });

  describe("getSearchTrends", () => {
    it("should fetch search trends with default parameters", async () => {
      const mockData = [
        {
          time_bucket: "2024-10-14",
          search_count: 50,
          avg_results: 12,
          zero_result_count: 3,
          fuzzy_usage_count: 5,
        },
      ];

      const { supabaseAdmin } = await import("@/lib/supabase");
      vi.mocked(supabaseAdmin!.rpc).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await SearchAnalyticsService.getSearchTrends();

      expect(supabaseAdmin!.rpc).toHaveBeenCalledWith("get_search_trends", {
        days_back: 30,
        time_bucket: "day",
      });
      expect(result).toEqual(mockData);
    });

    it("should fetch search trends with custom parameters", async () => {
      const { supabaseAdmin } = await import("@/lib/supabase");

      await SearchAnalyticsService.getSearchTrends(7, "hour");

      expect(supabaseAdmin!.rpc).toHaveBeenCalledWith("get_search_trends", {
        days_back: 7,
        time_bucket: "hour",
      });
    });
  });

  describe("getAnalyticsMetrics", () => {
    it("should calculate comprehensive metrics from summary", async () => {
      const mockSummary = [
        {
          search_query: "ruby",
          search_count: 100,
          avg_results: 20,
          zero_result_count: 5,
          fuzzy_usage_count: 10,
        },
        {
          search_query: "sapphire",
          search_count: 80,
          avg_results: 15,
          zero_result_count: 10,
          fuzzy_usage_count: 5,
        },
        {
          search_query: "diamond",
          search_count: 60,
          avg_results: 25,
          zero_result_count: 0,
          fuzzy_usage_count: 2,
        },
      ];

      const { supabaseAdmin } = await import("@/lib/supabase");
      vi.mocked(supabaseAdmin!.rpc).mockResolvedValue({
        data: mockSummary,
        error: null,
      } as any);

      const metrics = await SearchAnalyticsService.getAnalyticsMetrics(30);

      expect(metrics.totalSearches).toBe(240);
      expect(metrics.uniqueQueries).toBe(3);
      expect(metrics.topQueries).toHaveLength(3);
      expect(metrics.zeroResultQueries).toHaveLength(2);
      expect(metrics.zeroResultPercentage).toBeGreaterThan(0);
      expect(metrics.fuzzySearchUsage).toBeGreaterThan(0);
    });

    it("should handle empty summary data", async () => {
      const { supabaseAdmin } = await import("@/lib/supabase");
      vi.mocked(supabaseAdmin!.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const metrics = await SearchAnalyticsService.getAnalyticsMetrics(30);

      expect(metrics.totalSearches).toBe(0);
      expect(metrics.uniqueQueries).toBe(0);
      expect(metrics.avgResultsPerSearch).toBe(0);
      expect(metrics.zeroResultPercentage).toBe(0);
      expect(metrics.fuzzySearchUsage).toBe(0);
    });
  });

  describe("getUserSearchHistory", () => {
    it("should fetch user search history", async () => {
      const mockData = [
        {
          search_query: "ruby",
          results_count: 15,
          used_fuzzy_search: false,
          created_at: "2024-10-14T10:00:00Z",
        },
        {
          search_query: "sapphire",
          results_count: 8,
          used_fuzzy_search: true,
          created_at: "2024-10-14T09:00:00Z",
        },
      ];

      const { supabaseAdmin } = await import("@/lib/supabase");
      const limitMock = vi.fn(() => ({
        data: mockData,
        error: null,
      }));
      const orderMock = vi.fn(() => ({
        limit: limitMock,
      }));
      const eqMock = vi.fn(() => ({
        order: orderMock,
      }));
      const selectMock = vi.fn(() => ({
        eq: eqMock,
      }));

      vi.mocked(supabaseAdmin!.from).mockReturnValue({
        select: selectMock,
      } as any);

      const result = await SearchAnalyticsService.getUserSearchHistory(
        "user-123"
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        query: "ruby",
        resultsCount: 15,
        usedFuzzy: false,
        timestamp: "2024-10-14T10:00:00Z",
      });
    });

    it("should respect custom limit", async () => {
      const { supabaseAdmin } = await import("@/lib/supabase");
      const limitMock = vi.fn(() => ({
        data: [],
        error: null,
      }));

      vi.mocked(supabaseAdmin!.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: limitMock,
            })),
          })),
        })),
      } as any);

      await SearchAnalyticsService.getUserSearchHistory("user-123", 10);

      expect(limitMock).toHaveBeenCalledWith(10);
    });
  });
});
