"use client";

import { supabase } from '@/lib/supabase';

// Simple logger for statistics service
const logger = {
  info: (message: string, data?: any) => console.log(`[STATISTICS INFO] ${message}`, data),
  error: (message: string, error?: any, data?: any) => console.error(`[STATISTICS ERROR] ${message}`, error, data),
  warn: (message: string, data?: any) => console.warn(`[STATISTICS WARN] ${message}`, data),
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
  trend: 'up' | 'down' | 'neutral';
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
  static async getDashboardStats(): Promise<Result<DashboardStatsWithChanges, string>> {
    try {
      logger.info('Fetching dashboard statistics');

      // Using the imported supabase client

      // Get real gemstone statistics with count
      const { data: gemstones, error: gemstonesError, count: totalGemstonesCount } = await supabase
        .from('gemstones')
        .select('id, price_amount, price_currency, in_stock, created_at', { count: 'exact' });

      if (gemstonesError) {
        logger.error('Failed to fetch gemstones', gemstonesError);
        throw gemstonesError;
      }

      // Get real user statistics with count
      const { data: userProfiles, error: usersError, count: totalUsersCount } = await supabase
        .from('user_profiles')
        .select('id, created_at', { count: 'exact' });

      if (usersError) {
        logger.error('Failed to fetch user profiles', usersError);
        throw usersError;
      }

      // Get real order statistics with count
      const { data: orders, error: ordersError, count: totalOrdersCount } = await supabase
        .from('orders')
        .select('id, total_amount, currency_code, created_at', { count: 'exact' });

      if (ordersError) {
        logger.error('Failed to fetch orders', ordersError);
        throw ordersError;
      }

      // Calculate real statistics
      const totalGemstones = totalGemstonesCount || 0;
      const inStockGemstones = gemstones?.filter(g => g.in_stock).length || 0;
      const outOfStockGemstones = totalGemstones - inStockGemstones;
      const activeUsers = totalUsersCount || 0;
      const totalOrders = totalOrdersCount || 0;
      
      // Calculate total revenue
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      
      // Calculate average gemstone price
      const totalGemstoneValue = gemstones?.reduce((sum, gem) => sum + (gem.price_amount || 0), 0) || 0;
      const avgGemstonePrice = totalGemstones > 0 ? Math.round(totalGemstoneValue / totalGemstones) : 0;

      // Get top selling gemstones (for now, just get some recent ones)
      const topSellingGemstones = gemstones?.slice(0, 2).map(gem => ({
        id: gem.id,
        serial_number: `SV-${gem.id.slice(0, 8)}`,
        name: 'gemstone', // We'd need to join with gemstone details for actual names
        price_amount: gem.price_amount || 0,
        price_currency: gem.price_currency || 'USD',
      })) || [];

      // Get recent orders
      const recentOrders = orders?.slice(0, 1).map(order => ({
        id: order.id,
        user_id: 'user-1', // We'd need to join for actual user info
        total_amount: order.total_amount || 0,
        currency_code: order.currency_code || 'USD',
        created_at: order.created_at || new Date().toISOString(),
      })) || [];

      const realStats: DashboardStats = {
        totalGemstones,
        activeUsers,
        totalRevenue,
        totalOrders,
        inStockGemstones,
        outOfStockGemstones,
        avgGemstonePrice,
        topSellingGemstones,
        recentOrders,
      };

      // Calculate changes (for now, using simple mock changes since we don't have historical data)
      const changes = {
        totalGemstones: { value: Math.floor(totalGemstones * 0.1), percentage: 10, trend: 'up' as const },
        activeUsers: { value: Math.floor(activeUsers * 0.05), percentage: 5, trend: 'up' as const },
        totalRevenue: { value: Math.floor(totalRevenue * 0.15), percentage: 15, trend: 'up' as const },
        totalOrders: { value: Math.floor(totalOrders * 0.2), percentage: 20, trend: 'up' as const },
      };

      const result: DashboardStatsWithChanges = {
        ...realStats,
        changes,
      };

      logger.info('Dashboard statistics fetched successfully', {
        totalGemstones,
        activeUsers,
        totalRevenue,
        totalOrders,
      });

      return { success: true, data: result };
    } catch (error) {
      logger.error('Failed to fetch dashboard statistics', error as Error);
      return {
        success: false,
        error: `Failed to fetch statistics: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get gemstone-specific statistics
   */
  static async getGemstoneStats(): Promise<Result<{
    total: number;
    inStock: number;
    outOfStock: number;
    byType: Record<string, number>;
    byColor: Record<string, number>;
    byCut: Record<string, number>;
    averagePrice: number;
    totalValue: number;
  }, string>> {
    try {
      logger.info('Fetching gemstone statistics');

      // Using the imported supabase client

      // Get all gemstones with their properties and count
      const { data: gemstones, error, count: totalCount } = await supabase
        .from('gemstones')
        .select('id, name, color, cut, price_amount, in_stock', { count: 'exact' });

      if (error) {
        logger.error('Failed to fetch gemstones', error);
        throw error;
      }

      // Calculate real statistics
      const total = totalCount || 0;
      const inStock = gemstones?.filter(g => g.in_stock).length || 0;
      const outOfStock = total - inStock;

      // Calculate by type
      const byType: Record<string, number> = {};
      gemstones?.forEach(gem => {
        const type = gem.name || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });

      // Calculate by color
      const byColor: Record<string, number> = {};
      gemstones?.forEach(gem => {
        const color = gem.color || 'unknown';
        byColor[color] = (byColor[color] || 0) + 1;
      });

      // Calculate by cut
      const byCut: Record<string, number> = {};
      gemstones?.forEach(gem => {
        const cut = gem.cut || 'unknown';
        byCut[cut] = (byCut[cut] || 0) + 1;
      });

      // Calculate average price and total value
      const totalValue = gemstones?.reduce((sum, gem) => sum + (gem.price_amount || 0), 0) || 0;
      const averagePrice = total > 0 ? Math.round(totalValue / total) : 0;

      const stats = {
        total,
        inStock,
        outOfStock,
        byType,
        byColor,
        byCut,
        averagePrice,
        totalValue,
      };

      logger.info('Gemstone statistics fetched successfully', {
        total: stats.total,
        inStock: stats.inStock,
        averagePrice: stats.averagePrice,
      });

      return { success: true, data: stats };
    } catch (error) {
      logger.error('Failed to fetch gemstone statistics', error as Error);
      return {
        success: false,
        error: `Failed to fetch gemstone statistics: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get user activity statistics
   */
  static async getUserActivityStats(): Promise<Result<{
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    premiumUsers: number;
    userRetentionRate: number;
    averageOrdersPerUser: number;
  }, string>> {
    try {
      logger.info('Fetching user activity statistics');

      // Using the imported supabase client

      // Get user profiles with count
      const { data: userProfiles, error: usersError, count: totalUsersCount } = await supabase
        .from('user_profiles')
        .select('id, role, created_at', { count: 'exact' });

      if (usersError) {
        logger.error('Failed to fetch user profiles', usersError);
        throw usersError;
      }

      // Get orders for user activity calculation with count
      const { data: orders, error: ordersError, count: totalOrdersCount } = await supabase
        .from('orders')
        .select('id, user_id, created_at', { count: 'exact' });

      if (ordersError) {
        logger.error('Failed to fetch orders', ordersError);
        throw ordersError;
      }

      // Calculate real statistics
      const totalUsers = totalUsersCount || 0;
      const activeUsers = totalUsers; // For now, consider all users as active
      const premiumUsers = userProfiles?.filter(u => u.role === 'premium_customer').length || 0;
      
      // Calculate new users this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const newUsersThisMonth = userProfiles?.filter(u => 
        new Date(u.created_at || '') >= thisMonth
      ).length || 0;

      // Calculate average orders per user
      const totalOrders = totalOrdersCount || 0;
      const averageOrdersPerUser = totalUsers > 0 ? Math.round((totalOrders / totalUsers) * 10) / 10 : 0;

      // Mock retention rate for now (would need historical data)
      const userRetentionRate = 85.0;

      const stats = {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        premiumUsers,
        userRetentionRate,
        averageOrdersPerUser,
      };

      logger.info('User activity statistics fetched successfully', {
        totalUsers: stats.totalUsers,
        activeUsers: stats.activeUsers,
        newUsersThisMonth: stats.newUsersThisMonth,
      });

      return { success: true, data: stats };
    } catch (error) {
      logger.error('Failed to fetch user activity statistics', error as Error);
      return {
        success: false,
        error: `Failed to fetch user statistics: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get sales performance statistics
   */
  static async getSalesStats(): Promise<Result<{
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
  }, string>> {
    try {
      logger.info('Fetching sales statistics');

      // Using the imported supabase client

      // Get orders with count
      const { data: orders, error: ordersError, count: totalOrdersCount } = await supabase
        .from('orders')
        .select('id, total_amount, currency_code, created_at, user_id', { count: 'exact' });

      if (ordersError) {
        logger.error('Failed to fetch orders', ordersError);
        throw ordersError;
      }

      // Get order items for product analysis
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('id, order_id, gemstone_id, quantity, unit_price, line_total');

      if (itemsError) {
        logger.error('Failed to fetch order items', itemsError);
        throw itemsError;
      }

      // Calculate real statistics
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalOrders = totalOrdersCount || 0;
      const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

      // Mock conversion rate for now (would need visitor data)
      const conversionRate = 2.5;

      // Get top products (for now, just some gemstones)
      const { data: gemstones } = await supabase
        .from('gemstones')
        .select('id, name, price_amount')
        .limit(2);

      const topProducts = gemstones?.map(gem => ({
        id: gem.id,
        name: gem.name || 'Unknown Gemstone',
        revenue: gem.price_amount || 0,
        orders: 1, // Mock for now
      })) || [];

      // Mock revenue by month for now (would need historical data)
      const revenueByMonth = [
        { month: 'Jan', revenue: 0, orders: 0 },
        { month: 'Feb', revenue: 0, orders: 0 },
        { month: 'Mar', revenue: 0, orders: 0 },
        { month: 'Apr', revenue: 0, orders: 0 },
        { month: 'May', revenue: 0, orders: 0 },
        { month: 'Jun', revenue: 0, orders: 0 },
      ];

      const stats = {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        conversionRate,
        topProducts,
        revenueByMonth,
      };

      logger.info('Sales statistics fetched successfully', {
        totalRevenue: stats.totalRevenue,
        totalOrders: stats.totalOrders,
        averageOrderValue: stats.averageOrderValue,
      });

      return { success: true, data: stats };
    } catch (error) {
      logger.error('Failed to fetch sales statistics', error as Error);
      return {
        success: false,
        error: `Failed to fetch sales statistics: ${(error as Error).message}`
      };
    }
  }

  /**
   * Format currency value for display
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
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
