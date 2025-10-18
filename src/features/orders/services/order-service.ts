import { Logger } from "@/shared/utils/logger";
import type { OrderStatus } from "@/shared/types";
import { supabase } from "@/lib/supabase";

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
}

// Export as orderService for compatibility
export const orderService = new OrderService();
