"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ChevronRight, MapPin, Package, Plus, Search } from "lucide-react";
import Link from "next/link";
import {
  ORDER_STATUS_CONFIG,
  type OrderStatus,
  type UserOrder,
} from "../types/user-profile.types";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Separator } from "@/shared/components/ui/separator";
import { format } from "date-fns";
import { useState } from "react";

interface OrderHistoryProps {
  orders?: UserOrder[];
  loading?: boolean;
  onOrderSelect?: (order: UserOrder) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function OrderHistory({
  orders = [],
  loading = false,
  onOrderSelect,
  onLoadMore,
  hasMore = false,
}: OrderHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchQuery ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item) =>
        item.gemstone.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
        {config.label}
      </Badge>
    );
  };

  const getOrderSummary = (order: UserOrder) => {
    const totalItems = order.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const gemstoneNames = order.items
      .map((item) => item.gemstone.name)
      .slice(0, 2)
      .join(", ");
    const moreItems =
      order.items.length > 2 ? ` +${order.items.length - 2} more` : "";

    return `${totalItems} item${
      totalItems !== 1 ? "s" : ""
    }: ${gemstoneNames}${moreItems}`;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Order History</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Order History</h2>
          <p className="text-muted-foreground">
            View and track your past orders
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search orders..."
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
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "You haven't placed any orders yet"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button asChild>
                <Link href="/catalog">
                  <Plus className="w-4 h-4 mr-2" />
                  Start Shopping
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                onOrderSelect ? "hover:shadow-md" : ""
              }`}
              onClick={() => onOrderSelect?.(order)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.id.slice(0, 8)}
                      </CardTitle>
                      <CardDescription>
                        {format(
                          new Date(order.created_at),
                          "MMMM d, yyyy 'at' h:mm a"
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(order.status)}
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(
                          order.total_amount,
                          order.currency_code
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.currency_code}
                      </div>
                    </div>
                    {onOrderSelect && (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {getOrderSummary(order)}
                  </p>

                  <Separator />

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <span className="text-muted-foreground">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </span>
                      {order.delivery_address && (
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1" />
                          {order.delivery_address.city},{" "}
                          {order.delivery_address.country}
                        </div>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      Last updated:{" "}
                      {format(new Date(order.updated_at), "MMM d, h:mm a")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={onLoadMore} disabled={loading}>
                {loading ? "Loading..." : "Load More Orders"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {orders.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Showing {filteredOrders.length} of {orders.length} orders
                {searchQuery && ` matching "${searchQuery}"`}
                {statusFilter !== "all" && ` with status "${statusFilter}"`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
