"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ArrowLeft, Edit, Eye, Gem, Package, X } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { GemstoneWithRelations } from "../services/gemstone-admin-service";
import { GemstoneForm } from "./gemstone-form";

interface GemstoneDetailPageProps {
  gemstone: GemstoneWithRelations;
  onBack: () => void;
  onEdit: () => void;
}

type DetailMode = "view" | "edit";

export function GemstoneDetailPage({
  gemstone,
  onBack,
  onEdit,
}: GemstoneDetailPageProps) {
  const t = useTranslations("admin.gemstoneDetail");
  const tForm = useTranslations("admin.gemstoneForm");
  const [mode, setMode] = useState<DetailMode>("view");

  const handleFormSuccess = (updatedGemstone: GemstoneWithRelations) => {
    setMode("view");
    // The parent component will handle refreshing the list
  };

  const handleFormCancel = () => {
    setMode("view");
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)}крт`;
  };

  if (mode === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setMode("view")}
            className="min-h-[44px] self-start"
          >
            <X className="w-4 h-4 mr-2" />
            {tForm("actions.cancel")}
          </Button>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
            {tForm("editTitle")}
          </h2>
        </div>
        <GemstoneForm
          gemstone={gemstone}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="min-h-[44px] self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("backToList")}
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
            {t("title")} #{gemstone.serial_number}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            {formatWeight(gemstone.weight_carats)} {gemstone.color}{" "}
            {gemstone.name}
          </p>
        </div>
        <Button
          onClick={() => setMode("edit")}
          className="min-h-[44px] self-start"
        >
          <Edit className="w-4 h-4 mr-2" />
          {t("editGemstone")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gemstone Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {t("gemstoneImage")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                {gemstone.images && gemstone.images.length > 0 ? (
                  <img
                    src={gemstone.images[0].image_url}
                    alt={gemstone.name}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gem className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                {/* Hidden fallback for broken images */}
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ display: "none" }}
                >
                  <Gem className="w-16 h-16 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gemstone Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gem className="w-5 h-5" />
                {t("gemstoneDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tForm("labels.serialNumber")}
                  </label>
                  <p className="text-foreground">{gemstone.serial_number}</p>
                </div>
                {gemstone.internal_code && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {tForm("labels.internalCode")}
                    </label>
                    <p className="text-foreground">{gemstone.internal_code}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tForm("labels.type")}
                  </label>
                  <p className="text-foreground capitalize">{gemstone.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tForm("labels.color")}
                  </label>
                  <p className="text-foreground capitalize">{gemstone.color}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tForm("labels.cut")}
                  </label>
                  <p className="text-foreground capitalize">{gemstone.cut}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tForm("labels.clarity")}
                  </label>
                  <p className="text-foreground">{gemstone.clarity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tForm("labels.weight")}
                  </label>
                  <p className="text-foreground">
                    {formatWeight(gemstone.weight_carats)}
                  </p>
                </div>
                {gemstone.origin && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {tForm("labels.origin")}
                    </label>
                    <p className="text-foreground">
                      {gemstone.origin.name}, {gemstone.origin.country}
                    </p>
                  </div>
                )}
              </div>

              {/* Dimensions */}
              {(gemstone.length_mm ||
                gemstone.width_mm ||
                gemstone.depth_mm) && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {t("dimensions")}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {gemstone.length_mm && (
                        <div>
                          <label className="text-xs text-muted-foreground">
                            {tForm("labels.length")}
                          </label>
                          <p className="text-foreground">
                            {gemstone.length_mm}mm
                          </p>
                        </div>
                      )}
                      {gemstone.width_mm && (
                        <div>
                          <label className="text-xs text-muted-foreground">
                            {tForm("labels.width")}
                          </label>
                          <p className="text-foreground">
                            {gemstone.width_mm}mm
                          </p>
                        </div>
                      )}
                      {gemstone.depth_mm && (
                        <div>
                          <label className="text-xs text-muted-foreground">
                            {tForm("labels.depth")}
                          </label>
                          <p className="text-foreground">
                            {gemstone.depth_mm}mm
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t("statusAndPricing")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("status")}
                </label>
                <div className="mt-1">
                  <Badge
                    variant={gemstone.in_stock ? "default" : "destructive"}
                    className="w-fit"
                  >
                    {gemstone.in_stock ? t("inStock") : t("outOfStock")}
                  </Badge>
                </div>
              </div>

              {/* Regular Price */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {tForm("labels.regularPrice")}
                </label>
                <p className="text-foreground text-lg font-semibold">
                  {formatPrice(gemstone.price_amount, gemstone.price_currency)}
                </p>
              </div>

              {/* Premium Price */}
              {gemstone.premium_price_amount && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tForm("labels.premiumPrice")}
                  </label>
                  <p className="text-foreground text-lg font-semibold">
                    {formatPrice(
                      gemstone.premium_price_amount,
                      gemstone.premium_price_currency || gemstone.price_currency
                    )}
                  </p>
                </div>
              )}

              {/* Delivery Days */}
              {gemstone.delivery_days && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tForm("labels.deliveryDays")}
                  </label>
                  <p className="text-foreground">
                    {gemstone.delivery_days} days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("additionalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Created Date */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("createdAt")}
                </label>
                <p className="text-foreground">
                  {gemstone.created_at
                    ? new Date(gemstone.created_at).toLocaleDateString()
                    : t("notAvailable")}
                </p>
              </div>

              {/* Updated Date */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("updatedAt")}
                </label>
                <p className="text-foreground">
                  {gemstone.updated_at
                    ? new Date(gemstone.updated_at).toLocaleDateString()
                    : t("notAvailable")}
                </p>
              </div>

              {/* Description */}
              {gemstone.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tForm("labels.description")}
                  </label>
                  <p className="text-foreground text-sm">
                    {gemstone.description}
                  </p>
                </div>
              )}

              {/* Promotional Text */}
              {gemstone.promotional_text && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {tForm("labels.promotionalText")}
                  </label>
                  <p className="text-foreground text-sm">
                    {gemstone.promotional_text}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
