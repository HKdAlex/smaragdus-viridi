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
import { CheckCircle, Package, Scale } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import Image from "next/image";
import Link from "next/link";
import type { CatalogGemstone } from "../services/gemstone-fetch.service";
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

const hasMeaningfulAIAnalysis = (gemstone: CatalogGemstone): boolean => {
  // Check if gemstone has AI-generated content with sufficient confidence
  const v6Text = gemstone.v6_text;
  if (!v6Text) return false;

  return !!(
    v6Text.emotional_description_en ||
    v6Text.emotional_description_ru ||
    v6Text.marketing_highlights_en ||
    v6Text.marketing_highlights_ru
  );
};

const getBestAIAnalysis = (gemstone: CatalogGemstone) => {
  const v6Text = gemstone.v6_text;
  if (!v6Text) return null;

  return {
    confidence_score: 0.9, // High confidence for v6 content
    analysis_type: "comprehensive_analysis",
    extracted_data: {
      emotional_description_en: v6Text.emotional_description_en,
      emotional_description_ru: v6Text.emotional_description_ru,
      marketing_highlights_en: v6Text.marketing_highlights_en,
      marketing_highlights_ru: v6Text.marketing_highlights_ru,
    },
  };
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

    // Prioritize is_primary over recommended_primary_image_index
    const primaryImage = gemstone.images?.find((img) => img.is_primary);
    if (primaryImage) return primaryImage;

    if (
      typeof gemstone.recommended_primary_image_index === "number" &&
      gemstone.images?.[gemstone.recommended_primary_image_index]
    ) {
      return gemstone.images[gemstone.recommended_primary_image_index];
    }

    return gemstone.images?.[0];
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

        {/* Stock Status Badge - REMOVED as per user request */}

        {/* AI Analysis Indicator */}
        {hasMeaningfulAIAnalysis(gemstone) &&
          (() => {
            const bestAnalysis = getBestAIAnalysis(gemstone);
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
          className={`font-semibold text-foreground capitalize leading-tight mb-3 mt-2 sm:mt-0 ${
            isCompact ? "text-xs" : "text-base sm:text-lg"
          }`}
        >
          {colorLabel} {typeLabel}
        </h3>

        {/* Metadata Table Layout */}
        {!isCompact && (
          <div className="mb-3 text-base leading-relaxed">
            <div className="space-y-3">
              {/* Weight */}
              <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                <Scale className="w-5 h-5 text-muted-foreground" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("product.weight")}
                  </span>
                  <span className="font-medium text-foreground">
                    {gemstone.weight_carats}ct
                  </span>
                </div>
              </div>

              {/* Type */}
              <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                <GemstoneTypeIcon className="w-5 h-5 text-muted-foreground" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("type")}</span>
                  <span className="font-medium text-foreground">
                    {typeLabel}
                  </span>
                </div>
              </div>

              {/* Color */}
              <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                <ColorIndicator color={effectiveColor} className="w-5 h-5" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("color")}</span>
                  <span className="font-medium text-foreground">
                    {colorLabel}
                  </span>
                </div>
              </div>

              {/* Cut */}
              <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                <CutIcon cut={effectiveCut} className="w-5 h-5" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("cut")}</span>
                  <span className="font-medium text-foreground">
                    {cutLabel ?? t("unknown")}
                  </span>
                </div>
              </div>

              {/* Clarity */}
              <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("filters.clarity")}
                  </span>
                  <span className="font-medium text-foreground">
                    {clarityLabel ?? t("unknown")}
                  </span>
                </div>
              </div>

              {/* In Stock */}
              <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                <CheckCircle
                  className={`w-5 h-5 ${
                    gemstone.in_stock ? "text-emerald-500" : "text-red-500"
                  }`}
                />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("product.inStock")}
                  </span>
                  <span
                    className={`font-medium ${
                      gemstone.in_stock
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {gemstone.in_stock
                      ? t("product.inStock")
                      : t("product.outOfStock")}
                  </span>
                </div>
              </div>

              {/* Quantity */}
              {gemstone.quantity !== null && gemstone.quantity > 0 && (
                <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("product.quantity")}
                    </span>
                    <span className="font-medium text-foreground">
                      {gemstone.quantity}
                    </span>
                  </div>
                </div>
              )}

              {/* Origin */}
              {gemstone.origin && (
                <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4 text-muted-foreground"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("product.origin")}
                    </span>
                    <span className="font-medium text-foreground">
                      {gemstone.origin.name}
                    </span>
                  </div>
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
              {t("gemstone.detail.daysDelivery", {
                days: gemstone.delivery_days,
              })}
            </div>
          )}
        </div>

        {/* Show emotional description snippet if available (prefer v6, locale-aware) */}
        {(() => {
          const v6Text = (gemstone as any).v6_text;
          const description =
            locale === "ru"
              ? v6Text?.emotional_description_ru ||
                v6Text?.emotional_description_en
              : v6Text?.emotional_description_en ||
                v6Text?.emotional_description_ru;

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
        className={`bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden
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
      className={`bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden
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
