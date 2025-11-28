import type {
  AdminOrder,
  BulkUpdateOrdersRequest,
  BulkUpdateOrdersResponse,
  GetOrdersRequest,
  GetOrdersResponse,
  OrderAnalytics,
  OrderStatus,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse,
} from "../types/order-management.types";

import { createContextLogger } from "@/shared/utils/logger";
import { OrderManagementError } from "../types/order-management.types";

export class OrderManagementService {
  private logger = createContextLogger("order-management-service");

  /**
   * Get orders with filtering, pagination, and sorting
   */
  async getOrders(request: GetOrdersRequest): Promise<GetOrdersResponse> {
    try {
      const {
        page = 1,
        limit = 20,
        filters = {},
        sort_by = "created_at",
        sort_order = "desc",
      } = request;

      const offset = (page - 1) * limit;

      // Build query parameters for API call
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by,
        sort_order,
      });

      // Add filters to query parameters
      if (filters.status && filters.status.length > 0) {
        searchParams.append("status", filters.status.join(","));
      }
      if (filters.user_id) {
        searchParams.append("user_id", filters.user_id);
      }
      if (filters.date_from) {
        searchParams.append("date_from", filters.date_from);
      }
      if (filters.date_to) {
        searchParams.append("date_to", filters.date_to);
      }

      const response = await fetch(
        `/api/admin/orders?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch orders");
      }

      const orders = result.data.orders;
      const total = result.data.total;
      const hasMore = result.data.hasMore;

      // Orders are already in the correct format from the API

      this.logger.info("Orders fetched successfully", {
        count: orders?.length || 0,
        total,
        page,
        limit,
        filters,
        hasMore,
      });

      return {
        success: true,
        orders: orders || [],
        total,
        page: result.data.page,
        limit: result.data.limit,
        hasMore,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to fetch orders", error as Error, { request });

      if (error instanceof OrderManagementError) {
        return {
          success: false,
          error: error.message,
          orders: [],
          total: 0,
          page: 1,
          limit: 20,
          hasMore: false,
        };
      }

      return {
        success: false,
        error: "Failed to load orders. Please try again.",
        orders: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false,
      };
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    request: UpdateOrderStatusRequest
  ): Promise<UpdateOrderStatusResponse> {
    try {
      const { order_id, new_status, notes } = request;

      // Call API to update order status
      const response = await fetch(`/api/admin/orders/${order_id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_status,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update order status");
      }

      this.logger.info("Order status updated successfully", {
        order_id,
        new_status,
      });

      return {
        success: true,
        order: result.data.order,
      };
    } catch (error) {
      this.logger.error("Failed to update order status", error as Error, {
        request,
      });

      return {
        success: false,
        error: `Failed to update order status: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Bulk update order statuses
   */
  async bulkUpdateOrders(
    request: BulkUpdateOrdersRequest
  ): Promise<BulkUpdateOrdersResponse> {
    try {
      const { order_ids, new_status, notes } = request;

      if (order_ids.length === 0) {
        return {
          success: true,
          updated_orders: [],
          failed_updates: [],
        };
      }

      const updated_orders: AdminOrder[] = [];
      const failed_updates: Array<{ order_id: string; error: string }> = [];

      // Process each order update
      for (const order_id of order_ids) {
        try {
          const result = await this.updateOrderStatus({
            order_id,
            new_status,
            notes,
          });

          if (result.success && result.order) {
            updated_orders.push(result.order);
          } else {
            failed_updates.push({
              order_id,
              error: result.error || "Unknown error",
            });
          }
        } catch (error) {
          failed_updates.push({
            order_id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      this.logger.info("Bulk order update completed", {
        total_requested: order_ids.length,
        successful: updated_orders.length,
        failed: failed_updates.length,
        new_status,
      });

      return {
        success: failed_updates.length === 0,
        updated_orders,
        failed_updates,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to bulk update orders", error as Error, {
        request,
      });

      return {
        success: false,
        error: "Failed to update orders. Please try again.",
        updated_orders: [],
        failed_updates: request.order_ids.map((order_id) => ({
          order_id,
          error: "Bulk update failed",
        })),
      };
    }
  }

  /**
   * Get order analytics
   */
  async getOrderAnalytics(dateRange?: {
    from: string;
    to: string;
  }): Promise<OrderAnalytics> {
    try {
      // Build query parameters
      const searchParams = new URLSearchParams();
      if (dateRange?.from) {
        searchParams.append('from', dateRange.from);
      }
      if (dateRange?.to) {
        searchParams.append('to', dateRange.to);
      }

      const response = await fetch(
        `/api/admin/orders/analytics?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      this.logger.info('Order analytics fetched successfully', {
        totalOrders: result.data.total_orders,
        totalRevenue: result.data.total_revenue,
      });

      return result.data;
    } catch (error) {
      this.logger.error("Failed to fetch order analytics", error as Error);
      // Return empty analytics instead of throwing
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

  /**
   * Validate status transition
   */
  private isValidStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ): boolean {
    // Allow any transition for now - in production, you'd have business rules
    // For example: pending -> confirmed -> processing -> shipped -> delivered
    // cancelled can be set from any status

    if (newStatus === "cancelled") {
      return true; // Can cancel from any status
    }

    // Define allowed transitions
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [], // Final state
      cancelled: [], // Final state
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
  }
}

// Export singleton instance
export const orderManagementService = new OrderManagementService();
