"use client";

import {
  Calendar,
  Download,
  Package,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type {
  ProfileStats,
  UserProfile,
} from "@/features/user/types/user-profile.types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

import { Button } from "@/shared/components/ui/button";
import { OrderHistory } from "@/features/user/components/order-history";
import { OrdersAnalytics } from "./orders-analytics";
import { Separator } from "@/shared/components/ui/separator";
import { useOrderHistory } from "@/features/user/hooks/use-order-history";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/features/currency/hooks/use-currency";

interface OrdersDashboardProps {
  userId: string;
  userProfile: UserProfile | null;
  stats: ProfileStats;
  locale: string;
}

export function OrdersDashboard({
  userId,
  userProfile,
  stats,
  locale,
}: OrdersDashboardProps) {
  const t = useTranslations("orders");
  const [selectedTab, setSelectedTab] = useState("all-orders");

  const { orders, loading, error, total, hasMore, loadMore, refresh } =
    useOrderHistory(userId);

  // Use currency context for price formatting
  const { formatPrice, convertPrice } = useCurrency();
  
  const formatCurrency = (amount: number, currency: string) => {
    // Convert from stored currency (USD base) to selected currency
    return formatPrice(amount, "USD");
  };

  // Calculate real-time stats from loaded orders
  const calculateLiveStats = () => {
    if (!orders.length) return null;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentOrders = orders.filter(
      (order) => new Date(order.created_at) >= last30Days
    );

    const pendingOrders = orders.filter((order) => order.status === "pending");
    const shippedOrders = orders.filter((order) => order.status === "shipped");
    const deliveredOrders = orders.filter(
      (order) => order.status === "delivered"
    );

    return {
      totalOrders: orders.length,
      recentOrders: recentOrders.length,
      pendingCount: pendingOrders.length,
      shippedCount: shippedOrders.length,
      deliveredCount: deliveredOrders.length,
      recentSpending: recentOrders.reduce(
        (sum, order) => sum + order.total_amount,
        0
      ),
    };
  };

  const liveStats = calculateLiveStats();

  const handleExportOrders = async () => {
    // TODO: Implement CSV export functionality
    console.log("Exporting orders...");
  };

  const handleBulkAction = (action: string, selectedOrders: string[]) => {
    // TODO: Implement bulk actions
    console.log(`Bulk action: ${action}`, selectedOrders);
  };

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            {t("dashboard.refresh")}
          </Button>

          <Button variant="outline" onClick={handleExportOrders}>
            <Download className="w-4 h-4 mr-2" />
            {t("dashboard.export")}
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.totalOrders")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              {liveStats?.recentOrders || 0} {t("stats.inLast30Days")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.totalSpent")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                stats.totalSpent,
                userProfile?.preferred_currency || "USD"
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {liveStats &&
                formatCurrency(
                  liveStats.recentSpending,
                  userProfile?.preferred_currency || "USD"
                )}{" "}
              {t("stats.thisMonth")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.pendingOrders")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveStats?.pendingCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {liveStats?.shippedCount || 0} {t("stats.shipped")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.avgOrderValue")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                stats.averageOrderValue,
                userProfile?.preferred_currency || "USD"
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("stats.lifetime")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Content */}
      <div className="space-y-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-1 lg:grid-cols-4">
            <TabsTrigger value="all-orders">{t("tabs.allOrders")}</TabsTrigger>
            <TabsTrigger value="pending">{t("tabs.pending")}</TabsTrigger>
            <TabsTrigger value="in-transit">{t("tabs.inTransit")}</TabsTrigger>
            <TabsTrigger value="delivered">{t("tabs.delivered")}</TabsTrigger>
          </TabsList>

          <TabsContent value="all-orders" className="space-y-6">
            <OrderHistory
              orders={orders}
              loading={loading}
              onOrderSelect={(order) => {
                // Navigate to individual order page
                window.location.href = `/orders/${order.id}`;
              }}
              onLoadMore={loadMore}
              hasMore={hasMore}
            />
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <OrderHistory
              orders={orders.filter((order) => order.status === "pending")}
              loading={loading}
              onOrderSelect={(order) => {
                window.location.href = `/orders/${order.id}`;
              }}
            />
          </TabsContent>

          <TabsContent value="in-transit" className="space-y-6">
            <OrderHistory
              orders={orders.filter(
                (order) =>
                  order.status === "confirmed" ||
                  order.status === "processing" ||
                  order.status === "shipped"
              )}
              loading={loading}
              onOrderSelect={(order) => {
                window.location.href = `/orders/${order.id}`;
              }}
            />
          </TabsContent>

          <TabsContent value="delivered" className="space-y-6">
            <OrderHistory
              orders={orders.filter((order) => order.status === "delivered")}
              loading={loading}
              onOrderSelect={(order) => {
                window.location.href = `/orders/${order.id}`;
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Analytics Deep Dive */}
      {orders.length > 0 && (
        <div className="mt-8">
          <Separator className="mb-6" />
          <OrdersAnalytics
            orders={orders}
            userProfile={userProfile}
            locale={locale}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <Package className="w-4 h-4" />
              <span>Error loading orders: {error}</span>
            </div>
            <Button variant="outline" onClick={refresh} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
