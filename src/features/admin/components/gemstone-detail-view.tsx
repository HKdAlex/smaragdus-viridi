"use client";

import {
  Calendar,
  DollarSign,
  Eye,
  Gem,
  Info,
  Package,
  Ruler,
  Tag,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useEffect, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import type { DatabaseGemstone } from "@/shared/types";
import { Separator } from "@/shared/components/ui/separator";
import { formatPrice } from "@/shared/utils/formatters";
import { useTranslations } from "next-intl";

interface GemstoneDetailViewProps {
  gemstone: DatabaseGemstone;
  isOpen: boolean;
  onClose: () => void;
}

export function GemstoneDetailView({
  gemstone,
  isOpen,
  onClose,
}: GemstoneDetailViewProps) {
  const t = useTranslations("admin.gemstoneDetail");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Could load additional data like images, certifications, etc.
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDimensions = () => {
    const dims = [];
    if (gemstone.length_mm)
      dims.push(t("dimensions_length", { length: gemstone.length_mm }));
    if (gemstone.width_mm)
      dims.push(t("dimensions_width", { width: gemstone.width_mm }));
    if (gemstone.depth_mm)
      dims.push(t("dimensions_depth", { depth: gemstone.depth_mm }));
    return dims.length > 0 ? dims.join(" × ") : t("notSpecified");
  };

  const getStockStatusColor = (inStock: boolean | null) => {
    return inStock ?? false
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getStockStatusText = (inStock: boolean | null) => {
    return inStock ?? false ? t("inStock") : t("outOfStock");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">{t("title")}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gem className="w-5 h-5" />
                  {t("basicInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {t("serialNumber")}
                    </label>
                    <p className="text-lg font-semibold text-blue-600">
                      {gemstone.serial_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {t("internalCode")}
                    </label>
                    <p className="text-lg font-semibold">
                      {gemstone.internal_code || t("notSet")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {t("gemstoneType")}
                    </label>
                    <p className="text-lg capitalize">{gemstone.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {t("stockStatus")}
                    </label>
                    <Badge className={getStockStatusColor(gemstone.in_stock)}>
                      {getStockStatusText(gemstone.in_stock)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Properties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  {t("gemstoneProperties")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {gemstone.color}
                    </div>
                    <div className="text-sm text-gray-600">{t("color")}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {gemstone.cut}
                    </div>
                    <div className="text-sm text-gray-600">{t("cut")}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {gemstone.clarity}
                    </div>
                    <div className="text-sm text-gray-600">{t("clarity")}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {gemstone.weight_carats}ct
                    </div>
                    <div className="text-sm text-gray-600">{t("weight")}</div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    {t("dimensions")}
                  </label>
                  <p className="text-lg">{formatDimensions()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {t("pricingInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      {t("regularPrice")}
                    </label>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPrice(
                        gemstone.price_amount,
                        gemstone.price_currency
                      )}
                    </p>
                  </div>
                  {gemstone.premium_price_amount && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        {t("premiumPrice")}
                      </label>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatPrice(
                          gemstone.premium_price_amount,
                          gemstone.premium_price_currency ||
                            gemstone.price_currency
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {gemstone.delivery_days && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      {t("deliveryTime")}
                    </label>
                    <p className="text-lg">
                      {t("businessDays", { days: gemstone.delivery_days })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            {gemstone.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    {t("description")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {gemstone.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t("recordInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t("created")}:</span>
                  <span className="text-sm">
                    {gemstone.created_at
                      ? formatDate(gemstone.created_at)
                      : t("unknown")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {t("lastUpdated")}:
                  </span>
                  <span className="text-sm">
                    {gemstone.updated_at
                      ? formatDate(gemstone.updated_at)
                      : t("unknown")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
