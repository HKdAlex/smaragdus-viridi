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
  GemstoneColorIcon,
  GemstoneCutIcon,
  GemstoneTypeIcon,
} from "@/shared/components/ui/gemstone-icons";

import type { CatalogGemstone } from "../services/gemstone-fetch.service";
import Link from "next/link";
import { SafeImage } from "@/shared/components/ui/safe-image";
import { useGemstoneTranslations } from "../utils/gemstone-translations";
import { useTranslations } from "next-intl";

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
  const {
    translateColor,
    translateCut,
    translateClarity,
    translateGemstoneType,
  } = useGemstoneTranslations();

  const primaryImage =
    gemstone.images?.find((img) => img.is_primary) || gemstone.images?.[0];

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
          <SafeImage
            src={primaryImage.image_url}
            alt={`${gemstone.color} ${gemstone.name}`}
            width={400}
            height={400}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onError={(error: string) => {
              if (process.env.NODE_ENV === "development") {
                console.warn(
                  `Image failed to load for ${gemstone.serial_number}:`,
                  error
                );
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <div className="text-4xl">💎</div>
          </div>
        )}

        {/* Serial Number Overlay */}
        <div className="absolute bottom-2 right-2 bg-black/75 dark:bg-black/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          {gemstone.serial_number}
        </div>

        {/* Stock Status */}
        {!gemstone.in_stock && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded shadow-sm">
            Out of Stock
          </div>
        )}

        {gemstone.in_stock && (
          <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-sm">
            Available
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
          className={`font-semibold text-foreground capitalize leading-tight mb-3 ${
            isCompact ? "text-xs" : "text-sm sm:text-base"
          }`}
        >
          {translateColor(gemstone.color)}{" "}
          {translateGemstoneType(gemstone.name)}
        </h3>

        {/* Attributes */}
        {!isCompact && (
          <div className="space-y-2 mb-3">
            {/* Gemstone Type */}
            <div className="flex items-center space-x-2">
              <GemstoneTypeIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {t("type")}:
              </span>
              <span className="text-xs font-medium text-foreground">
                {translateGemstoneType(gemstone.name)}
              </span>
            </div>

            {/* Color */}
            <div className="flex items-center space-x-2">
              <GemstoneColorIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {t("color")}:
              </span>
              <ColorIndicator color={gemstone.color} className="w-3 h-3" />
              <span className="text-xs font-medium text-foreground">
                {translateColor(gemstone.color)}
              </span>
            </div>

            {/* Cut */}
            <div className="flex items-center space-x-2">
              <GemstoneCutIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("cut")}:</span>
              <CutIcon cut={gemstone.cut} className="w-4 h-4" />
              <span className="text-xs font-medium text-foreground">
                {translateCut(gemstone.cut)}
              </span>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div
          className={`space-y-1 text-muted-foreground mb-3 ${
            isCompact ? "text-xs" : "text-xs sm:text-sm"
          }`}
        >
          <div className="font-medium text-foreground">
            {gemstone.weight_carats}ct
          </div>
          <div>{translateClarity(gemstone.clarity)}</div>
          {gemstone.origin && (
            <div className="text-xs">Origin: {gemstone.origin.name}</div>
          )}
        </div>

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
