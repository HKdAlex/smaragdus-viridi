"use client";

// Simple logger for statistics service
const logger = {
  info: (message: string, data?: any) =>
    console.log(`[STATISTICS INFO] ${message}`, data),
  error: (message: string, error?: any, data?: any) =>
    console.error(`[STATISTICS ERROR] ${message}`, error, data),
  warn: (message: string, data?: any) =>
    console.warn(`[STATISTICS WARN] ${message}`, data),
};

export interface DashboardStats {
  totalGemstones: number;
  activeUsers: number;
  totalRevenue: number;
  totalOrders: number;
  inStockGemstones: number;
  outOfStockGemstones: number;
  avgGemstonePrice: number;
  topSellingGemstones: Array<{
    id: string;
    serial_number: string;
    name: string;
    price_amount: number;
    price_currency: string;
  }>;
  recentOrders: Array<{
    id: string;
    user_id: string;
    total_amount: number;
    currency_code: string;
    created_at: string;
  }>;
}

export interface StatsChange {
  value: number;
  percentage: number;
  trend: "up" | "down" | "neutral";
}

export interface DashboardStatsWithChanges extends DashboardStats {
  changes: {
    totalGemstones: StatsChange;
    activeUsers: StatsChange;
    totalRevenue: StatsChange;
    totalOrders: StatsChange;
  };
}

export class StatisticsService {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats(): Promise<
    Result<DashboardStatsWithChanges, string>
  > {
    try {
      logger.info("Fetching dashboard statistics");

      const response = await fetch("/api/admin/statistics", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch statistics");
      }

      logger.info("Dashboard statistics fetched successfully", {
        totalGemstones: result.data.totalGemstones,
        activeUsers: result.data.activeUsers,
        totalRevenue: result.data.totalRevenue,
        totalOrders: result.data.totalOrders,
      });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to fetch dashboard statistics", error as Error);
      return {
        success: false,
        error: `Failed to fetch statistics: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get gemstone-specific statistics
   */
  static async getGemstoneStats(): Promise<
    Result<
      {
        total: number;
        inStock: number;
        outOfStock: number;
        byType: Record<string, number>;
        byColor: Record<string, number>;
        byCut: Record<string, number>;
        averagePrice: number;
        totalValue: number;
      },
      string
    >
  > {
    try {
      logger.info("Fetching gemstone statistics");

      const response = await fetch("/api/admin/statistics/gemstones", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch gemstone statistics");
      }

      logger.info("Gemstone statistics fetched successfully", {
        total: result.data.total,
        inStock: result.data.inStock,
        averagePrice: result.data.averagePrice,
      });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to fetch gemstone statistics", error as Error);
      return {
        success: false,
        error: `Failed to fetch gemstone statistics: ${
          (error as Error).message
        }`,
      };
    }
  }

  /**
   * Get user activity statistics
   */
  static async getUserActivityStats(): Promise<
    Result<
      {
        totalUsers: number;
        activeUsers: number;
        newUsersThisMonth: number;
        premiumUsers: number;
        admins: number;
        userRetentionRate: number;
        averageOrdersPerUser: number;
      },
      string
    >
  > {
    try {
      logger.info("Fetching user activity statistics");

      const response = await fetch("/api/admin/statistics/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch user statistics");
      }

      logger.info("User activity statistics fetched successfully", {
        totalUsers: result.data.totalUsers,
        activeUsers: result.data.activeUsers,
        newUsersThisMonth: result.data.newUsersThisMonth,
      });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to fetch user activity statistics", error as Error);
      return {
        success: false,
        error: `Failed to fetch user statistics: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get sales performance statistics
   */
  static async getSalesStats(): Promise<
    Result<
      {
        totalRevenue: number;
        totalOrders: number;
        averageOrderValue: number;
        conversionRate: number;
        topProducts: Array<{
          id: string;
          name: string;
          revenue: number;
          orders: number;
        }>;
        revenueByMonth: Array<{
          month: string;
          revenue: number;
          orders: number;
        }>;
      },
      string
    >
  > {
    try {
      logger.info("Fetching sales statistics");

      const response = await fetch("/api/admin/statistics/sales", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch sales statistics");
      }

      logger.info("Sales statistics fetched successfully", {
        totalRevenue: result.data.totalRevenue,
        totalOrders: result.data.totalOrders,
        averageOrderValue: result.data.averageOrderValue,
      });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to fetch sales statistics", error as Error);
      return {
        success: false,
        error: `Failed to fetch sales statistics: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Format currency value for display
   */
  static formatCurrency(amount: number, currency: string = "USD"): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  }

  /**
   * Format percentage for display
   */
  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Format number with appropriate formatting
   */
  static formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }
}

type Result<T, E> = { success: true; data: T } | { success: false; error: E };
