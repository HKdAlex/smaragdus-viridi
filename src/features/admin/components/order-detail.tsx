"use client";

import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Truck,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type {
  OrderDetailProps,
  OrderStatus,
} from "../types/order-management.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ORDER_STATUS_CONFIG } from "../types/order-management.types";
import { Separator } from "@/shared/components/ui/separator";
import { Textarea } from "@/shared/components/ui/textarea";
import { format } from "date-fns";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function OrderDetail({
  order,
  onStatusUpdate,
  onBack,
  loading,
}: OrderDetailProps) {
  const t = useTranslations("admin.orders");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusNotes, setStatusNotes] = useState("");

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      await onStatusUpdate(order.id, newStatus);
      setStatusNotes("");
    } catch (error) {
      console.error("Failed to update order status:", error);
    } finally {
      setUpdatingStatus(false);
    }
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
      <Badge variant={config.color as any} className="text-sm px-3 py-1">
        {config.label}
      </Badge>
    );
  };

  const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    return ORDER_STATUS_CONFIG[currentStatus].nextStatuses || [];
  };

  const parseDeliveryAddress = (addressJson: string | null | undefined) => {
    if (!addressJson) return null;
    try {
      return JSON.parse(addressJson);
    } catch {
      return null;
    }
  };

  const deliveryAddress = parseDeliveryAddress(order.delivery_address);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backToOrders")}
          </Button>
        </div>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backToOrders")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {t("orderDetails")} #{order.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground">
              {t("orderDate")}:{" "}
              {format(new Date(order.created_at), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        {getStatusBadge(order.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                {t("orderDetails")}
              </CardTitle>
              <CardDescription>
                {order.items?.length || 0} {t("items")}{" "}
                {t("inThisOrder", { count: order.items?.length || 0 })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                >
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {item.gemstone?.images?.find((img) => img.is_primary)?.image_url ? (
                      <img
                        src={item.gemstone.images.find((img) => img.is_primary)?.image_url}
                        alt={item.gemstone.name}
                        className="w-full h-full object-cover"
                      />
                    ) : item.gemstone?.images?.[0]?.image_url ? (
                      <img
                        src={item.gemstone.images[0].image_url}
                        alt={item.gemstone.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {item.gemstone?.name} {item.gemstone?.color}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {item.gemstone?.cut} • {item.gemstone?.weight_carats}ct
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Serial: {item.gemstone?.serial_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(item.unit_price, order.currency_code)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                    <p className="text-sm font-medium">
                      {formatCurrency(item.line_total, order.currency_code)}
                    </p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between items-center text-lg font-semibold">
                <span>{t("total")}</span>
                <span>
                  {formatCurrency(order.total_amount, order.currency_code)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>{t("updateStatus")}</CardTitle>
              <CardDescription>
                {t("updateStatusDescription", {
                  status: t(`statuses.${order.status}`),
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t("currentStatus")}
                </span>
                {getStatusBadge(order.status)}
              </div>

              {getNextStatuses(order.status).length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    {t("updateStatus")}
                  </label>
                  <Select
                    onValueChange={(value) =>
                      handleStatusUpdate(value as OrderStatus)
                    }
                  >
                    <SelectTrigger disabled={updatingStatus}>
                      <SelectValue placeholder={t("selectNewStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      {getNextStatuses(order.status).map((status) => (
                        <SelectItem key={status} value={status}>
                          {ORDER_STATUS_CONFIG[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder={t("addNotes")}
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                {ORDER_STATUS_CONFIG[order.status].description}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                {t("customerInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {order.user?.name || "Unknown"}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {order.user?.email || "No email"}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {t("lastUpdated")}:{" "}
                  {format(new Date(order.updated_at), "MMM d, yyyy")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          {deliveryAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  {t("deliveryAddress")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p>{deliveryAddress.street}</p>
                    <p>
                      {deliveryAddress.city}, {deliveryAddress.state}{" "}
                      {deliveryAddress.zip_code}
                    </p>
                    <p>{deliveryAddress.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t("orderNotes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                {t("paymentInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("amount")}
                </span>
                <span className="font-medium">
                  {formatCurrency(order.total_amount, order.currency_code)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("currency")}
                </span>
                <span>{order.currency_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("method")}
                </span>
                <span>{t("simulatedPayment")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
