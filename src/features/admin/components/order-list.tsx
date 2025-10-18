"use client";

import {
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Package,
  Search,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import type {
  OrderListProps,
  OrderStatus,
} from "../types/order-management.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ORDER_STATUS_CONFIG } from "../types/order-management.types";
import { format } from "date-fns";
import { useOrderTranslations } from "@/features/orders/utils/order-translations";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function OrderList({
  orders,
  loading,
  onOrderSelect,
  onStatusUpdate,
  selectedOrderId,
}: OrderListProps) {
  const t = useTranslations("admin.orders");
  const { translateOrderStatus } = useOrderTranslations();
  const router = useRouter();
  const [sortField, setSortField] = useState<"created_at" | "total_amount">(
    "created_at"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.order_number?.replace(/^cq-/, "CQ-").includes(searchQuery) ||
        order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (field: "created_at" | "total_amount") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      await onStatusUpdate(orderId, newStatus);
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const handleOrderClick = (order: any) => {
    // Navigate to the order details page using the correct internationalized routing approach
    router.push({
      pathname: "/orders/[id]" as const,
      params: { id: order.id },
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config = ORDER_STATUS_CONFIG[status];
    return (
      <Badge variant={config.color as any} className="capitalize">
        {translateOrderStatus(status, "admin")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("title")}</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("title")}</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as OrderStatus | "all")
            }
          >
            <SelectTrigger className="w-32">
              <span className="text-sm">
                {statusFilter && statusFilter !== "all" ? (
                  translateOrderStatus(statusFilter as OrderStatus, "admin")
                ) : (
                  <span className="text-muted-foreground">
                    {t("filterByStatus")}
                  </span>
                )}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allStatuses")}</SelectItem>
              <SelectItem value="pending">
                {translateOrderStatus("pending", "admin")}
              </SelectItem>
              <SelectItem value="confirmed">
                {translateOrderStatus("confirmed", "admin")}
              </SelectItem>
              <SelectItem value="processing">
                {translateOrderStatus("processing", "admin")}
              </SelectItem>
              <SelectItem value="shipped">
                {translateOrderStatus("shipped", "admin")}
              </SelectItem>
              <SelectItem value="delivered">
                {translateOrderStatus("delivered", "admin")}
              </SelectItem>
              <SelectItem value="cancelled">
                {translateOrderStatus("cancelled", "admin")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 whitespace-nowrap">
                {t("orderNumber")}
              </TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("created_at")}
                  className="h-auto p-0 font-semibold"
                >
                  {t("date")}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("items")}</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("total_amount")}
                  className="h-auto p-0 font-semibold"
                >
                  {t("total")}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-20">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t("noOrdersFound")}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    selectedOrderId === order.id ? "bg-muted" : ""
                  }`}
                  onClick={() => handleOrderClick(order)}
                >
                  <TableCell className="font-mono text-sm whitespace-nowrap">
                    {order.order_number?.replace(/^cq-/, "CQ-") ||
                      order.id.slice(0, 8) + "..."}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {order.user?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.user?.email || "No email"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {order.items?.length || 0} {t("items")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.total_amount, order.currency_code)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleOrderClick(order)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {t("viewDetails")}
                        </DropdownMenuItem>
                        {order.status === "pending" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(order.id, "confirmed")
                            }
                          >
                            {t("confirmOrder")}
                          </DropdownMenuItem>
                        )}
                        {order.status === "confirmed" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(order.id, "processing")
                            }
                          >
                            {t("startProcessing")}
                          </DropdownMenuItem>
                        )}
                        {order.status === "processing" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(order.id, "shipped")
                            }
                          >
                            {t("markAsShipped")}
                          </DropdownMenuItem>
                        )}
                        {order.status === "shipped" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(order.id, "delivered")
                            }
                          >
                            {t("markAsDelivered")}
                          </DropdownMenuItem>
                        )}
                        {order.status !== "cancelled" &&
                          order.status !== "delivered" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(order.id, "cancelled")
                              }
                              className="text-red-600"
                            >
                              {t("cancelOrder")}
                            </DropdownMenuItem>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{t("showingOrders", { count: filteredOrders.length })}</span>
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="h-auto p-1"
          >
            <X className="w-4 h-4 mr-1" />
            {t("clearSearch")}
          </Button>
        )}
      </div>
    </div>
  );
}
