/**
 * Order Export Service (SRP: Order Export/CSV Generation)
 * 
 * Handles exporting orders to CSV and JSON formats.
 * Pure export functionality - no business logic modifications.
 */

import { createContextLogger } from '@/shared/utils/logger';
import { supabaseAdmin } from '@/lib/supabase';
import type { OrderStatus } from '@/shared/types';

export interface OrderExportOptions {
  orderIds?: string[];
  status?: OrderStatus[];
  dateFrom?: string;
  dateTo?: string;
  format: 'csv' | 'json';
  includeItems: boolean;
  includeCustomerInfo: boolean;
}

export interface ExportedOrderItem {
  gemstone_name: string;
  gemstone_serial: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface ExportedOrder {
  id: string;
  order_number: string | null;
  status: OrderStatus;
  total_amount: number;
  currency_code: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  items_count?: number;
  items?: ExportedOrderItem[];
}

export interface OrderExportResult {
  success: boolean;
  data?: string;
  filename?: string;
  mimeType?: string;
  orderCount?: number;
  error?: string;
}

export class OrderExportService {
  private logger = createContextLogger('order-export-service');

  /**
   * Export orders based on provided options
   */
  async exportOrders(options: OrderExportOptions): Promise<OrderExportResult> {
    try {
      this.logger.info('Starting order export', {
        format: options.format,
        orderCount: options.orderIds?.length,
        includeItems: options.includeItems,
      });

      if (!supabaseAdmin) {
        return { success: false, error: 'Database client not available' };
      }

      // Build query
      let query = supabaseAdmin
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          currency_code,
          created_at,
          updated_at,
          user_id,
          user_profiles!orders_user_id_fkey (
            name,
            email
          ),
          order_items (
            quantity,
            unit_price,
            line_total,
            gemstones (
              name,
              serial_number
            )
          )
        `);

      // Apply filters
      if (options.orderIds && options.orderIds.length > 0) {
        query = query.in('id', options.orderIds);
      }

      if (options.status && options.status.length > 0) {
        query = query.in('status', options.status);
      }

      if (options.dateFrom) {
        query = query.gte('created_at', options.dateFrom);
      }

      if (options.dateTo) {
        query = query.lte('created_at', options.dateTo);
      }

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data: orders, error } = await query;

      if (error) {
        this.logger.error('Failed to fetch orders for export', error);
        return { success: false, error: error.message };
      }

      if (!orders || orders.length === 0) {
        return { 
          success: true, 
          data: options.format === 'csv' ? this.getCSVHeaders(options) : '[]',
          filename: this.generateFilename(options.format),
          mimeType: options.format === 'csv' ? 'text/csv' : 'application/json',
          orderCount: 0,
        };
      }

      // Transform orders to export format
      const exportedOrders = this.transformOrdersForExport(orders as any[], options);

      // Generate output
      let data: string;
      if (options.format === 'csv') {
        data = this.generateCSV(exportedOrders, options);
      } else {
        data = JSON.stringify(exportedOrders, null, 2);
      }

      this.logger.info('Order export completed', {
        orderCount: exportedOrders.length,
        format: options.format,
      });

      return {
        success: true,
        data,
        filename: this.generateFilename(options.format),
        mimeType: options.format === 'csv' ? 'text/csv' : 'application/json',
        orderCount: exportedOrders.length,
      };
    } catch (error) {
      this.logger.error('Failed to export orders', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Transform database orders to export format
   */
  private transformOrdersForExport(
    orders: any[],
    options: OrderExportOptions
  ): ExportedOrder[] {
    return orders.map((order) => {
      const exported: ExportedOrder = {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        total_amount: order.total_amount,
        currency_code: order.currency_code,
        created_at: order.created_at,
        updated_at: order.updated_at,
      };

      if (options.includeCustomerInfo && order.user_profiles) {
        exported.customer_name = order.user_profiles.name || 'N/A';
        exported.customer_email = order.user_profiles.email || 'N/A';
      }

      if (options.includeItems && order.order_items) {
        exported.items_count = order.order_items.length;
        exported.items = order.order_items.map((item: any) => ({
          gemstone_name: item.gemstones?.name || 'Unknown',
          gemstone_serial: item.gemstones?.serial_number || 'N/A',
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
        }));
      } else {
        exported.items_count = order.order_items?.length || 0;
      }

      return exported;
    });
  }

  /**
   * Generate CSV string from orders
   */
  private generateCSV(orders: ExportedOrder[], options: OrderExportOptions): string {
    const headers = this.getCSVHeaders(options);
    const rows: string[] = [headers];

    for (const order of orders) {
      if (options.includeItems && order.items && order.items.length > 0) {
        // One row per item
        for (const item of order.items) {
          rows.push(this.formatCSVRow(order, options, item));
        }
      } else {
        // One row per order
        rows.push(this.formatCSVRow(order, options));
      }
    }

    return rows.join('\n');
  }

  /**
   * Get CSV headers based on options
   */
  private getCSVHeaders(options: OrderExportOptions): string {
    const headers = [
      'Order ID',
      'Order Number',
      'Status',
      'Total Amount',
      'Currency',
      'Created At',
      'Updated At',
    ];

    if (options.includeCustomerInfo) {
      headers.push('Customer Name', 'Customer Email');
    }

    if (options.includeItems) {
      headers.push(
        'Item Name',
        'Serial Number',
        'Quantity',
        'Unit Price',
        'Line Total'
      );
    } else {
      headers.push('Items Count');
    }

    return headers.join(',');
  }

  /**
   * Format a single CSV row
   */
  private formatCSVRow(
    order: ExportedOrder,
    options: OrderExportOptions,
    item?: ExportedOrderItem
  ): string {
    const values: string[] = [
      this.escapeCSV(order.id),
      this.escapeCSV(order.order_number || ''),
      this.escapeCSV(order.status),
      order.total_amount.toString(),
      this.escapeCSV(order.currency_code),
      this.escapeCSV(order.created_at),
      this.escapeCSV(order.updated_at),
    ];

    if (options.includeCustomerInfo) {
      values.push(
        this.escapeCSV(order.customer_name || ''),
        this.escapeCSV(order.customer_email || '')
      );
    }

    if (options.includeItems && item) {
      values.push(
        this.escapeCSV(item.gemstone_name),
        this.escapeCSV(item.gemstone_serial),
        item.quantity.toString(),
        item.unit_price.toString(),
        item.line_total.toString()
      );
    } else {
      values.push((order.items_count || 0).toString());
    }

    return values.join(',');
  }

  /**
   * Escape a value for CSV
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Generate filename for export
   */
  private generateFilename(format: 'csv' | 'json'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `orders-export-${timestamp}.${format}`;
  }
}

// Export singleton
export const orderExportService = new OrderExportService();

