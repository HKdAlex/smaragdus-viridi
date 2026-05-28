import type { OrderStatus } from "@/shared/types";
import { useTranslations } from "next-intl";

/**
 * Hook to get translated order status values
 */
export function useOrderTranslations() {
  const tStatuses = useTranslations("orders.statuses");
  const tAdminStatuses = useTranslations("admin.orders.statuses");
  const tUserStatuses = useTranslations("user.orders.statuses");
  const tAdminStatusDescriptions = useTranslations(
    "admin.orders.statusDescriptions"
  );
  const tUserStatusDescriptions = useTranslations(
    "user.orders.statusDescriptions"
  );
  const tOrderStatusDescriptions = useTranslations(
    "orders.statusDescriptions"
  );

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
    switch (context) {
      case "admin":
        return tAdminStatusDescriptions(status as any) || "";
      case "user":
        return tUserStatusDescriptions(status as any) || "";
      case "orders":
      default:
        return tOrderStatusDescriptions(status as any) || "";
    }
  };

  return {
    translateOrderStatus,
    translateOrderStatusDescription,
  };
}
