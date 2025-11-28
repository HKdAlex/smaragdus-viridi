/**
 * Order Bulk Service (SRP: Bulk Order Operations)
 * 
 * Handles bulk operations on orders:
 * - Bulk status updates
 * - Bulk exports
 * - Creates audit trail for all operations
 */

import { createContextLogger } from '@/shared/utils/logger';
import { supabaseAdmin } from '@/lib/supabase';
import type { OrderStatus } from '@/shared/types';

export interface BulkUpdateRequest {
  orderIds: string[];
  newStatus: OrderStatus;
  notes?: string;
  adminId: string;
}

export interface BulkUpdateResult {
  success: boolean;
  updatedCount: number;
  failedCount: number;
  updatedOrders: Array<{ id: string; status: OrderStatus }>;
  failedOrders: Array<{ id: string; error: string }>;
  error?: string;
}

export class OrderBulkService {
  private logger = createContextLogger('order-bulk-service');

  /**
   * Bulk update order statuses
   */
  async bulkUpdateStatus(request: BulkUpdateRequest): Promise<BulkUpdateResult> {
    const { orderIds, newStatus, notes, adminId } = request;

    this.logger.info('Starting bulk status update', {
      orderCount: orderIds.length,
      newStatus,
      adminId,
    });

    if (!supabaseAdmin) {
      return {
        success: false,
        updatedCount: 0,
        failedCount: orderIds.length,
        updatedOrders: [],
        failedOrders: orderIds.map(id => ({ id, error: 'Database client not available' })),
        error: 'Database client not available',
      };
    }

    if (orderIds.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        failedCount: 0,
        updatedOrders: [],
        failedOrders: [],
      };
    }

    // Limit bulk operations to 100 orders at a time
    if (orderIds.length > 100) {
      return {
        success: false,
        updatedCount: 0,
        failedCount: orderIds.length,
        updatedOrders: [],
        failedOrders: orderIds.map(id => ({ id, error: 'Maximum 100 orders per bulk operation' })),
        error: 'Maximum 100 orders per bulk operation',
      };
    }

    const updatedOrders: Array<{ id: string; status: OrderStatus }> = [];
    const failedOrders: Array<{ id: string; error: string }> = [];

    // Get current order statuses for validation and audit
    const { data: orders, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .in('id', orderIds);

    if (fetchError) {
      this.logger.error('Failed to fetch orders for bulk update', fetchError);
      return {
        success: false,
        updatedCount: 0,
        failedCount: orderIds.length,
        updatedOrders: [],
        failedOrders: orderIds.map(id => ({ id, error: 'Failed to fetch order' })),
        error: fetchError.message,
      };
    }

    // Create a map of current statuses
    const orderStatusMap = new Map(
      (orders || []).map(o => [o.id, o.status as OrderStatus])
    );

    // Find orders that don't exist
    const notFoundIds = orderIds.filter(id => !orderStatusMap.has(id));
    for (const id of notFoundIds) {
      failedOrders.push({ id, error: 'Order not found' });
    }

    // Filter valid orders for update
    const validOrderIds = orderIds.filter(id => orderStatusMap.has(id));

    if (validOrderIds.length === 0) {
      return {
        success: failedOrders.length === 0,
        updatedCount: 0,
        failedCount: failedOrders.length,
        updatedOrders: [],
        failedOrders,
      };
    }

    // Validate status transitions
    const validTransitions = this.getValidTransitions();
    const ordersToUpdate: string[] = [];

    for (const orderId of validOrderIds) {
      const currentStatus = orderStatusMap.get(orderId);
      if (!currentStatus) {
        failedOrders.push({ id: orderId, error: 'Order status not found' });
        continue;
      }

      // Check if transition is valid
      if (currentStatus === newStatus) {
        failedOrders.push({ id: orderId, error: `Order is already ${newStatus}` });
        continue;
      }

      // Cancelled orders cannot be changed
      if (currentStatus === 'cancelled') {
        failedOrders.push({ id: orderId, error: 'Cancelled orders cannot be modified' });
        continue;
      }

      // Delivered orders can only be cancelled with reason
      if (currentStatus === 'delivered' && newStatus !== 'cancelled') {
        failedOrders.push({ id: orderId, error: 'Delivered orders cannot change status' });
        continue;
      }

      ordersToUpdate.push(orderId);
    }

    if (ordersToUpdate.length > 0) {
      // Perform bulk update
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: newStatus,
          notes: notes ? `Bulk update: ${notes}` : undefined,
          updated_at: new Date().toISOString(),
        })
        .in('id', ordersToUpdate);

      if (updateError) {
        this.logger.error('Bulk update failed', updateError);
        for (const id of ordersToUpdate) {
          failedOrders.push({ id, error: updateError.message });
        }
      } else {
        // Record successful updates
        for (const id of ordersToUpdate) {
          updatedOrders.push({ id, status: newStatus });
        }

        // Create audit events for all updated orders
        const auditEvents = ordersToUpdate.map(orderId => ({
          order_id: orderId,
          event_type: 'status_changed',
          title: `Status changed to ${newStatus}`,
          description: notes ? `Bulk update: ${notes}` : 'Bulk status update',
          metadata: {
            old_status: orderStatusMap.get(orderId),
            new_status: newStatus,
            admin_id: adminId,
          },
          performed_by: adminId,
          is_internal: true,
        }));

        const { error: eventError } = await supabaseAdmin
          .from('order_events')
          .insert(auditEvents);

        if (eventError) {
          this.logger.warn('Failed to create audit events for bulk update', eventError);
        }
      }
    }

    this.logger.info('Bulk status update completed', {
      updatedCount: updatedOrders.length,
      failedCount: failedOrders.length,
      newStatus,
      adminId,
    });

    return {
      success: failedOrders.length === 0,
      updatedCount: updatedOrders.length,
      failedCount: failedOrders.length,
      updatedOrders,
      failedOrders,
    };
  }

  /**
   * Get valid status transitions
   */
  private getValidTransitions(): Record<OrderStatus, OrderStatus[]> {
    return {
      pending: ['confirmed', 'processing', 'cancelled'],
      confirmed: ['processing', 'shipped', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: ['cancelled'], // Only with reason
      cancelled: [], // Terminal state
    };
  }
}

// Export singleton
export const orderBulkService = new OrderBulkService();

