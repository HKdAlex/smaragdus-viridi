"use client";

import {
  ArrowLeft,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  Download,
  Edit,
  Gem,
  Info,
  Package,
  Star,
  Upload,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { GemstoneForm } from "./gemstone-form";
import type { GemstoneWithRelations } from "../services/gemstone-admin-service";
import { useState } from "react";
import { useTranslations } from "next-intl";

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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
    return dims.length > 0 ? dims.join(" × ") : "N/A";
  };

  const getAIStatusBadge = () => {
    // Check if AI content exists via ai_analyzed field (from gemstones_enriched view)
    // This field is actually ai_text_generated_v6 from the gemstones table
    if (gemstone.ai_analyzed) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          AI Analyzed
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending AI
      </Badge>
    );
  };

  const getConfidenceScore = () => {
    if (gemstone.ai_confidence_score) {
      const score = Math.round(gemstone.ai_confidence_score * 100);
      return (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{score}%</span>
        </div>
      );
    }
    return <span className="text-xs text-muted-foreground">N/A</span>;
  };

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backToList")}
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {gemstone.internal_code?.trim() || gemstone.serial_number}
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatWeight(gemstone.weight_carats)} {gemstone.color}{" "}
              {gemstone.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(gemstone.id);
                // You could add a toast notification here
                console.log("Gemstone ID copied to clipboard");
              } catch (error) {
                console.error("Failed to copy ID:", error);
              }
            }}
          >
            <Copy className="w-4 h-4 mr-1" />
            {t("copyId")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const { ExportService } = await import(
                  "@/features/admin/services/export-service"
                );
                const result = await ExportService.exportToCSV([gemstone], {
                  format: "csv",
                  includeImages: false,
                  includeMetadata: true,
                });

                if (result.success && result.data) {
                  const blob = new Blob([result.data], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download =
                    result.fileName || `gemstone-${gemstone.serial_number}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } else {
                  console.error("Export failed:", result.error);
                }
              } catch (error) {
                console.error("Export error:", error);
              }
            }}
          >
            <Download className="w-4 h-4 mr-1" />
            {t("export")}
          </Button>
          <Button size="sm" onClick={() => setMode("edit")}>
            <Edit className="w-4 h-4 mr-1" />
            {t("edit")}
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Image Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center relative">
                {gemstone.images && gemstone.images.length > 0 ? (
                  (() => {
                    // Find primary image first, fallback to first image
                    const primaryImage = gemstone.images.find(
                      (img) => img.is_primary
                    );
                    const displayImage = primaryImage || gemstone.images[0];
                    const isPrimary = !!primaryImage;

                    return (
                      <>
                        <img
                          src={displayImage.image_url}
                          alt={gemstone.name}
                          className="w-full h-full object-cover rounded-lg"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const fallback =
                              target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                        {isPrimary && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              <Star className="w-3 h-3 mr-1" />
                              Primary
                            </Badge>
                          </div>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gem className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ display: "none" }}
                >
                  <Gem className="w-12 h-12 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Core Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gem className="w-5 h-5" />
                {t("basicInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("serialNumber")}
                  </label>
                  <p className="text-sm font-mono">{gemstone.serial_number}</p>
                </div>
                {gemstone.internal_code && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("internalCode")}
                    </label>
                    <p className="text-sm">{gemstone.internal_code}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("gemstoneType")}
                  </label>
                  <p className="text-sm capitalize">{gemstone.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("color")}
                  </label>
                  <p className="text-sm capitalize">{gemstone.color}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("cut")}
                  </label>
                  <p className="text-sm capitalize">{gemstone.cut}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("clarity")}
                  </label>
                  <p className="text-sm">{gemstone.clarity}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("weight")}
                  </label>
                  <p className="text-sm">
                    {formatWeight(gemstone.weight_carats)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("dimensions")}
                  </label>
                  <p className="text-sm">{formatDimensions()}</p>
                </div>
                {gemstone.origin && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("origin")}
                    </label>
                    <p className="text-sm">
                      {gemstone.origin.name}, {gemstone.origin.country}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status & Pricing */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            {/* Stock Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {t("status")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("stockStatus")}
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
                {gemstone.delivery_days && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("deliveryTime")}
                    </label>
                    <p className="text-sm">{gemstone.delivery_days} days</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {t("pricingInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("regularPrice")}
                  </label>
                  <p className="text-lg font-semibold">
                    {formatPrice(
                      gemstone.price_amount,
                      gemstone.price_currency
                    )}
                  </p>
                </div>
                {gemstone.premium_price_amount && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("premiumPrice")}
                    </label>
                    <p className="text-lg font-semibold">
                      {formatPrice(
                        gemstone.premium_price_amount,
                        gemstone.premium_price_currency ||
                          gemstone.price_currency
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Additional Information Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Analysis */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4" />
              {t("aiAnalysis")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("status")}
              </label>
              <div className="mt-1">{getAIStatusBadge()}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("confidence")}
              </label>
              <div className="mt-1">{getConfidenceScore()}</div>
            </div>
            {gemstone.ai_analysis_date && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("analyzed")}
                </label>
                <p className="text-sm">
                  {formatDate(gemstone.ai_analysis_date)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {t("importInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gemstone.import_batch_id && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("batchId")}
                </label>
                <p className="text-sm font-mono">{gemstone.import_batch_id}</p>
              </div>
            )}
            {gemstone.import_folder_path && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("folderPath")}
                </label>
                <p className="text-xs font-mono">
                  {gemstone.import_folder_path}
                </p>
              </div>
            )}
            {gemstone.import_notes && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("notes")}
                </label>
                <p className="text-sm">{gemstone.import_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timestamps */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t("timestamps")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("created")}
              </label>
              <p className="text-sm">{formatDate(gemstone.created_at)}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("updated")}
              </label>
              <p className="text-sm">{formatDate(gemstone.updated_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Section */}
      {(gemstone.ai_v6?.technical_description_en ||
        gemstone.ai_v6?.emotional_description_en ||
        gemstone.ai_v6?.narrative_story_en ||
        gemstone.ai_v6?.promotional_text ||
        gemstone.ai_v6?.marketing_highlights ||
        gemstone.promotional_text ||
        gemstone.marketing_highlights ||
        (gemstone.description && gemstone.description !== "1")) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-4 h-4" />
              {t("content")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Technical Description */}
            {gemstone.ai_v6?.technical_description_en && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("technicalDescription")}
                </label>
                <p className="text-sm mt-1">
                  {gemstone.ai_v6.technical_description_en}
                </p>
              </div>
            )}

            {/* Emotional Description */}
            {gemstone.ai_v6?.emotional_description_en && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("emotionalDescription")}
                </label>
                <p className="text-sm mt-1">
                  {gemstone.ai_v6.emotional_description_en}
                </p>
              </div>
            )}

            {/* Narrative Story */}
            {gemstone.ai_v6?.narrative_story_en && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("narrativeStory")}
                </label>
                <p className="text-sm mt-1">
                  {gemstone.ai_v6.narrative_story_en}
                </p>
              </div>
            )}

            {/* AI Promotional Text */}
            {gemstone.ai_v6?.promotional_text && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("aiPromotionalText")}
                </label>
                <p className="text-sm mt-1">
                  {gemstone.ai_v6.promotional_text}
                </p>
              </div>
            )}

            {/* AI Marketing Highlights */}
            {gemstone.ai_v6?.marketing_highlights &&
              Array.isArray(gemstone.ai_v6.marketing_highlights) &&
              gemstone.ai_v6.marketing_highlights.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("aiMarketingHighlights")}
                  </label>
                  <div className="mt-1 space-y-1">
                    {gemstone.ai_v6.marketing_highlights.map(
                      (highlight, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-sm">{highlight}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Fallback to original description if no AI content */}
            {!gemstone.ai_v6?.technical_description_en &&
              !gemstone.ai_v6?.emotional_description_en &&
              !gemstone.ai_v6?.narrative_story_en &&
              gemstone.description &&
              gemstone.description !== "1" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("description")}
                  </label>
                  <p className="text-sm mt-1">{gemstone.description}</p>
                </div>
              )}
            {gemstone.promotional_text && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t("promotionalText")}
                </label>
                <p className="text-sm mt-1">{gemstone.promotional_text}</p>
              </div>
            )}
            {gemstone.marketing_highlights &&
              gemstone.marketing_highlights.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("marketingHighlights")}
                  </label>
                  <div className="mt-1 space-y-1">
                    {gemstone.marketing_highlights.map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-sm">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
