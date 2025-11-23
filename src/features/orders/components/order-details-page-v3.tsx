"use client";

import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  Mail,
  Package,
  Phone,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  getOrderStatusColors,
  getOrderStatusIcon,
  getOrderStatusVariant,
} from "@/shared/utils/order-status";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import Image from "next/image";
import type { Order } from "@/shared/types";
import { OrderTimeline } from "./order-timeline";
import type { OrderTimeline as OrderTimelineType } from "../types/order-tracking.types";
import { Separator } from "@/shared/components/ui/separator";
import { format } from "date-fns";
import { useGemstoneTranslations } from "@/features/gemstones/utils/gemstone-translations";
import { useOrderTranslations } from "../utils/order-translations";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/features/currency/hooks/use-currency";

interface OrderDetailsPageProps {
  orderId: string;
  locale: string;
  isAdmin?: boolean;
}

export function OrderDetailsPageV3({
  orderId,
  locale,
  isAdmin = false,
}: OrderDetailsPageProps) {
  const router = useRouter();
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const { translateColor, translateCut, translateGemstoneType } =
    useGemstoneTranslations();
  const { translateOrderStatus } = useOrderTranslations();

  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<OrderTimelineType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrderDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch order details from API
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          "Content-Type": "application/json",
          // Add admin context header if user is admin
          ...(isAdmin && { "X-Admin-Context": "true" }),
        },
      });
      const result = await response.json();

      if (result.success && result.order) {
        setOrder(result.order);

        // Load order timeline from API
        const eventsRes = await fetch(`/api/orders/${orderId}/events`);
        const eventsJson = await eventsRes.json();
        if (eventsJson.success && eventsJson.timeline) {
          setTimeline(eventsJson.timeline as OrderTimelineType);
        }
      } else {
        setError(result.error || "Failed to load order details");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [orderId, isAdmin]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  // Use currency context for price formatting
  const { formatPrice, convertPrice } = useCurrency();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "PPP 'at' p");
    } catch {
      return dateString;
    }
  };

  const getStatusLabel = (status: string) => {
    return translateOrderStatus(status as any, isAdmin ? "admin" : "orders");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-20 bg-muted rounded animate-pulse" />
                <div className="h-8 w-40 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-8 w-24 bg-muted rounded animate-pulse" />
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-muted rounded-lg animate-pulse" />
                <div className="h-48 bg-muted rounded-lg animate-pulse" />
              </div>
              <div className="space-y-6">
                <div className="h-80 bg-muted rounded-lg animate-pulse" />
                <div className="h-32 bg-muted rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border border-white/10 shadow-xl bg-white/5 backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <AlertCircle className="w-6 h-6 text-destructive" />
              {t("errorTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error || t("orderNotFound")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("back")}
              </Button>
              <Button onClick={() => router.push("/orders")}>
                {t("viewAllOrders")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Enhanced Header - Mobile Optimized */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2 hover:bg-muted/50 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t("back")}</span>
              </Button>
              <div className="hidden sm:block w-px h-6 bg-border flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg lg:text-xl font-semibold truncate">
                  {t("orderDetails")}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("orderNumber")}:{" "}
                  {order.order_number || order.id.slice(0, 8)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <Badge
                variant={getOrderStatusVariant(order.status || "pending")}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm ${getOrderStatusColors(
                  order.status || "pending"
                )}`}
              >
                {getOrderStatusIcon(order.status || "pending")}
                <span className="hidden xs:inline">
                  {getStatusLabel(order.status || "pending")}
                </span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile First */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Order Items & Timeline */}
          <div className="lg:col-span-3 space-y-6">
            {/* Order Items - Mobile Optimized */}
            <Card className="border border-white/10 shadow-xl bg-white/5 backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl font-bold">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  {t("orderItems")}
                  <Badge variant="outline" className="ml-auto text-xs">
                    {order.items?.length || 0} {t("items")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {order.items?.map((item, index) => (
                  <div key={item.id} className="group">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 hover:shadow-lg hover:bg-white/10">
                      {/* Enhanced Gemstone Image - Mobile Responsive */}
                      <div className="relative w-full sm:w-24 h-32 sm:h-24 bg-muted rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-200">
                        {item.gemstone?.images?.find((img) => img.is_primary)
                          ?.image_url ? (
                          <Image
                            src={
                              item.gemstone.images.find((img) => img.is_primary)
                                ?.image_url!
                            }
                            alt={item.gemstone.name}
                            fill
                            className="object-cover rounded-xl"
                            sizes="(max-width: 640px) 100vw, 96px"
                          />
                        ) : item.gemstone?.images?.[0]?.image_url ? (
                          <Image
                            src={item.gemstone.images[0].image_url}
                            alt={item.gemstone.name}
                            fill
                            className="object-cover rounded-xl"
                            sizes="(max-width: 640px) 100vw, 96px"
                          />
                        ) : (
                          <Package className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                        )}
                        <div className="absolute top-2 right-2 sm:-top-2 sm:-right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {item.quantity}
                        </div>
                      </div>

                      {/* Enhanced Item Details - Mobile Optimized */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-base sm:text-lg text-foreground">
                            {translateGemstoneType(item.gemstone?.name || "")}{" "}
                            {translateColor(item.gemstone?.color || "")}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {translateCut(item.gemstone?.cut || "")}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-primary rounded-full" />
                              {item.gemstone?.weight_carats}ct
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono break-all">
                            {t("serialNumber")}: {item.gemstone?.serial_number}
                          </p>
                        </div>

                        {/* Price - Mobile Optimized */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                          <div className="space-y-1">
                            <div className="font-bold text-lg sm:text-xl text-foreground">
                              {formatPrice(convertPrice(item.line_total, "USD"))}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.quantity} × {formatPrice(convertPrice(item.unit_price, "USD"))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < (order.items?.length || 0) - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                )) || (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">
                      {t("noItems")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Order Timeline - Mobile Optimized */}
            {timeline && (
              <OrderTimeline
                timeline={timeline}
                showInternalEvents={false}
                className="border border-white/10 shadow-xl bg-white/5 backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5"
              />
            )}
          </div>

          {/* Right Column - Enhanced Order Summary - Mobile Optimized */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary - Mobile Optimized */}
            <Card className="border border-white/10 shadow-xl bg-white/5 backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 lg:sticky lg:top-24">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  {t("orderSummary")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {t("orderInformation")}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {t("orderNumber")}
                      </span>
                      <span className="font-mono text-sm font-medium">
                        {order.order_number || order.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {t("orderDate")}
                      </span>
                      <span className="text-sm font-medium">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {t("lastUpdated")}
                      </span>
                      <span className="text-sm font-medium">
                        {formatDate(order.updated_at)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        {t("currency")}
                      </span>
                      <span className="text-sm font-medium">
                        {order.currency_code}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Customer Information */}
                {order.user && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        {t("customerInfo")}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {t("customerName")}
                          </span>
                          <span className="text-sm font-medium">
                            {order.user.name}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {t("customerEmail")}
                          </span>
                          <span className="font-mono text-xs font-medium break-all">
                            {order.user.email}
                          </span>
                        </div>
                        {order.user.phone && (
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {t("customerPhone")}
                            </span>
                            <span className="text-sm font-medium">
                              {order.user.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Financial Summary */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {t("financialSummary")}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {t("subtotal")}
                      </span>
                      <span className="text-sm font-medium">
                        {formatPrice(convertPrice(order.total_amount, "USD"))}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {t("shipping")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t("calculatedAtCheckout")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {t("tax")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t("calculatedAtCheckout")}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center py-2">
                      <span className="font-semibold text-lg">
                        {t("total")}
                      </span>
                      <span className="font-bold text-xl text-primary">
                        {formatPrice(convertPrice(order.total_amount, "USD"))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Notes */}
                {order.notes && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        {t("notes")}
                      </h4>
                      <div className="p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {order.notes}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Action Buttons - Mobile Optimized */}
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/catalog")}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02]"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {t("continueShopping")}
              </Button>

              {order.status === "pending" && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (confirm(t("confirmCancel"))) {
                      alert(t("orderCancellationNotImplemented"));
                    }
                  }}
                  className="w-full h-12 text-base font-semibold border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 hover:scale-[1.02]"
                >
                  <X className="w-5 h-5 mr-2" />
                  {t("cancelOrder")}
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => router.push("/orders")}
                className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
              >
                {t("viewAllOrders")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
