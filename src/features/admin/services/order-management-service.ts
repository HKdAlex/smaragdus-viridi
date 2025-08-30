import type {
    AdminOrder,
    BulkUpdateOrdersRequest,
    BulkUpdateOrdersResponse,
    GetOrdersRequest,
    GetOrdersResponse,
    OrderAnalytics,
    OrderManagementError,
    OrderStatus,
    UpdateOrderStatusRequest,
    UpdateOrderStatusResponse
} from '../types/order-management.types'

import { createContextLogger } from '@/shared/utils/logger'
import { supabase } from '@/lib/supabase'

export class OrderManagementService {
  private supabase = supabase
  private logger = createContextLogger('order-management-service')

  /**
   * Get orders with filtering, pagination, and sorting
   */
  async getOrders(request: GetOrdersRequest): Promise<GetOrdersResponse> {
    try {
      const {
        page = 1,
        limit = 20,
        filters = {},
        sort_by = 'created_at',
        sort_order = 'desc'
      } = request

      const offset = (page - 1) * limit

      // Build the query
      let query = this.supabase
        .from('orders')
        .select(`
          *,
          user:user_profiles!user_id (
            id,
            name,
            email
          ),
          order_items (
            *,
            gemstones (
              id,
              name,
              color,
              cut,
              weight_carats,
              serial_number,
              in_stock
            )
          )
        `, { count: 'exact' })

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      if (filters.min_amount !== undefined) {
        query = query.gte('total_amount', filters.min_amount)
      }

      if (filters.max_amount !== undefined) {
        query = query.lte('total_amount', filters.max_amount)
      }

      if (filters.currency) {
        query = query.eq('currency_code', filters.currency)
      }

      if (filters.search) {
        // Search in order ID or user name
        query = query.or(`id.ilike.%${filters.search}%,user.name.ilike.%${filters.search}%`)
      }

      // Apply sorting
      const sortColumn = sort_by === 'total_amount' ? 'total_amount' : 'created_at'
      query = query.order(sortColumn, { ascending: sort_order === 'asc' })

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data: orders, error, count } = await query

      if (error) {
        this.logger.error('Failed to fetch orders', error, { request })
        throw new OrderManagementError('NETWORK_ERROR', 'Failed to fetch orders')
      }

      const total = count || 0
      const hasMore = total > offset + limit

      this.logger.info('Orders fetched successfully', {
        total,
        page,
        limit,
        filters,
        hasMore
      })

      return {
        success: true,
        orders: orders as AdminOrder[] || [],
        total,
        page,
        limit,
        hasMore
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Failed to fetch orders', error as Error, { request })

      if (error instanceof OrderManagementError) {
        return { success: false, error: error.message, orders: [], total: 0, page: 1, limit: 20, hasMore: false }
      }

      return {
        success: false,
        error: 'Failed to load orders. Please try again.',
        orders: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false
      }
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(request: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse> {
    try {
      const { order_id, new_status, notes } = request

      // First, get the current order to validate the transition
      const { data: currentOrder, error: fetchError } = await this.supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single()

      if (fetchError || !currentOrder) {
        this.logger.error('Order not found for status update', fetchError, { order_id })
        throw new OrderManagementError('ORDER_NOT_FOUND', 'Order not found')
      }

      // Validate status transition
      if (!this.isValidStatusTransition(currentOrder.status, new_status)) {
        this.logger.warn('Invalid status transition attempted', {
          order_id,
          current_status: currentOrder.status,
          new_status
        })
        throw new OrderManagementError(
          'INVALID_STATUS_TRANSITION',
          `Cannot change status from ${currentOrder.status} to ${new_status}`
        )
      }

      // Update the order status
      const { data: updatedOrder, error: updateError } = await this.supabase
        .from('orders')
        .update({
          status: new_status,
          updated_at: new Date().toISOString(),
          notes: notes || currentOrder.notes
        })
        .eq('id', order_id)
        .select(`
          *,
          user:user_profiles!user_id (
            id,
            name,
            email
          ),
          order_items (
            *,
            gemstones (
              id,
              name,
              color,
              cut,
              weight_carats,
              serial_number,
              in_stock
            )
          )
        `)
        .single()

      if (updateError) {
        this.logger.error('Failed to update order status', updateError, { order_id, new_status })
        throw new OrderManagementError('NETWORK_ERROR', 'Failed to update order status')
      }

      // Log the status change
      this.logger.info('Order status updated successfully', {
        order_id,
        old_status: currentOrder.status,
        new_status,
        user_id: currentOrder.user_id
      })

      return {
        success: true,
        order: updatedOrder as AdminOrder
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Failed to update order status', error as Error, { request })

      if (error instanceof OrderManagementError) {
        return { success: false, error: error.message }
      }

      return { success: false, error: 'Failed to update order status. Please try again.' }
    }
  }

  /**
   * Bulk update order statuses
   */
  async bulkUpdateOrders(request: BulkUpdateOrdersRequest): Promise<BulkUpdateOrdersResponse> {
    try {
      const { order_ids, new_status, notes } = request

      if (order_ids.length === 0) {
        return {
          success: true,
          updated_orders: [],
          failed_updates: []
        }
      }

      const updated_orders: AdminOrder[] = []
      const failed_updates: Array<{ order_id: string; error: string }> = []

      // Process each order update
      for (const order_id of order_ids) {
        try {
          const result = await this.updateOrderStatus({
            order_id,
            new_status,
            notes
          })

          if (result.success && result.order) {
            updated_orders.push(result.order)
          } else {
            failed_updates.push({
              order_id,
              error: result.error || 'Unknown error'
            })
          }
        } catch (error) {
          failed_updates.push({
            order_id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      this.logger.info('Bulk order update completed', {
        total_requested: order_ids.length,
        successful: updated_orders.length,
        failed: failed_updates.length,
        new_status
      })

      return {
        success: failed_updates.length === 0,
        updated_orders,
        failed_updates
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Failed to bulk update orders', error as Error, { request })

      return {
        success: false,
        error: 'Failed to update orders. Please try again.',
        updated_orders: [],
        failed_updates: request.order_ids.map(order_id => ({
          order_id,
          error: 'Bulk update failed'
        }))
      }
    }
  }

  /**
   * Get order analytics
   */
  async getOrderAnalytics(dateRange?: { from: string; to: string }): Promise<OrderAnalytics> {
    try {
      // Build date filter
      let dateFilter = ''
      if (dateRange) {
        dateFilter = `created_at.gte.${dateRange.from},created_at.lte.${dateRange.to}`
      }

      // Get total orders and revenue
      const { data: totals, error: totalsError } = await this.supabase
        .from('orders')
        .select('total_amount, currency_code, status, user_id')
        .eq('status', 'delivered') // Only count completed orders
        .filter(dateFilter)

      if (totalsError) {
        this.logger.error('Failed to fetch order totals', totalsError)
        throw new OrderManagementError('NETWORK_ERROR', 'Failed to fetch analytics')
      }

      // Calculate basic metrics
      const total_orders = totals?.length || 0
      const total_revenue = totals?.reduce((sum, order) => sum + order.total_amount, 0) || 0
      const average_order_value = total_orders > 0 ? total_revenue / total_orders : 0

      // Get orders by status
      const { data: statusData, error: statusError } = await this.supabase
        .from('orders')
        .select('status')
        .filter(dateFilter)

      const orders_by_status: Record<OrderStatus, number> = {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      }

      statusData?.forEach(order => {
        orders_by_status[order.status as OrderStatus]++
      })

      // Get customer statistics
      const uniqueCustomers = new Set(totals?.map(order => order.user_id))
      const total_customers = uniqueCustomers.size
      const repeat_customers = Array.from(uniqueCustomers).filter(userId => {
        return totals?.filter(order => order.user_id === userId).length > 1
      }).length
      const average_orders_per_customer = total_customers > 0 ? total_orders / total_customers : 0

      this.logger.info('Order analytics generated successfully', {
        total_orders,
        total_revenue,
        average_order_value,
        total_customers
      })

      return {
        total_orders,
        total_revenue,
        average_order_value,
        orders_by_status,
        orders_by_date: [], // Would need additional query for date aggregation
        top_products: [], // Would need additional query for product aggregation
        customer_stats: {
          total_customers,
          repeat_customers,
          average_orders_per_customer
        }
      }

    } catch (error) {
      this.logger.error('Failed to generate order analytics', error as Error)
      throw error
    }
  }

  /**
   * Validate status transition
   */
  private isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    // Allow any transition for now - in production, you'd have business rules
    // For example: pending -> confirmed -> processing -> shipped -> delivered
    // cancelled can be set from any status

    if (newStatus === 'cancelled') {
      return true // Can cancel from any status
    }

    // Define allowed transitions
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [], // Final state
      cancelled: [] // Final state
    }

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false
  }
}

// Export singleton instance
export const orderManagementService = new OrderManagementService()
