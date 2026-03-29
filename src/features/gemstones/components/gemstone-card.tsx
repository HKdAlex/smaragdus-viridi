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
import type { ComponentProps } from "react";

import { useCurrency } from "@/features/currency/hooks/use-currency";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { CatalogGemstone } from "../services/gemstone-fetch.service";
import { useGemstoneTranslations } from "../utils/gemstone-translations";
import { resolveGemstoneTypeLabelSource } from "../utils/gemstone-type-display";
import { selectPrimaryImage } from "../utils/select-primary-image";

// ===== TYPES =====

export interface GemstoneCardProps {
  gemstone: CatalogGemstone;
  variant?: "catalog" | "admin" | "compact";
  showActions?: boolean;
  onSelect?: (id: string) => void;
  /** Locale-aware link target (defaults to this gemstone’s catalog detail page) */
  href?: NonNullable<ComponentProps<typeof Link>["href"]>;
  className?: string;
}

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
    translateIfEnumCode,
  } = useGemstoneTranslations();

  // Contract: DISPLAY-C8.0
  // Use display_* fields from database (precedence already resolved: Admin Custom > AI > Enum)
  // Only translate if value is an enum code (lowercase, no spaces)
  // Custom values with spaces/Unicode are already in display form
  const typeLabel = translateIfEnumCode(
    resolveGemstoneTypeLabelSource(locale, {
      name: gemstone.name,
      type_code: (gemstone as CatalogGemstone).type_code ?? null,
      display_name: (gemstone as CatalogGemstone).display_name ?? null,
      name_custom: (gemstone as CatalogGemstone).name_custom ?? null,
      name_custom_en: (gemstone as CatalogGemstone).name_custom_en ?? null,
      name_custom_ru: (gemstone as CatalogGemstone).name_custom_ru ?? null,
    }),
    translateGemstoneType
  );

  const colorLabel = translateIfEnumCode(
    (gemstone as any).display_color || (gemstone as any).ai_color || gemstone.color,
    translateColor
  );

  const cutLabel = translateIfEnumCode(
    (gemstone as any).display_cut || (gemstone as any).v6_text?.detected_cut || gemstone.cut || gemstone.cut_code,
    translateCut
  );

  const clarityLabel = translateIfEnumCode(
    (gemstone as any).display_clarity || gemstone.clarity,
    translateClarity
  );

  // For icon components, use the raw resolved values (not translated)
  const effectiveColor = (gemstone as any).display_color || (gemstone as any).ai_color || gemstone.color;
  const effectiveCut = (gemstone as any).display_cut || (gemstone as any).v6_text?.detected_cut || gemstone.cut || gemstone.cut_code;

  const primaryImageSelection = selectPrimaryImage({
    images: gemstone.images,
    selectedImageUuid:
      gemstone.selected_image_uuid ??
      gemstone.v6_text?.selected_image_uuid ??
      null,
    recommendedPrimaryImageIndex:
      gemstone.recommended_primary_image_index ??
      gemstone.v6_text?.recommended_primary_image_index ??
      null,
    primaryImageUrl: gemstone.primary_image_url ?? null,
  });
  const primaryImage = primaryImageSelection?.image ?? null;
  const primaryImageUrl = primaryImageSelection?.imageUrl ?? null;
  const primaryImageAlt =
    primaryImage?.alt_text ??
    (`${gemstone.color ?? ""} ${gemstone.name ?? ""}`.trim() ||
      "Gemstone image");

  // Use currency context for price formatting
  const { formatPrice } = useCurrency();

  const weightCaratsNum = Number(gemstone.weight_carats);
  const ppcFromDb =
    typeof gemstone.price_per_carat === "number" &&
    gemstone.price_per_carat > 0
      ? gemstone.price_per_carat
      : null;
  const pricePerCaratMinorUnits =
    ppcFromDb !== null
      ? ppcFromDb
      : weightCaratsNum > 0 &&
          Number.isFinite(weightCaratsNum) &&
          gemstone.price_amount > 0
        ? Math.round(gemstone.price_amount / weightCaratsNum)
        : null;

  const defaultHref = {
    pathname: "/catalog/[id]" as const,
    params: { id: gemstone.id },
  };
  const linkHref = href ?? defaultHref;

  const isCompact = variant === "compact";

  const cardContent = (
    <>
      {/* Image Section */}
      <div className="aspect-square relative bg-muted">
        {primaryImageUrl ? (
          <Image
            src={primaryImageUrl}
            alt={primaryImageAlt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onError={() => {
              if (process.env.NODE_ENV === "development") {
                console.warn(
                  `Image failed to load for ${gemstone.serial_number}: ${primaryImageUrl}`
                );
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <div className="text-4xl">💎</div>
          </div>
        )}


        {/* Stock Status Badge - REMOVED as per user request */}

        {/* AI Analysis Indicator */}
        {/* {hasMeaningfulAIAnalysis(gemstone) &&
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
          })()} */}
      </div>

      {/* Details Section */}
      <div className={isCompact ? "p-2" : "p-3 sm:p-4"}>
        {/* Title */}
        <h3
          className={`font-semibold text-foreground capitalize leading-tight mb-3 mt-2 sm:mt-0 ${
            isCompact ? "text-xs" : "text-base sm:text-lg"
          }`}
        >
          {typeLabel}
        </h3>

        {/* Metadata Table Layout */}
        {!isCompact && (
          <div className="mb-3 text-base leading-relaxed">
            <div className="space-y-3">
              {/* Internal Code */}
              {gemstone.internal_code && (
                <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">#</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {t("gemstone.detail.code")}
                    </span>
                    <span className="font-medium text-foreground font-mono text-sm">
                      {gemstone.internal_code}
                    </span>
                  </div>
                </div>
              )}

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
          <div className="flex flex-col gap-0.5 min-w-0">
            <div
              className={`font-bold text-primary ${
                isCompact ? "text-sm" : "text-base sm:text-lg"
              }`}
            >
              {formatPrice(gemstone.price_amount, gemstone.price_currency)}
            </div>
            {pricePerCaratMinorUnits !== null && (
              <div
                className={`text-muted-foreground font-medium tabular-nums flex items-baseline gap-1 flex-wrap ${
                  isCompact ? "text-[10px]" : "text-xs sm:text-sm"
                }`}
              >
                <span>
                  {formatPrice(
                    pricePerCaratMinorUnits,
                    gemstone.price_currency
                  )}
                </span>
                <span className="font-normal">
                  / {t("gemstone.detail.caratSuffix")}
                </span>
              </div>
            )}
          </div>

          {gemstone.delivery_days && (
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded self-start sm:self-auto">
              {t("gemstone.detail.daysDelivery", {
                days: gemstone.delivery_days,
              })}
            </div>
          )}
        </div>
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
