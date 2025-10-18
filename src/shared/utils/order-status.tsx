import { CheckCircle, Clock, Package, Truck, X } from "lucide-react";

import type { Database } from "@/shared/types/database";
import type { ReactNode } from "react";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface OrderStatusConfig {
  variant: BadgeVariant;
  colors: string;
  icon: string;
  label: string;
  description: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  pending: {
    variant: "outline",
    colors:
      "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30",
    icon: "Clock",
    label: "Pending",
    description: "Order is awaiting confirmation",
  },
  confirmed: {
    variant: "default",
    colors:
      "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30",
    icon: "CheckCircle",
    label: "Confirmed",
    description: "Order has been confirmed and is being processed",
  },
  processing: {
    variant: "default",
    colors:
      "bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30",
    icon: "Package",
    label: "Processing",
    description: "Order is being prepared for shipment",
  },
  shipped: {
    variant: "default",
    colors:
      "bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/30",
    icon: "Truck",
    label: "Shipped",
    description: "Order has been shipped and is in transit",
  },
  delivered: {
    variant: "default",
    colors:
      "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30",
    icon: "CheckCircle",
    label: "Delivered",
    description: "Order has been successfully delivered",
  },
  cancelled: {
    variant: "destructive",
    colors: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30",
    icon: "X",
    label: "Cancelled",
    description: "Order has been cancelled",
  },
};

/**
 * Get the configuration for an order status
 */
export function getOrderStatusConfig(status: string): OrderStatusConfig {
  const normalizedStatus = status.toLowerCase() as OrderStatus;
  return ORDER_STATUS_CONFIG[normalizedStatus] || ORDER_STATUS_CONFIG.pending;
}

/**
 * Get the badge variant for an order status
 */
export function getOrderStatusVariant(status: string): BadgeVariant {
  return getOrderStatusConfig(status).variant;
}

/**
 * Get the color classes for an order status badge
 */
export function getOrderStatusColors(status: string): string {
  return getOrderStatusConfig(status).colors;
}

/**
 * Get the icon name for an order status
 */
export function getOrderStatusIconName(status: string): string {
  return getOrderStatusConfig(status).icon;
}

/**
 * Get the React icon component for an order status
 */
export function getOrderStatusIcon(status: string): ReactNode {
  const iconName = getOrderStatusIconName(status);

  switch (iconName) {
    case "Clock":
      return <Clock className="w-3 h-3" />;
    case "CheckCircle":
      return <CheckCircle className="w-3 h-3" />;
    case "Package":
      return <Package className="w-3 h-3" />;
    case "Truck":
      return <Truck className="w-3 h-3" />;
    case "X":
      return <X className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
}

/**
 * Get the label for an order status
 */
export function getOrderStatusLabel(status: string): string {
  return getOrderStatusConfig(status).label;
}

/**
 * Get the description for an order status
 */
export function getOrderStatusDescription(status: string): string {
  return getOrderStatusConfig(status).description;
}

/**
 * Check if a status is considered "active" (not completed or cancelled)
 */
export function isActiveOrderStatus(status: string): boolean {
  const activeStatuses: OrderStatus[] = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
  ];
  return activeStatuses.includes(status.toLowerCase() as OrderStatus);
}

/**
 * Check if a status is considered "completed"
 */
export function isCompletedOrderStatus(status: string): boolean {
  return status.toLowerCase() === "delivered";
}

/**
 * Check if a status is considered "cancelled"
 */
export function isCancelledOrderStatus(status: string): boolean {
  return status.toLowerCase() === "cancelled";
}

/**
 * Get the progress percentage for an order status
 */
export function getOrderStatusProgress(status: string): number {
  const progressMap: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 25,
    processing: 50,
    shipped: 75,
    delivered: 100,
    cancelled: 0,
  };

  const normalizedStatus = status.toLowerCase() as OrderStatus;
  return progressMap[normalizedStatus] || 0;
}

/**
 * Get the next logical status in the order flow
 */
export function getNextOrderStatus(status: string): OrderStatus | null {
  const statusFlow: Record<OrderStatus, OrderStatus | null> = {
    pending: "confirmed",
    confirmed: "processing",
    processing: "shipped",
    shipped: "delivered",
    delivered: null,
    cancelled: null,
  };

  const normalizedStatus = status.toLowerCase() as OrderStatus;
  return statusFlow[normalizedStatus] || null;
}

/**
 * Get all possible next statuses for an order
 */
export function getPossibleNextStatuses(status: string): OrderStatus[] {
  const normalizedStatus = status.toLowerCase() as OrderStatus;

  switch (normalizedStatus) {
    case "pending":
      return ["confirmed", "cancelled"];
    case "confirmed":
      return ["processing", "cancelled"];
    case "processing":
      return ["shipped", "cancelled"];
    case "shipped":
      return ["delivered"];
    case "delivered":
      return [];
    case "cancelled":
      return [];
    default:
      return [];
  }
}
