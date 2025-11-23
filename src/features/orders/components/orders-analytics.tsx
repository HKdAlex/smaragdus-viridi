"use client";

import {
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  Gem,
  MapPin,
  Package,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type {
  UserOrder,
  UserProfile,
} from "@/features/user/types/user-profile.types";

import { Badge } from "@/shared/components/ui/badge";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/features/currency/hooks/use-currency";

interface OrdersAnalyticsProps {
  orders: UserOrder[];
  userProfile: UserProfile | null;
  locale: string;
}

export function OrdersAnalytics({
  orders,
  userProfile,
  locale,
}: OrdersAnalyticsProps) {
  const t = useTranslations("orders");

  // Use currency context for price formatting
  const { formatPrice, convertPrice } = useCurrency();
  
  const formatCurrency = (amount: number, currency: string) => {
    // Convert from stored currency (USD base) to selected currency
    return formatPrice(convertPrice(amount, "USD"));
  };

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    if (!orders.length) return null;

    // Time-based analysis
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const ordersLast7Days = orders.filter(
      (o) => new Date(o.created_at) >= last7Days
    );
    const ordersLast30Days = orders.filter(
      (o) => new Date(o.created_at) >= last30Days
    );
    const ordersLast90Days = orders.filter(
      (o) => new Date(o.created_at) >= last90Days
    );
    const ordersLastYear = orders.filter(
      (o) => new Date(o.created_at) >= lastYear
    );

    // Spending analysis
    const totalSpent = orders.reduce(
      (sum, order) => sum + order.total_amount,
      0
    );
    const spentLast30Days = ordersLast30Days.reduce(
      (sum, order) => sum + order.total_amount,
      0
    );
    const spentLast90Days = ordersLast90Days.reduce(
      (sum, order) => sum + order.total_amount,
      0
    );

    // Order patterns
    const averageOrderValue = totalSpent / orders.length;
    const largestOrder = Math.max(...orders.map((o) => o.total_amount));
    const smallestOrder = Math.min(...orders.map((o) => o.total_amount));

    // Status distribution
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Popular gemstones
    const gemstoneFrequency = orders
      .flatMap((order) => order.items.map((item) => item.gemstone.name))
      .reduce((acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topGemstones = Object.entries(gemstoneFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Shipping destinations
    const shippingDestinations = orders
      .filter((order) => order.delivery_address)
      .map(
        (order) =>
          `${order.delivery_address?.city}, ${order.delivery_address?.country}`
      )
      .reduce((acc, destination) => {
        acc[destination] = (acc[destination] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topDestinations = Object.entries(shippingDestinations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Calculate trends
    const spendingTrend =
      spentLast30Days > spentLast90Days / 3 ? "increasing" : "decreasing";
    const orderFrequencyTrend =
      ordersLast30Days.length > ordersLast90Days.length / 3
        ? "increasing"
        : "stable";

    return {
      totalSpent,
      spentLast30Days,
      spentLast90Days,
      ordersLast7Days: ordersLast7Days.length,
      ordersLast30Days: ordersLast30Days.length,
      ordersLastYear: ordersLastYear.length,
      averageOrderValue,
      largestOrder,
      smallestOrder,
      statusCounts,
      topGemstones,
      topDestinations,
      spendingTrend,
      orderFrequencyTrend,
    };
  }, [orders]);

  if (!analytics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            {t("analytics.noData")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("analytics.title")}</h2>
          <p className="text-muted-foreground">{t("analytics.subtitle")}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {orders.length} {t("analytics.ordersAnalyzed")}
        </Badge>
      </div>

      {/* Spending Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              {t("analytics.spendingOverview")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("analytics.last30Days")}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  analytics.spentLast30Days,
                  userProfile?.preferred_currency || "USD"
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("analytics.last90Days")}
              </p>
              <p className="text-lg font-semibold">
                {formatCurrency(
                  analytics.spentLast90Days,
                  userProfile?.preferred_currency || "USD"
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp
                className={`w-4 h-4 ${
                  analytics.spendingTrend === "increasing"
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {analytics.spendingTrend === "increasing"
                  ? t("analytics.spendingIncreasing")
                  : t("analytics.spendingDecreasing")}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              {t("analytics.orderPatterns")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("analytics.averageOrderValue")}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  analytics.averageOrderValue,
                  userProfile?.preferred_currency || "USD"
                )}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">
                  {t("analytics.largest")}
                </p>
                <p className="font-semibold">
                  {formatCurrency(
                    analytics.largestOrder,
                    userProfile?.preferred_currency || "USD"
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  {t("analytics.smallest")}
                </p>
                <p className="font-semibold">
                  {formatCurrency(
                    analytics.smallestOrder,
                    userProfile?.preferred_currency || "USD"
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-600" />
              {t("analytics.recentActivity")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("analytics.last30Days")}
              </p>
              <p className="text-2xl font-bold">
                {analytics.ordersLast30Days} {t("analytics.orders")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("analytics.thisYear")}
              </p>
              <p className="text-lg font-semibold">
                {analytics.ordersLastYear} {t("analytics.orders")}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar
                className={`w-4 h-4 ${
                  analytics.orderFrequencyTrend === "increasing"
                    ? "text-green-500"
                    : "text-gray-500"
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {analytics.orderFrequencyTrend === "increasing"
                  ? t("analytics.frequencyIncreasing")
                  : t("analytics.frequencyStable")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              {t("analytics.orderStatus")}
            </CardTitle>
            <CardDescription>
              {t("analytics.orderStatusDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="capitalize">
                      {t(`status.${status}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{count}</span>
                    <span className="text-sm text-muted-foreground">
                      ({Math.round((count / orders.length) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Popular Gemstones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gem className="w-5 h-5 mr-2" />
              {t("analytics.popularGemstones")}
            </CardTitle>
            <CardDescription>
              {t("analytics.popularGemstonesDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topGemstones.map(([gemstone, count], index) => (
                <div
                  key={gemstone}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium capitalize">{gemstone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold">{count}</span>
                    <span className="text-sm text-muted-foreground">
                      {t("analytics.purchases")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Destinations */}
        {analytics.topDestinations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {t("analytics.shippingDestinations")}
              </CardTitle>
              <CardDescription>
                {t("analytics.shippingDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topDestinations.map(([destination, count]) => (
                  <div
                    key={destination}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium">{destination}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">{count}</span>
                      <span className="text-sm text-muted-foreground">
                        {t("analytics.shipments")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
