"use client";

import type { AdminOrder } from "../types/order-management.types";
import { OrderDetail } from "./order-detail";
import { OrderList } from "./order-list";
import { useAdminOrders } from "../hooks/use-admin-orders";
import { useState } from "react";

type ViewMode = "list" | "detail";

export function OrderManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const { orders, loading, error, updateOrderStatus, refresh } =
    useAdminOrders();

  const handleOrderSelect = (order: AdminOrder) => {
    setSelectedOrder(order);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
    setViewMode("list");
    // Refresh orders when going back to list
    refresh();
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);

      // Update selected order if it's the one being updated
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: newStatus as any } : null
        );
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      throw error;
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading orders</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (viewMode === "detail" && selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onStatusUpdate={handleStatusUpdate}
        onBack={handleBackToList}
        loading={false}
      />
    );
  }

  return (
    <OrderList
      orders={orders}
      loading={loading}
      onOrderSelect={handleOrderSelect}
      onStatusUpdate={handleStatusUpdate}
      selectedOrderId={selectedOrder?.id}
    />
  );
}
