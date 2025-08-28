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
    if (gemstone.length_mm) dims.push(`${gemstone.length_mm}mm L`);
    if (gemstone.width_mm) dims.push(`${gemstone.width_mm}mm W`);
    if (gemstone.depth_mm) dims.push(`${gemstone.depth_mm}mm D`);
    return dims.length > 0 ? dims.join(" × ") : "Not specified";
  };

  const getStockStatusColor = (inStock: boolean | null) => {
    return inStock ?? false
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getStockStatusText = (inStock: boolean | null) => {
    return inStock ?? false ? "In Stock" : "Out of Stock";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Gemstone Details
            </h2>
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
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Serial Number
                    </label>
                    <p className="text-lg font-semibold text-blue-600">
                      {gemstone.serial_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Internal Code
                    </label>
                    <p className="text-lg font-semibold">
                      {gemstone.internal_code || "Not set"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Gemstone Type
                    </label>
                    <p className="text-lg capitalize">{gemstone.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Stock Status
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
                  Gemstone Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {gemstone.color}
                    </div>
                    <div className="text-sm text-gray-600">Color</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {gemstone.cut}
                    </div>
                    <div className="text-sm text-gray-600">Cut</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {gemstone.clarity}
                    </div>
                    <div className="text-sm text-gray-600">Clarity</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {gemstone.weight_carats}ct
                    </div>
                    <div className="text-sm text-gray-600">Weight</div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Dimensions
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
                  Pricing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Regular Price
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
                        Premium Price
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
                      Delivery Time
                    </label>
                    <p className="text-lg">
                      {gemstone.delivery_days} business days
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
                    Description
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
                  Record Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm">
                    {gemstone.created_at
                      ? formatDate(gemstone.created_at)
                      : "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated:</span>
                  <span className="text-sm">
                    {gemstone.updated_at
                      ? formatDate(gemstone.updated_at)
                      : "Unknown"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
