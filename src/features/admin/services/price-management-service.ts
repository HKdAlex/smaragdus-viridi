"use client";

// Simple logger for now
const logger = {
  info: (message: string, data?: any) =>
    console.log(`[ADMIN-PRICE] ${message}`, data),
  error: (message: string, error?: any) =>
    console.error(`[ADMIN-PRICE ERROR] ${message}`, error),
  warn: (message: string, data?: any) =>
    console.warn(`[ADMIN-PRICE WARN] ${message}`, data),
};

export interface PriceUpdateData {
  gemstoneId: string;
  regularPrice?: number;
  premiumPrice?: number;
  currency: string;
  reason?: string;
}

export interface BulkPriceUpdate {
  gemstoneIds: string[];
  priceIncrease?: number; // percentage
  fixedPrice?: number;
  currency: string;
  reason: string;
}

export interface PriceHistoryEntry {
  id: string;
  gemstone_id: string;
  old_price: number;
  new_price: number;
  currency: string;
  change_type: "manual" | "bulk" | "system";
  reason?: string;
  created_at: string;
  created_by?: string;
}

export interface PriceAnalytics {
  averagePrice: number;
  priceRange: { min: number; max: number };
  priceDistribution: { range: string; count: number }[];
  recentChanges: PriceHistoryEntry[];
  currencyBreakdown: { currency: string; count: number; avgPrice: number }[];
}

export class PriceManagementService {
  /**
   * Update pricing for a single gemstone
   */
  static async updateGemstonePrice(
    gemstoneId: string,
    updateData: PriceUpdateData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info("Updating gemstone price", {
        gemstoneId,
        updateData: {
          ...updateData,
          reason: updateData.reason || "Manual update",
        },
      });

      const response = await fetch("/api/admin/gemstones/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gemstoneId,
          regularPrice: updateData.regularPrice,
          premiumPrice: updateData.premiumPrice,
          currency: updateData.currency,
          reason: updateData.reason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error("Failed to update gemstone price", result);
        return { success: false, error: result.error || "Update failed" };
      }

      logger.info("Gemstone price updated successfully", { gemstoneId });
      return { success: true };
    } catch (error) {
      logger.error("Unexpected error updating price", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Bulk update prices for multiple gemstones
   */
  static async bulkUpdatePrices(updates: BulkPriceUpdate): Promise<{
    success: boolean;
    updated: number;
    failed: number;
    error?: string;
  }> {
    try {
      logger.info("Starting bulk price update", {
        count: updates.gemstoneIds.length,
        updates,
      });

      const response = await fetch("/api/admin/gemstones/pricing", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gemstoneIds: updates.gemstoneIds,
          priceIncrease: updates.priceIncrease,
          fixedPrice: updates.fixedPrice,
            currency: updates.currency,
            reason: updates.reason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error("Bulk price update failed", result);
        return {
          success: false,
          updated: 0,
          failed: updates.gemstoneIds.length,
          error: result.error || "Bulk update failed",
        };
      }

      logger.info("Bulk price update completed", {
        total: updates.gemstoneIds.length,
        updated: result.updated,
        failed: result.failed,
      });

      return {
        success: true,
        updated: result.updated ?? 0,
        failed: result.failed ?? 0,
      };
    } catch (error) {
      logger.error("Unexpected error in bulk price update", error as Error);
      return {
        success: false,
        updated: 0,
        failed: updates.gemstoneIds.length,
        error: "An unexpected error occurred",
      };
    }
  }

  /**
   * Get price analytics
   */
  static async getPriceAnalytics(): Promise<{
    success: boolean;
    data?: PriceAnalytics;
    error?: string;
  }> {
    try {
      logger.info("Fetching price analytics");

      const response = await fetch("/api/admin/gemstones/pricing");
      const result = await response.json();

      if (!response.ok) {
        logger.error("Price analytics request failed", result);
        return { success: false, error: result.error || "Analytics failed" };
      }

      logger.info("Price analytics calculated", {
        gemstoneCount: result.data?.currencyBreakdown?.length ?? 0,
        averagePrice: result.data?.averagePrice,
      });

      return { success: true, data: result.data as PriceAnalytics };
    } catch (error) {
      logger.error("Unexpected error fetching price analytics", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Get price history for a gemstone
   */
  static async getGemstonePriceHistory(
    gemstoneId: string
  ): Promise<{ success: boolean; data?: PriceHistoryEntry[]; error?: string }> {
    try {
      logger.info("Fetching price history", { gemstoneId });

      // For now, return mock data - would need a proper price_history table
      const mockHistory: PriceHistoryEntry[] = [
        {
          id: "1",
          gemstone_id: gemstoneId,
          old_price: 1000,
          new_price: 1200,
          currency: "USD",
          change_type: "manual",
          reason: "Market adjustment",
          created_at: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          created_by: "admin",
        },
        {
          id: "2",
          gemstone_id: gemstoneId,
          old_price: 1200,
          new_price: 1100,
          currency: "USD",
          change_type: "bulk",
          reason: "Seasonal discount",
          created_at: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
          created_by: "admin",
        },
      ];

      return { success: true, data: mockHistory };
    } catch (error) {
      logger.error("Unexpected error fetching price history", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }
}
