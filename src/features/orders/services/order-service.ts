import { Logger } from "@/shared/utils/logger";
import type { OrderStatus } from "@/shared/types";
import { supabase } from "@/lib/supabase";
import { userActivityService } from "@/features/user/services/user-activity-service";

export interface CreateOrderRequest {
  user_id: string;
  items: Array<{
    gemstone_id: string;
    quantity: number;
    unit_price: number;
  }>;
  currency_code: string;
  delivery_address?: any;
  payment_type?: "bank_transfer" | "crypto" | "cash" | "stripe";
  notes?: string;
}

export interface OrderResult {
  success: boolean;
  order?: {
    id: string;
    status: OrderStatus;
    total_amount: number;
    currency_code: string;
    created_at: string;
    order_number?: string | null;
    items: Array<{
      gemstone_id: string;
      quantity: number;
      unit_price: number;
      line_total: number;
      gemstone?: {
        id: string;
        name: string;
        color: string;
        cut: string;
        weight_carats: number;
        serial_number: string;
        images?: Array<{
          id: string;
          image_url: string;
          image_order: number;
          is_primary: boolean;
        }>;
      };
    }>;
    payment: {
      reference: string;
      processed_at: string;
      simulated: boolean;
    };
  };
  error?: string;
}

export class OrderService {
  private logger = new Logger("OrderService");

  async createOrder(request: CreateOrderRequest): Promise<OrderResult> {
    try {
      this.logger.info("Creating order", {
        userId: request.user_id,
        itemCount: request.items.length,
      });

      // Calculate total amount
      const totalAmount = request.items.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      );

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: request.user_id,
          status: "pending",
          delivery_address: request.delivery_address || null,
          payment_type: request.payment_type || "bank_transfer",
          total_amount: totalAmount,
          currency_code: request.currency_code as
            | "USD"
            | "EUR"
            | "GBP"
            | "RUB"
            | "CHF"
            | "JPY",
          notes: request.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) {
        this.logger.error("Failed to create order", orderError);
        return {
          success: false,
          error: "Failed to create order: " + orderError.message,
        };
      }

      // Create order items
      const orderItems = request.items.map((item) => ({
        order_id: order.id,
        gemstone_id: item.gemstone_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.unit_price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        this.logger.error("Failed to create order items", itemsError);
        return {
          success: false,
          error: "Failed to create order items: " + itemsError.message,
        };
      }

      // Remove items from cart
      const gemstoneIds = request.items.map((item) => item.gemstone_id);
      const { error: cartError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", request.user_id)
        .in("gemstone_id", gemstoneIds);

      if (cartError) {
        this.logger.warn("Failed to remove items from cart", cartError);
        // Don't fail the order creation if cart cleanup fails
      }

      // Generate payment reference
      const paymentReference = `PAY-${order.id
        .slice(0, 8)
        .toUpperCase()}-${Date.now()}`;

      // Log order placed activity
      await userActivityService.logActivity(
        request.user_id,
        'order_placed',
        `Placed order ${order.order_number || order.id.slice(0, 8)}`,
        {
          orderId: order.id,
          orderNumber: order.order_number,
          totalAmount,
          itemCount: request.items.length,
          currency: request.currency_code,
        }
      );

      this.logger.info("Order created successfully", {
        orderId: order.id,
        totalAmount,
        itemCount: request.items.length,
      });

      return {
        success: true,
        order: {
          id: order.id,
          status: order.status as OrderStatus,
          total_amount: order.total_amount,
          currency_code: order.currency_code as
            | "USD"
            | "EUR"
            | "GBP"
            | "RUB"
            | "CHF"
            | "JPY",
          created_at: order.created_at || new Date().toISOString(),
          order_number: order.order_number,
          items: orderItems.map((item) => ({
            gemstone_id: item.gemstone_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total,
          })),
          payment: {
            reference: paymentReference,
            processed_at: new Date().toISOString(),
            simulated: true, // For now, simulate payment processing
          },
        },
      };
    } catch (error) {
      this.logger.error("Unexpected error creating order", error as Error);
      return {
        success: false,
        error: "An unexpected error occurred while creating the order",
      };
    }
  }

  async getOrder(orderId: string, userId: string): Promise<OrderResult> {
    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            *,
            gemstones (
              id,
              name,
              color,
              cut,
              weight_carats,
              serial_number,
              gemstone_images (
                id,
                image_url,
                image_order,
                is_primary
              )
            )
          )
        `
        )
        .eq("id", orderId)
        .eq("user_id", userId)
        .single();

      if (orderError) {
        this.logger.error("Failed to get order", orderError);
        return {
          success: false,
          error: "Failed to get order: " + orderError.message,
        };
      }

      return {
        success: true,
        order: {
          id: order.id,
          status: order.status as OrderStatus,
          total_amount: order.total_amount,
          currency_code: order.currency_code as
            | "USD"
            | "EUR"
            | "GBP"
            | "RUB"
            | "CHF"
            | "JPY",
          created_at: order.created_at || new Date().toISOString(),
          items: order.order_items.map((item: any) => ({
            gemstone_id: item.gemstone_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total,
            gemstone: item.gemstones
              ? {
                  id: item.gemstones.id,
                  name: item.gemstones.name,
                  color: item.gemstones.color,
                  cut: item.gemstones.cut,
                  weight_carats: item.gemstones.weight_carats,
                  serial_number: item.gemstones.serial_number,
                  images:
                    item.gemstones.gemstone_images?.map((img: any) => ({
                      id: img.id,
                      image_url: img.image_url,
                      image_order: img.image_order,
                      is_primary: img.is_primary,
                    })) || [],
                }
              : undefined,
          })),
          payment: {
            reference: `PAY-${order.id.slice(0, 8).toUpperCase()}`,
            processed_at: order.created_at || new Date().toISOString(),
            simulated: true,
          },
        },
      };
    } catch (error) {
      this.logger.error("Unexpected error getting order", error as Error);
      return {
        success: false,
        error: "An unexpected error occurred while getting the order",
      };
    }
  }

  /**
   * Cancel an order (user-initiated)
   * Only pending or confirmed orders can be cancelled by users
   */
  async cancelOrder(
    orderId: string,
    userId: string,
    reason?: string
  ): Promise<OrderResult> {
    try {
      this.logger.info("Cancelling order", { orderId, userId, reason });

      // Get the order to verify ownership and status
      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("id, status, user_id")
        .eq("id", orderId)
        .eq("user_id", userId)
        .single();

      if (fetchError || !order) {
        this.logger.error("Order not found or access denied", fetchError);
        return {
          success: false,
          error: "Order not found or you do not have permission to cancel it",
        };
      }

      // Check if order can be cancelled
      const cancellableStatuses: OrderStatus[] = ["pending", "confirmed"];
      if (!cancellableStatuses.includes(order.status as OrderStatus)) {
        this.logger.warn("Order cannot be cancelled", {
          orderId,
          currentStatus: order.status,
        });
        return {
          success: false,
          error: `Orders with status "${order.status}" cannot be cancelled. Only pending or confirmed orders can be cancelled.`,
        };
      }

      // Update order status to cancelled
      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          notes: reason
            ? `Cancelled by user: ${reason}`
            : "Cancelled by user",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select()
        .single();

      if (updateError) {
        this.logger.error("Failed to cancel order", updateError);
        return {
          success: false,
          error: "Failed to cancel order: " + updateError.message,
        };
      }

      // Log the cancellation event
      await supabase.from("order_events").insert({
        order_id: orderId,
        event_type: "status_changed",
        title: "Order cancelled",
        description: reason || "Cancelled by user",
        metadata: {
          old_status: order.status,
          new_status: "cancelled",
          cancelled_by: userId,
        },
        performed_by: userId,
        is_internal: false,
      }).then(({ error }) => {
        if (error) {
          this.logger.warn("Failed to log order event", error);
        }
      });

      // Log order status changed activity
      await userActivityService.logActivity(
        userId,
        'order_status_changed',
        `Order cancelled${reason ? `: ${reason}` : ''}`,
        {
          orderId,
          oldStatus: order.status,
          newStatus: 'cancelled',
          reason,
        }
      );

      this.logger.info("Order cancelled successfully", { orderId });

      return {
        success: true,
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status as OrderStatus,
          total_amount: updatedOrder.total_amount,
          currency_code: updatedOrder.currency_code as
            | "USD"
            | "EUR"
            | "GBP"
            | "RUB"
            | "CHF"
            | "JPY",
          created_at: updatedOrder.created_at || new Date().toISOString(),
          order_number: updatedOrder.order_number,
          items: [],
          payment: {
            reference: `PAY-${updatedOrder.id.slice(0, 8).toUpperCase()}`,
            processed_at: updatedOrder.created_at || new Date().toISOString(),
            simulated: true,
          },
        },
      };
    } catch (error) {
      this.logger.error("Unexpected error cancelling order", error as Error);
      return {
        success: false,
        error: "An unexpected error occurred while cancelling the order",
      };
    }
  }

  /**
   * Admin cancel order - can cancel any order with reason
   */
  async adminCancelOrder(
    orderId: string,
    adminId: string,
    reason: string
  ): Promise<OrderResult> {
    try {
      this.logger.info("Admin cancelling order", { orderId, adminId, reason });

      // Get the order
      const { data: order, error: fetchError } = await supabase
        .from("orders")
        .select("id, status, user_id")
        .eq("id", orderId)
        .single();

      if (fetchError || !order) {
        this.logger.error("Order not found", fetchError);
        return {
          success: false,
          error: "Order not found",
        };
      }

      // Check if order is already cancelled or delivered
      if (order.status === "cancelled") {
        return {
          success: false,
          error: "Order is already cancelled",
        };
      }

      if (order.status === "delivered") {
        return {
          success: false,
          error: "Delivered orders cannot be cancelled. Please process a refund instead.",
        };
      }

      // Update order status
      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({
          status: "cancelled",
          notes: `Cancelled by admin: ${reason}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select()
        .single();

      if (updateError) {
        this.logger.error("Failed to cancel order", updateError);
        return {
          success: false,
          error: "Failed to cancel order: " + updateError.message,
        };
      }

      // Log the cancellation event
      await supabase.from("order_events").insert({
        order_id: orderId,
        event_type: "status_changed",
        title: "Order cancelled by admin",
        description: `Admin cancellation: ${reason}`,
        metadata: {
          old_status: order.status,
          new_status: "cancelled",
          cancelled_by: adminId,
          admin_action: true,
        },
        performed_by: adminId,
        is_internal: true,
      }).then(({ error }) => {
        if (error) {
          this.logger.warn("Failed to log order event", error);
        }
      });

      this.logger.info("Order cancelled by admin", { orderId, adminId });

      return {
        success: true,
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status as OrderStatus,
          total_amount: updatedOrder.total_amount,
          currency_code: updatedOrder.currency_code as
            | "USD"
            | "EUR"
            | "GBP"
            | "RUB"
            | "CHF"
            | "JPY",
          created_at: updatedOrder.created_at || new Date().toISOString(),
          order_number: updatedOrder.order_number,
          items: [],
          payment: {
            reference: `PAY-${updatedOrder.id.slice(0, 8).toUpperCase()}`,
            processed_at: updatedOrder.created_at || new Date().toISOString(),
            simulated: true,
          },
        },
      };
    } catch (error) {
      this.logger.error("Unexpected error in admin cancel", error as Error);
      return {
        success: false,
        error: "An unexpected error occurred while cancelling the order",
      };
    }
  }
}

// Export as orderService for compatibility
export const orderService = new OrderService();
