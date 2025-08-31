"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Package,
  Truck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "../types/order.types";
import { useEffect, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import type { Order } from "@/shared/types";
import { OrderTimeline } from "./order-timeline";
import type { OrderTimeline as OrderTimelineType } from "../types/order-tracking.types";
import { OrderTrackingService } from "../services/order-tracking-service";
import { Separator } from "@/shared/components/ui/separator";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface OrderDetailsPageProps {
  orderId: string;
  locale: string;
}

export function OrderDetailsPage({ orderId, locale }: OrderDetailsPageProps) {
  const router = useRouter();
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");

  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<OrderTimelineType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch order details from API
      const response = await fetch(`/api/orders/${orderId}`);
      const result = await response.json();

      if (result.success && result.order) {
        setOrder(result.order);
        
        // Load order timeline
        const timelineData = await OrderTrackingService.getOrderTimeline(orderId);
        setTimeline(timelineData);
      } else {
        setError(result.error || "Failed to load order details");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
      style: "currency",
      currency: order?.currency_code || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "confirmed":
        return <Package className="w-5 h-5 text-blue-500" />;
      case "processing":
        return <Package className="w-5 h-5 text-orange-500" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "cancelled":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "secondary";
    const colors = ORDER_STATUS_COLORS as any;
    return colors[status] === "green"
      ? "default"
      : colors[status] === "red"
      ? "destructive"
      : "secondary";
  };

  const getStatusBadgeVariant = (status: string | null) => {
    if (!status) return "secondary";
    switch (status) {
      case "delivered":
        return "default";
      case "cancelled":
        return "destructive";
      case "pending":
        return "secondary";
      case "confirmed":
        return "secondary";
      case "processing":
        return "secondary";
      case "shipped":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return "Unknown";
    const labels = ORDER_STATUS_LABELS as any;
    return labels[status] || "Unknown";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("error.title")}</h2>
            <p className="text-muted-foreground mb-6">
              {error || t("error.notFound")}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/catalog")}
                className="w-full"
              >
                {t("error.viewAllOrders")}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/catalog")}
                className="w-full"
              >
                {t("error.continueShopping")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("back")}</span>
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-semibold">
                {t("orderDetails")}
              </h1>
              <Badge
                variant={getStatusBadgeVariant(order.status)}
                className="flex items-center gap-1"
              >
                {getStatusIcon(order.status)}
                {getStatusLabel(order.status)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t("orderItems")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border rounded-lg"
                  >
                    {/* Gemstone Image */}
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.gemstone?.images?.find((img) => img.is_primary)
                        ?.image_url ? (
                        <img
                          src={
                            item.gemstone.images.find((img) => img.is_primary)
                              ?.image_url
                          }
                          alt={item.gemstone.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : item.gemstone?.images?.[0]?.image_url ? (
                        <img
                          src={item.gemstone.images[0].image_url}
                          alt={item.gemstone.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-foreground">
                            {item.gemstone?.name} {item.gemstone?.color}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {item.gemstone?.cut} •{" "}
                            {item.gemstone?.weight_carats}ct
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("serialNumber")}: {item.gemstone?.serial_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatPrice(item.line_total)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} × {formatPrice(item.unit_price)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-8">
                    {t("noItems")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Order Timeline */}
            {timeline && (
              <OrderTimeline 
                timeline={timeline} 
                showInternalEvents={false}
              />
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{t("orderSummary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("orderId")}
                    </span>
                    <span className="font-mono text-xs">
                      {order.id.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("orderDate")}
                    </span>
                    <span>
                      {order.created_at ? formatDate(order.created_at) : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("lastUpdated")}
                    </span>
                    <span>
                      {order.updated_at ? formatDate(order.updated_at) : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("currency")}
                    </span>
                    <span>{order.currency_code}</span>
                  </div>
                </div>

                {/* Customer Information */}
                {order.user && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">{t("customerInfo")}</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("customerName")}
                        </span>
                        <span>{order.user.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("customerEmail")}
                        </span>
                        <span className="font-mono text-xs">
                          {order.user.email}
                        </span>
                      </div>
                      {order.user.phone && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {t("customerPhone")}
                          </span>
                          <span>{order.user.phone}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("subtotal")}
                    </span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("shipping")}
                    </span>
                    <span>{t("calculatedAtCheckout")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("tax")}</span>
                    <span>{t("calculatedAtCheckout")}</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>{t("total")}</span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>
                </div>

                {order.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">{t("notes")}</h4>
                      <p className="text-sm text-muted-foreground">
                        {order.notes}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button
                onClick={() => router.push("/catalog")}
                className="w-full"
              >
                {t("continueShopping")}
              </Button>

              {order.status === "pending" && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    // TODO: Implement order cancellation
                    if (confirm(t("confirmCancel"))) {
                      // Order cancellation not yet implemented
                      alert(t("orderCancellationNotImplemented"));
                    }
                  }}
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  {t("cancelOrder")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
