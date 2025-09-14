import type { DatabaseGemstone } from "@/shared/types";
import { supabaseAdmin } from "@/lib/supabase";

// Simple logger for now
const logger = {
  info: (message: string, data?: any) =>
    console.log(`[ADMIN-INVENTORY] ${message}`, data),
  error: (message: string, error?: any) =>
    console.error(`[ADMIN-INVENTORY ERROR] ${message}`, error),
  warn: (message: string, data?: any) =>
    console.warn(`[ADMIN-INVENTORY WARN] ${message}`, data),
};

export interface InventoryUpdateData {
  gemstoneId: string;
  inStock: boolean;
  deliveryDays?: number;
  reason?: string;
}

export interface BulkInventoryUpdate {
  gemstoneIds: string[];
  inStock: boolean;
  deliveryDays?: number;
  reason: string;
}

export interface InventoryAlert {
  id: string;
  gemstone_id: string;
  alert_type: "low_stock" | "out_of_stock" | "back_in_stock";
  message: string;
  created_at: string;
  resolved_at?: string;
  is_active: boolean;
}

export interface InventoryStats {
  totalGemstones: number;
  inStock: number;
  outOfStock: number;
  lowStock: number; // Assuming low stock threshold
  totalValue: number;
  averageValue: number;
  alerts: InventoryAlert[];
}

export interface InventoryReport {
  stats: InventoryStats;
  topValued: DatabaseGemstone[];
  outOfStock: DatabaseGemstone[];
  lowStock: DatabaseGemstone[];
  recentUpdates: DatabaseGemstone[];
}

export class InventoryManagementService {
  private static readonly LOW_STOCK_THRESHOLD = 5; // Consider implementing dynamic thresholds

  /**
   * Update inventory for a single gemstone
   */
  static async updateGemstoneInventory(
    gemstoneId: string,
    updateData: InventoryUpdateData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info("Updating gemstone inventory", {
        gemstoneId,
        updateData: {
          ...updateData,
          reason: updateData.reason || "Manual update",
        },
      });

      // Get current inventory status for audit trail
      const { data: currentGemstone } = await supabaseAdmin!
        .from("gemstones")
        .select("in_stock, delivery_days")
        .eq("id", gemstoneId)
        .single();

      if (!currentGemstone) {
        return { success: false, error: "Gemstone not found" };
      }

      // Handle null to boolean conversion
      const currentStockStatus = currentGemstone.in_stock ?? false;

      // Prepare update data
      const updatePayload: any = {
        in_stock: updateData.inStock,
        updated_at: new Date().toISOString(),
      };

      if (updateData.deliveryDays !== undefined) {
        updatePayload.delivery_days = updateData.deliveryDays;
      }

      // Update the gemstone
      const { error } = await supabaseAdmin!
        .from("gemstones")
        .update(updatePayload)
        .eq("id", gemstoneId);

      if (error) {
        logger.error("Failed to update gemstone inventory", error);
        return { success: false, error: error.message };
      }

      // Create alerts based on stock changes
      await this.handleStockChangeAlerts(
        gemstoneId,
        {
          in_stock: currentStockStatus,
          delivery_days: currentGemstone.delivery_days ?? undefined,
        },
        updateData
      );

      logger.info("Gemstone inventory updated successfully", { gemstoneId });
      return { success: true };
    } catch (error) {
      logger.error("Unexpected error updating inventory", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Bulk update inventory for multiple gemstones
   */
  static async bulkUpdateInventory(
    updates: BulkInventoryUpdate
  ): Promise<{
    success: boolean;
    updated: number;
    failed: number;
    error?: string;
  }> {
    try {
      logger.info("Starting bulk inventory update", {
        count: updates.gemstoneIds.length,
        updates,
      });

      let updated = 0;
      let failed = 0;

      for (const gemstoneId of updates.gemstoneIds) {
        try {
          const updateResult = await this.updateGemstoneInventory(gemstoneId, {
            gemstoneId,
            inStock: updates.inStock,
            deliveryDays: updates.deliveryDays,
            reason: updates.reason,
          });

          if (updateResult.success) {
            updated++;
          } else {
            failed++;
          }
        } catch (error) {
          logger.error(
            "Failed to update gemstone in bulk inventory operation",
            {
              gemstoneId,
              error: error as Error,
            }
          );
          failed++;
        }
      }

      logger.info("Bulk inventory update completed", {
        total: updates.gemstoneIds.length,
        updated,
        failed,
      });

      return { success: true, updated, failed };
    } catch (error) {
      logger.error("Unexpected error in bulk inventory update", error as Error);
      return {
        success: false,
        updated: 0,
        failed: updates.gemstoneIds.length,
        error: "An unexpected error occurred",
      };
    }
  }

  /**
   * Get comprehensive inventory report
   */
  static async getInventoryReport(): Promise<{
    success: boolean;
    data?: InventoryReport;
    error?: string;
  }> {
    try {
      logger.info("Generating inventory report");

      // Get all gemstones
      const { data: gemstones, error } = await supabaseAdmin!
        .from("gemstones")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!gemstones) {
        return {
          success: true,
          data: {
            stats: {
              totalGemstones: 0,
              inStock: 0,
              outOfStock: 0,
              lowStock: 0,
              totalValue: 0,
              averageValue: 0,
              alerts: [],
            },
            topValued: [],
            outOfStock: [],
            lowStock: [],
            recentUpdates: [],
          },
        };
      }

      // Calculate statistics
      const inStock = gemstones.filter((g) => g.in_stock).length;
      const outOfStock = gemstones.filter((g) => !g.in_stock).length;
      const lowStock = gemstones.filter(
        (g) => g.in_stock && this.isLowStock(g)
      ).length;
      const totalValue = gemstones.reduce((sum, g) => sum + g.price_amount, 0);
      const averageValue = totalValue / gemstones.length;

      // Get alerts (mock data for now)
      const alerts: InventoryAlert[] = gemstones
        .filter((g) => !g.in_stock)
        .map((g) => ({
          id: `alert-${g.id}`,
          gemstone_id: g.id,
          alert_type: "out_of_stock" as const,
          message: `${g.name} ${g.color} ${g.cut} is out of stock`,
          created_at: g.updated_at || "",
          is_active: true,
        }));

      // Top valued gemstones
      const topValued = [...gemstones]
        .sort((a, b) => b.price_amount - a.price_amount)
        .slice(0, 10);

      // Out of stock gemstones
      const outOfStockGems = gemstones.filter((g) => !g.in_stock);

      // Low stock gemstones
      const lowStockGems = gemstones.filter(
        (g) => g.in_stock && this.isLowStock(g)
      );

      // Recent updates
      const recentUpdates = gemstones
        .filter((g) => {
          const updatedAt = new Date(g.updated_at || "");
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return updatedAt > weekAgo;
        })
        .slice(0, 20);

      const stats: InventoryStats = {
        totalGemstones: gemstones.length,
        inStock,
        outOfStock,
        lowStock,
        totalValue,
        averageValue: Math.round(averageValue),
        alerts,
      };

      const report: InventoryReport = {
        stats,
        topValued,
        outOfStock: outOfStockGems,
        lowStock: lowStockGems,
        recentUpdates,
      };

      logger.info("Inventory report generated", {
        totalGemstones: stats.totalGemstones,
        inStock: stats.inStock,
        outOfStock: stats.outOfStock,
        totalValue: stats.totalValue,
      });

      return { success: true, data: report };
    } catch (error) {
      logger.error(
        "Unexpected error generating inventory report",
        error as Error
      );
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Get active inventory alerts
   */
  static async getActiveAlerts(): Promise<{
    success: boolean;
    data?: InventoryAlert[];
    error?: string;
  }> {
    try {
      logger.info("Fetching active inventory alerts");

      // Get out of stock gemstones as alerts
      const { data: outOfStockGems, error } = await supabaseAdmin!
        .from("gemstones")
        .select("id, name, color, cut, updated_at")
        .eq("in_stock", false)
        .order("updated_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const alerts: InventoryAlert[] = (outOfStockGems || []).map((gem) => ({
        id: `alert-${gem.id}`,
        gemstone_id: gem.id,
        alert_type: "out_of_stock" as const,
        message: `${gem.name} ${gem.color} ${gem.cut} is out of stock`,
        created_at: gem.updated_at || "",
        is_active: true,
      }));

      return { success: true, data: alerts };
    } catch (error) {
      logger.error("Unexpected error fetching alerts", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Handle stock change alerts
   */
  private static async handleStockChangeAlerts(
    gemstoneId: string,
    oldData: { in_stock: boolean; delivery_days?: number },
    newData: InventoryUpdateData
  ): Promise<void> {
    try {
      const { data: gemstone } = await supabaseAdmin!
        .from("gemstones")
        .select("name, color, cut")
        .eq("id", gemstoneId)
        .single();

      if (!gemstone) return;

      // Create alert based on stock change
      let alertType: InventoryAlert["alert_type"];
      let message: string;

      if (!oldData.in_stock && newData.inStock) {
        alertType = "back_in_stock";
        message = `${gemstone.name} ${gemstone.color} ${gemstone.cut} is back in stock`;
      } else if (oldData.in_stock && !newData.inStock) {
        alertType = "out_of_stock";
        message = `${gemstone.name} ${gemstone.color} ${gemstone.cut} is now out of stock`;
      } else {
        return; // No stock status change
      }

      logger.info("Stock alert created", {
        gemstoneId,
        alertType,
        message,
      });

      // In a real implementation, you would save this to an alerts table
      // For now, just log the alert
    } catch (error) {
      logger.error("Failed to handle stock change alerts", error as Error);
    }
  }

  /**
   * Check if gemstone is low on stock (placeholder logic)
   */
  private static isLowStock(gemstone: DatabaseGemstone): boolean {
    // This would be based on actual stock levels when implemented
    // For now, return false as we don't have stock quantity fields
    return false;
  }

  /**
   * Get inventory forecast (placeholder)
   */
  static async getInventoryForecast(
    daysAhead: number = 30
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      logger.info("Generating inventory forecast", { daysAhead });

      // Mock forecast data
      const forecast = {
        projectedStockLevels: [],
        recommendedOrders: [],
        riskAssessments: [],
        timeRange: `${daysAhead} days`,
      };

      return { success: true, data: forecast };
    } catch (error) {
      logger.error("Unexpected error generating forecast", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }
}
