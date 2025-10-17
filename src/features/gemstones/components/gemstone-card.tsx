/**
 * Gemstone Card Component
 *
 * Reusable card component for displaying gemstones across:
 * - Public catalog
 * - Admin management interface
 * - Related gemstones sections
 *
 * Following clean-code principles:
 * - Single Responsibility: Only renders gemstone card UI
 * - Composable: Accepts variants for different use cases
 * - Type Safe: Strict prop typing
 */

"use client";

import {
  ColorIndicator,
  CutIcon,
  GemstoneTypeIcon,
} from "@/shared/components/ui/gemstone-icons";
import { useLocale, useTranslations } from "next-intl";

import type { CatalogGemstone } from "../services/gemstone-fetch.service";
import Image from "next/image";
import Link from "next/link";
import { useGemstoneTranslations } from "../utils/gemstone-translations";

// ===== TYPES =====

export interface GemstoneCardProps {
  gemstone: CatalogGemstone;
  variant?: "catalog" | "admin" | "compact";
  showActions?: boolean;
  onSelect?: (id: string) => void;
  href?: string; // Custom link override
  className?: string;
}

// ===== HELPER FUNCTIONS =====

const hasMeaningfulAIAnalysis = (
  aiAnalysis: CatalogGemstone["ai_analysis"]
): boolean => {
  if (!aiAnalysis || !Array.isArray(aiAnalysis) || aiAnalysis.length === 0) {
    return false;
  }

  return aiAnalysis.some((analysis) => {
    const hasHighConfidence =
      analysis.confidence_score && analysis.confidence_score >= 0.5;
    const hasExtractedData =
      analysis.extracted_data &&
      typeof analysis.extracted_data === "object" &&
      Object.keys(analysis.extracted_data).length > 0;

    return hasHighConfidence && hasExtractedData;
  });
};

const getBestAIAnalysis = (aiAnalysis: CatalogGemstone["ai_analysis"]) => {
  if (!aiAnalysis || !Array.isArray(aiAnalysis) || aiAnalysis.length === 0) {
    return null;
  }

  return aiAnalysis.reduce((best, current) => {
    const currentScore = current.confidence_score || 0;
    const bestScore = best.confidence_score || 0;
    return currentScore > bestScore ? current : best;
  });
};

// ===== COMPONENT =====

export function GemstoneCard({
  gemstone,
  variant = "catalog",
  showActions = false,
  onSelect,
  href,
  className = "",
}: GemstoneCardProps) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const {
    translateColor,
    translateCut,
    translateClarity,
    translateGemstoneType,
  } = useGemstoneTranslations();

  // Prioritization logic:
  // 1. Use pre-translated displayX values if available (from search/catalog decorators)
  // 2. Otherwise, prioritize AI-detected values and translate them
  // 3. Finally fall back to manual values and translate them

  const typeLabel =
    gemstone.displayName ?? translateGemstoneType(gemstone.name);

  // For color and cut, prioritize AI-detected values for the actual data
  // but respect pre-translated displayColor/displayCut for the label
  const effectiveColor = (gemstone as any).ai_color || gemstone.color;
  const effectiveCut = (gemstone as any).v6_text?.detected_cut || gemstone.cut;

  const colorLabel = gemstone.displayColor ?? translateColor(effectiveColor);
  const cutLabel =
    gemstone.displayCut ?? (effectiveCut ? translateCut(effectiveCut) : null);
  const clarityLabel =
    gemstone.displayClarity ??
    (gemstone.clarity ? translateClarity(gemstone.clarity) : null);

  const primaryImage = (() => {
    if (gemstone.selected_image_uuid && gemstone.images?.length) {
      const match = gemstone.images.find(
        (img) => img.id === gemstone.selected_image_uuid
      );
      if (match) return match;
    }

    if (
      typeof gemstone.recommended_primary_image_index === "number" &&
      gemstone.images?.[gemstone.recommended_primary_image_index]
    ) {
      return gemstone.images[gemstone.recommended_primary_image_index];
    }

    return (
      gemstone.images?.find((img) => img.is_primary) || gemstone.images?.[0]
    );
  })();

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const defaultHref = `/catalog/${gemstone.id}`;
  const linkHref = href || defaultHref;

  const isCompact = variant === "compact";

  const cardContent = (
    <>
      {/* Image Section */}
      <div className="aspect-square relative bg-muted">
        {primaryImage ? (
          <Image
            src={primaryImage.image_url}
            alt={`${gemstone.color} ${gemstone.name}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onError={() => {
              if (process.env.NODE_ENV === "development") {
                console.warn(
                  `Image failed to load for ${gemstone.serial_number}: ${primaryImage.image_url}`
                );
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <div className="text-4xl">💎</div>
          </div>
        )}

        {/* Serial Number Overlay - Hidden */}
        {/* <div className="absolute bottom-2 right-2 bg-black/75 dark:bg-black/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          {gemstone.serial_number}
        </div> */}

        {/* Stock Status */}
        {!gemstone.in_stock && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded shadow-sm">
            Out of Stock
          </div>
        )}

        {gemstone.in_stock && (
          <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-sm">
            {t("product.inStock")}
          </div>
        )}

        {/* AI Analysis Indicator */}
        {hasMeaningfulAIAnalysis(gemstone.ai_analysis) &&
          (() => {
            const bestAnalysis = getBestAIAnalysis(gemstone.ai_analysis);
            return (
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs px-2 py-1 rounded flex items-center space-x-1 shadow-sm">
                  <span>🤖</span>
                  <span>AI</span>
                </div>
                {bestAnalysis?.confidence_score &&
                  bestAnalysis.confidence_score >= 0.5 && (
                    <div className="bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground text-xs px-2 py-1 rounded shadow-sm">
                      {(bestAnalysis.confidence_score * 100).toFixed(0)}%
                    </div>
                  )}
              </div>
            );
          })()}
      </div>

      {/* Details Section */}
      <div className={isCompact ? "p-2" : "p-3 sm:p-4"}>
        {/* Title */}
        <h3
          className={`font-semibold text-foreground capitalize leading-tight mb-2 ${
            isCompact ? "text-xs" : "text-sm sm:text-base"
          }`}
        >
          {colorLabel} {typeLabel}
        </h3>

        {/* Metadata Table Layout */}
        {!isCompact && (
          <div className="mb-3 text-xs">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {/* Weight */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("product.weight")}:</span>
                <span className="font-medium text-foreground">
                  {gemstone.weight_carats}ct
                </span>
              </div>

              {/* Clarity */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("filters.clarity")}:</span>
                <span className="font-medium text-foreground">
                  {clarityLabel ?? t("unknown")}
                </span>
              </div>

              {/* Type */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("type")}:</span>
                <div className="flex items-center space-x-1">
                  <GemstoneTypeIcon className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium text-foreground">{typeLabel}</span>
                </div>
              </div>

              {/* Color */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("color")}:</span>
                <div className="flex items-center space-x-1">
                  <ColorIndicator color={effectiveColor} className="w-3 h-3" />
                  <span className="font-medium text-foreground">{colorLabel}</span>
                </div>
              </div>

              {/* Cut */}
              <div className="flex items-center justify-between col-span-2">
                <span className="text-muted-foreground">{t("cut")}:</span>
                <div className="flex items-center space-x-1">
                  <CutIcon cut={effectiveCut} className="w-3 h-3" />
                  <span className="font-medium text-foreground">
                    {cutLabel ?? t("unknown")}
                  </span>
                </div>
              </div>

              {/* Origin */}
              {gemstone.origin && (
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-muted-foreground">{t("product.origin")}:</span>
                  <span className="font-medium text-foreground">
                    {gemstone.origin.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compact Additional Info */}
        {isCompact && (
          <div className="space-y-1 text-muted-foreground mb-3 text-xs">
            <div className="font-medium text-foreground">
              {gemstone.weight_carats}ct
            </div>
            <div>{clarityLabel ?? t("unknown")}</div>
            {gemstone.origin && (
              <div>
                {t("product.origin")}: {gemstone.origin.name}
              </div>
            )}
          </div>
        )}

        {/* Price and Delivery */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border gap-2">
          <div
            className={`font-bold text-primary ${
              isCompact ? "text-sm" : "text-base sm:text-lg"
            }`}
          >
            {formatPrice(gemstone.price_amount, gemstone.price_currency)}
          </div>

          {gemstone.delivery_days && (
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded self-start sm:self-auto">
              {gemstone.delivery_days} days
            </div>
          )}
        </div>

        {/* Show emotional description snippet if available (prefer v6, locale-aware) */}
        {(() => {
          const v6Text = (gemstone as any).v6_text;
          const description =
            locale === "ru"
              ? v6Text?.emotional_description_ru ||
                gemstone.description_emotional_ru ||
                v6Text?.emotional_description_en ||
                gemstone.description_emotional_en
              : v6Text?.emotional_description_en ||
                gemstone.description_emotional_en ||
                v6Text?.emotional_description_ru ||
                gemstone.description_emotional_ru;

          return description ? (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-3 px-2">
              {description}
            </p>
          ) : null;
        })()}
      </div>
    </>
  );

  // If onSelect is provided, render as button
  if (onSelect) {
    return (
      <button
        onClick={() => onSelect(gemstone.id)}
        className={`bg-card border border-border rounded-lg overflow-hidden
                   hover:shadow-lg hover:shadow-primary/10
                   transition-all duration-300 group
                   hover:border-primary/30 w-full text-left
                   ${
                     isCompact
                       ? "min-h-[240px]"
                       : "min-h-[320px] sm:min-h-[360px]"
                   }
                   ${className}`}
      >
        {cardContent}
      </button>
    );
  }

  // Default: render as link
  return (
    <Link
      href={linkHref}
      className={`bg-card border border-border rounded-lg overflow-hidden
                 hover:shadow-lg hover:shadow-primary/10
                 transition-all duration-300 group
                 hover:border-primary/30 block
                 ${
                   isCompact
                     ? "min-h-[240px]"
                     : "min-h-[320px] sm:min-h-[360px]"
                 }
                 ${className}`}
    >
      {cardContent}
    </Link>
  );
}
