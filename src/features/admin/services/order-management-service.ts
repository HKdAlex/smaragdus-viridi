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

import { OrderManagementError } from "../types/order-management.types";
import { createContextLogger } from "@/shared/utils/logger";
import { supabaseAdmin } from "@/lib/supabase";

export class OrderManagementService {
  private supabase = supabaseAdmin!;
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

      // Build the query using the orders_with_details view
      let query = this.supabase
        .from("orders_with_details")
        .select("*", { count: "exact" });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in("status", filters.status);
      }

      if (filters.user_id) {
        query = query.eq("user_id", filters.user_id);
      }

      if (filters.date_from) {
        query = query.gte("created_at", filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte("created_at", filters.date_to);
      }

      if (filters.min_amount !== undefined) {
        query = query.gte("total_amount", filters.min_amount);
      }

      if (filters.max_amount !== undefined) {
        query = query.lte("total_amount", filters.max_amount);
      }

      if (filters.currency) {
        query = query.eq("currency_code", filters.currency as any);
      }

      if (filters.search) {
        // Search in order ID only since we removed user join
        query = query.ilike("id", `%${filters.search}%`);
      }

      // Apply sorting
      const sortColumn =
        sort_by === "total_amount" ? "total_amount" : "created_at";
      query = query.order(sortColumn, { ascending: sort_order === "asc" });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: rawOrders, error, count } = await query;

      if (error) {
        this.logger.error("Failed to fetch orders", error, { request });
        throw new OrderManagementError(
          "NETWORK_ERROR",
          "Failed to fetch orders"
        );
      }

      const total = count || 0;
      const hasMore = total > offset + limit;

      // Group the flattened data back into orders with items
      const orderMap = new Map<string, AdminOrder>();

      for (const row of rawOrders || []) {
        const orderId = row.order_id;

        if (!orderId) continue; // Skip rows without order_id

        if (!orderMap.has(orderId)) {
          // Create new order
          orderMap.set(orderId, {
            id: orderId,
            user_id: row.user_id || "",
            status: row.status || "pending",
            total_amount: row.total_amount || 0,
            currency_code: row.currency_code || "USD",
            notes: row.notes || "",
            created_at: row.created_at || new Date().toISOString(),
            updated_at: row.updated_at || new Date().toISOString(),
            user: {
              id: row.user_id || "",
              name: row.user_name || "",
              email: row.user_phone || "", // Using phone as email since view doesn't have email
            },
            items: [],
          });
        }

        const order = orderMap.get(orderId)!;

        // Add order item if it exists
        if (row.order_item_id && row.gemstone_id) {
          order.items.push({
            id: row.order_item_id,
            order_id: orderId,
            gemstone_id: row.gemstone_id,
            quantity: row.quantity || 1,
            unit_price: row.unit_price || 0,
            line_total: row.line_total || 0,
            gemstone: {
              id: row.gemstone_id,
              name: row.gemstone_name || "",
              color: row.gemstone_color || "",
              cut: row.gemstone_cut || "",
              weight_carats: row.weight_carats || 0,
              serial_number: row.serial_number || "",
              in_stock: row.in_stock || false,
              images: [], // Will be populated later
            },
          });
        }
      }

      const orders = Array.from(orderMap.values());

      // Fetch images for all gemstones in the orders
      const gemstoneIds = orders.flatMap((order) =>
        order.items
          .map((item) => item.gemstone?.id)
          .filter((id): id is string => Boolean(id))
      );

      if (gemstoneIds.length > 0) {
        const { data: imagesData, error: imagesError } = await this.supabase
          .from("gemstone_images")
          .select("id, gemstone_id, image_url, image_order, is_primary")
          .in("gemstone_id", gemstoneIds)
          .order("image_order");

        if (imagesError) {
          this.logger.error("Failed to fetch gemstone images", imagesError);
        } else if (imagesData) {
          // Group images by gemstone_id
          const imagesByGemstone = imagesData.reduce((acc, img) => {
            if (!acc[img.gemstone_id]) {
              acc[img.gemstone_id] = [];
            }
            acc[img.gemstone_id].push({
              id: img.id,
              image_url: img.image_url,
              image_order: img.image_order,
              is_primary: img.is_primary || false,
            });
            return acc;
          }, {} as Record<string, Array<{ id: string; image_url: string; image_order: number; is_primary: boolean }>>);

          // Attach images to gemstones
          orders.forEach((order) => {
            order.items.forEach((item) => {
              if (item.gemstone && item.gemstone.id in imagesByGemstone) {
                item.gemstone.images = imagesByGemstone[item.gemstone.id];
              }
            });
          });
        }
      }

      this.logger.info("Orders fetched successfully", {
        total,
        page,
        limit,
        filters,
        hasMore,
      });

      return {
        success: true,
        orders,
        total,
        page,
        limit,
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

      // First, get the current order to validate the transition
      const { data: currentOrder, error: fetchError } = await this.supabase
        .from("orders")
        .select("*")
        .eq("id", order_id)
        .single();

      if (fetchError || !currentOrder) {
        this.logger.error("Order not found for status update", fetchError, {
          order_id,
        });
        throw new OrderManagementError("ORDER_NOT_FOUND", "Order not found");
      }

      // Validate status transition
      if (
        currentOrder.status &&
        !this.isValidStatusTransition(currentOrder.status, new_status)
      ) {
        this.logger.warn("Invalid status transition attempted", {
          order_id,
          current_status: currentOrder.status,
          new_status,
        });
        throw new OrderManagementError(
          "INVALID_STATUS_TRANSITION",
          `Cannot change status from ${currentOrder.status} to ${new_status}`
        );
      }

      // Update the order status
      const { data: updatedOrder, error: updateError } = await this.supabase
        .from("orders")
        .update({
          status: new_status,
          updated_at: new Date().toISOString(),
          notes: notes || currentOrder.notes,
        })
        .eq("id", order_id)
        .select("*")
        .single();

      if (updateError) {
        this.logger.error("Failed to update order status", updateError, {
          order_id,
          new_status,
        });
        throw new OrderManagementError(
          "NETWORK_ERROR",
          "Failed to update order status"
        );
      }

      // Fetch user data separately since relationships aren't defined
      const { data: userProfile } = await this.supabase
        .from("user_profiles")
        .select("id, name, phone")
        .eq("user_id", updatedOrder.user_id)
        .single();

      // Fetch order items separately
      const { data: orderItems } = await this.supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order_id);

      // Construct the complete order object
      const completeOrder: AdminOrder = {
        ...updatedOrder,
        status: updatedOrder.status || "pending", // Provide default value for null status
        currency_code: updatedOrder.currency_code || "USD", // Provide default value for null currency
        created_at: updatedOrder.created_at || new Date().toISOString(), // Provide default value for null created_at
        updated_at: updatedOrder.updated_at || new Date().toISOString(), // Provide default value for null updated_at
        delivery_address: updatedOrder.delivery_address as
          | string
          | null
          | undefined, // Cast delivery_address properly
        user: userProfile
          ? {
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.phone || "No email", // Using phone as email since email isn't in user_profiles
            }
          : {
              id: updatedOrder.user_id,
              name: "Unknown User",
              email: "No email",
            },
        items: (orderItems || []).map((item) => ({
          ...item,
          quantity: item.quantity || 1, // Provide default value for null quantity
        })),
      };

      // Log the status change
      this.logger.info("Order status updated successfully", {
        order_id,
        old_status: currentOrder.status,
        new_status,
        user_id: currentOrder.user_id,
      });

      return {
        success: true,
        order: completeOrder,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to update order status", error as Error, {
        request,
      });

      if (error instanceof OrderManagementError) {
        return { success: false, error: error.message };
      }

      return {
        success: false,
        error: "Failed to update order status. Please try again.",
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
      // Build date filter
      let dateFilter = "";
      if (dateRange) {
        dateFilter = `created_at.gte.${dateRange.from},created_at.lte.${dateRange.to}`;
      }

      // Get total orders and revenue
      let totalsQuery = this.supabase
        .from("orders")
        .select("total_amount, currency_code, status, user_id")
        .eq("status", "delivered"); // Only count completed orders

      if (dateRange) {
        totalsQuery = totalsQuery
          .gte("created_at", dateRange.from)
          .lte("created_at", dateRange.to);
      }

      const { data: totals, error: totalsError } = await totalsQuery;

      if (totalsError) {
        this.logger.error("Failed to fetch order totals", totalsError);
        throw new OrderManagementError(
          "NETWORK_ERROR",
          "Failed to fetch analytics"
        );
      }

      // Calculate basic metrics
      const total_orders = totals?.length || 0;
      const total_revenue =
        totals?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const average_order_value =
        total_orders > 0 ? total_revenue / total_orders : 0;

      // Get orders by status
      let statusQuery = this.supabase.from("orders").select("status");

      if (dateRange) {
        statusQuery = statusQuery
          .gte("created_at", dateRange.from)
          .lte("created_at", dateRange.to);
      }

      const { data: statusData, error: statusError } = await statusQuery;

      const orders_by_status: Record<OrderStatus, number> = {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };

      statusData?.forEach((order) => {
        orders_by_status[order.status as OrderStatus]++;
      });

      // Get customer statistics
      const uniqueCustomers = new Set(totals?.map((order) => order.user_id));
      const total_customers = uniqueCustomers.size;
      const repeat_customers = Array.from(uniqueCustomers).filter((userId) => {
        return totals?.filter((order) => order.user_id === userId).length > 1;
      }).length;
      const average_orders_per_customer =
        total_customers > 0 ? total_orders / total_customers : 0;

      this.logger.info("Order analytics generated successfully", {
        total_orders,
        total_revenue,
        average_order_value,
        total_customers,
      });

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
          average_orders_per_customer,
        },
      };
    } catch (error) {
      this.logger.error("Failed to generate order analytics", error as Error);
      throw error;
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
