import type { OrderStatus } from "@/shared/types";
import { useTranslations } from "next-intl";

/**
 * Hook to get translated order status values
 */
export function useOrderTranslations() {
  const tStatuses = useTranslations("orders.statuses");
  const tAdminStatuses = useTranslations("admin.orders.statuses");
  const tUserStatuses = useTranslations("user.orders.statuses");

  const translateOrderStatus = (
    status: OrderStatus,
    context: "admin" | "user" | "orders" = "orders"
  ) => {
    switch (context) {
      case "admin":
        return tAdminStatuses(status as any) || status;
      case "user":
        return tUserStatuses(status as any) || status;
      case "orders":
      default:
        return tStatuses(status as any) || status;
    }
  };

  const translateOrderStatusDescription = (
    status: OrderStatus,
    context: "admin" | "user" | "orders" = "orders"
  ) => {
    const descriptions = {
      admin: useTranslations("admin.orders.statusDescriptions"),
      user: useTranslations("user.orders.statusDescriptions"),
      orders: useTranslations("orders.statusDescriptions"),
    };

    return descriptions[context](status as any) || "";
  };

  return {
    translateOrderStatus,
    translateOrderStatusDescription,
  };
}

/**
 * Get localized order status configuration
 */
export function getLocalizedOrderStatusConfig(
  status: OrderStatus,
  context: "admin" | "user" | "orders" = "orders"
) {
  const { translateOrderStatus, translateOrderStatusDescription } =
    useOrderTranslations();

  const baseConfig = {
    pending: {
      color: "outline" as const,
      nextStatuses: ["confirmed", "cancelled"] as OrderStatus[],
    },
    confirmed: {
      color: "outline" as const,
      nextStatuses: ["processing", "cancelled"] as OrderStatus[],
    },
    processing: {
      color: "outline" as const,
      nextStatuses: ["shipped", "cancelled"] as OrderStatus[],
    },
    shipped: {
      color: "outline" as const,
      nextStatuses: ["delivered"] as OrderStatus[],
    },
    delivered: {
      color: "default" as const,
      nextStatuses: [] as OrderStatus[],
    },
    cancelled: {
      color: "secondary" as const,
      nextStatuses: [] as OrderStatus[],
    },
  };

  return {
    label: translateOrderStatus(status, context),
    description: translateOrderStatusDescription(status, context),
    ...baseConfig[status],
  };
}
