/**
 * Order Analytics Service (SRP: Order Analytics)
 * 
 * Computes order analytics from database.
 * Server-side only - requires admin Supabase client.
 */

import { createContextLogger } from '@/shared/utils/logger';
import { supabaseAdmin } from '@/lib/supabase';
import type { OrderStatus } from '@/shared/types';
import type { OrderAnalytics } from '../types/order-management.types';

export interface AnalyticsDateRange {
  from?: string;
  to?: string;
}

export class OrderAnalyticsService {
  private logger = createContextLogger('order-analytics-service');

  /**
   * Get comprehensive order analytics
   */
  async getOrderAnalytics(dateRange?: AnalyticsDateRange): Promise<OrderAnalytics> {
    this.logger.info('Generating order analytics', { dateRange });

    if (!supabaseAdmin) {
      this.logger.error('Supabase admin client not available');
      return this.getEmptyAnalytics();
    }

    try {
      // Build date filter
      let query = supabaseAdmin.from('orders').select('*');
      
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from);
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to);
      }

      // Fetch all orders within range
      const { data: orders, error: ordersError } = await query;

      if (ordersError) {
        this.logger.error('Failed to fetch orders for analytics', ordersError);
        return this.getEmptyAnalytics();
      }

      if (!orders || orders.length === 0) {
        return this.getEmptyAnalytics();
      }

      // Calculate basic metrics
      const totalOrders = orders.length;
      
      // Revenue only from completed orders (delivered)
      const completedOrders = orders.filter(o => o.status === 'delivered');
      const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      
      // Average order value from all orders
      const averageOrderValue = totalOrders > 0 ? orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / totalOrders : 0;

      // Orders by status
      const ordersByStatus: Record<OrderStatus, number> = {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };

      for (const order of orders) {
        const status = order.status as OrderStatus;
        if (status in ordersByStatus) {
          ordersByStatus[status]++;
        }
      }

      // Orders by date (last 30 days)
      const ordersByDate = this.calculateOrdersByDate(orders);

      // Top products - fetch from order_items
      const topProducts = await this.getTopProducts(dateRange);

      // Customer stats
      const customerStats = await this.getCustomerStats(orders);

      const analytics: OrderAnalytics = {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        average_order_value: Math.round(averageOrderValue * 100) / 100,
        orders_by_status: ordersByStatus,
        orders_by_date: ordersByDate,
        top_products: topProducts,
        customer_stats: customerStats,
      };

      this.logger.info('Order analytics generated', {
        totalOrders,
        totalRevenue,
        averageOrderValue,
      });

      return analytics;
    } catch (error) {
      this.logger.error('Failed to generate order analytics', error as Error);
      return this.getEmptyAnalytics();
    }
  }

  /**
   * Calculate orders grouped by date
   */
  private calculateOrdersByDate(orders: any[]): OrderAnalytics['orders_by_date'] {
    const dateMap = new Map<string, { count: number; revenue: number }>();

    for (const order of orders) {
      const date = order.created_at ? order.created_at.split('T')[0] : null;
      if (!date) continue;

      const existing = dateMap.get(date) || { count: 0, revenue: 0 };
      existing.count++;
      // Only count revenue for completed orders
      if (order.status === 'delivered') {
        existing.revenue += order.total_amount || 0;
      }
      dateMap.set(date, existing);
    }

    // Convert to array and sort by date
    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get top selling products
   */
  private async getTopProducts(dateRange?: AnalyticsDateRange): Promise<OrderAnalytics['top_products']> {
    if (!supabaseAdmin) return [];

    try {
      // Get order IDs within date range first
      let ordersQuery = supabaseAdmin.from('orders').select('id');
      
      if (dateRange?.from) {
        ordersQuery = ordersQuery.gte('created_at', dateRange.from);
      }
      if (dateRange?.to) {
        ordersQuery = ordersQuery.lte('created_at', dateRange.to);
      }
      // Only count completed orders for top products
      ordersQuery = ordersQuery.eq('status', 'delivered');

      const { data: orders, error: ordersError } = await ordersQuery;

      if (ordersError || !orders || orders.length === 0) {
        return [];
      }

      const orderIds = orders.map(o => o.id);

      // Get order items for these orders with gemstone details
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select(`
          gemstone_id,
          quantity,
          line_total,
          gemstones (
            id,
            name
          )
        `)
        .in('order_id', orderIds);

      if (itemsError || !items) {
        return [];
      }

      // Aggregate by gemstone
      const productMap = new Map<string, {
        gemstone_id: string;
        gemstone_name: string;
        total_sold: number;
        total_revenue: number;
      }>();

      for (const item of items) {
        const gemstoneId = item.gemstone_id;
        const gemstoneName = (item.gemstones as any)?.name || 'Unknown';

        const existing = productMap.get(gemstoneId) || {
          gemstone_id: gemstoneId,
          gemstone_name: gemstoneName,
          total_sold: 0,
          total_revenue: 0,
        };

        existing.total_sold += item.quantity || 1;
        existing.total_revenue += item.line_total || 0;
        productMap.set(gemstoneId, existing);
      }

      // Sort by revenue and take top 10
      return Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10)
        .map(p => ({
          ...p,
          total_revenue: Math.round(p.total_revenue * 100) / 100,
        }));
    } catch (error) {
      this.logger.error('Failed to get top products', error as Error);
      return [];
    }
  }

  /**
   * Get customer statistics
   */
  private async getCustomerStats(orders: any[]): Promise<OrderAnalytics['customer_stats']> {
    // Count unique customers
    const customerIds = new Set(orders.map(o => o.user_id).filter(Boolean));
    const totalCustomers = customerIds.size;

    // Count customers with more than one order
    const orderCounts = new Map<string, number>();
    for (const order of orders) {
      if (order.user_id) {
        orderCounts.set(order.user_id, (orderCounts.get(order.user_id) || 0) + 1);
      }
    }

    const repeatCustomers = Array.from(orderCounts.values()).filter(count => count > 1).length;
    const averageOrdersPerCustomer = totalCustomers > 0 ? orders.length / totalCustomers : 0;

    return {
      total_customers: totalCustomers,
      repeat_customers: repeatCustomers,
      average_orders_per_customer: Math.round(averageOrdersPerCustomer * 100) / 100,
    };
  }

  /**
   * Get empty analytics object
   */
  private getEmptyAnalytics(): OrderAnalytics {
    return {
      total_orders: 0,
      total_revenue: 0,
      average_order_value: 0,
      orders_by_status: {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      },
      orders_by_date: [],
      top_products: [],
      customer_stats: {
        total_customers: 0,
        repeat_customers: 0,
        average_orders_per_customer: 0,
      },
    };
  }
}

// Export singleton
export const orderAnalyticsService = new OrderAnalyticsService();

