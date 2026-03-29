"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shared/components/ui/card";
import type { DetailGemstone } from "@/shared/types";
import { Award, Globe, MapPin, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface ProfessionalSpecificationsProps {
  gemstone: DetailGemstone;
}

/**
 * Professional Specifications Section (FLEX-C3.1)
 * 
 * Displays custom gemstone properties for professional jewelers:
 * - Custom name/type description
 * - Custom color description
 * - Custom cut description
 * - Custom clarity/quality description
 * - Quality classification (e.g., Russian ТУ Г1/Г2/Г3)
 * - Mining country
 * - Cutting country
 * 
 * Only renders if at least one field has data.
 */
export function ProfessionalSpecifications({
  gemstone,
}: ProfessionalSpecificationsProps) {
  const t = useTranslations("catalog.gemstone.detail");
  const locale = useLocale();

  const localizedCustomName = (
    locale.toLowerCase().startsWith("ru")
      ? gemstone.name_custom_ru ?? gemstone.name_custom
      : gemstone.name_custom_en ?? gemstone.name_custom
  )?.trim();

  // Check if any professional specification fields have data
  const hasNameCustom = !!localizedCustomName;
  const hasColorCustom = gemstone.color_custom && gemstone.color_custom.trim();
  const hasCutCustom = gemstone.cut_custom && gemstone.cut_custom.trim();
  const hasClarityCustom = gemstone.clarity_custom && gemstone.clarity_custom.trim();
  const hasQualityClassification = gemstone.quality_classification && gemstone.quality_classification.trim();
  const hasMiningCountry = gemstone.mining_country && gemstone.mining_country.trim();
  const hasCuttingCountry = gemstone.cutting_country && gemstone.cutting_country.trim();
  
  // Origin fallback: use origin.country if mining_country is not specified
  const hasOriginCountry = gemstone.origin?.country && gemstone.origin.country.trim();
  
  // Effective mining country: mining_country overrides origin.country
  const effectiveMiningCountry = hasMiningCountry 
    ? gemstone.mining_country 
    : (hasOriginCountry ? gemstone.origin?.country : null);
  const hasEffectiveMiningCountry = !!effectiveMiningCountry;

  const hasAnyData =
    hasNameCustom ||
    hasColorCustom ||
    hasCutCustom ||
    hasClarityCustom ||
    hasQualityClassification ||
    hasEffectiveMiningCountry ||
    hasCuttingCountry;

  // Don't render if no data
  if (!hasAnyData) {
    return null;
  }

  return (
    <Card className="border border-white/10 shadow-2xl bg-white/5 dark:bg-black/20 backdrop-blur-xl">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center text-xl sm:text-2xl font-bold text-foreground">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center mr-3">
            <Award className="w-5 h-5 text-white" />
          </div>
          {t("professionalSpecifications")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Custom Properties Section */}
          {(hasNameCustom || hasColorCustom || hasCutCustom || hasClarityCustom || hasQualityClassification) && (
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl p-3 sm:p-4 rounded-xl border border-white/10 shadow-lg">
              <h4 className="font-bold text-sm sm:text-base text-foreground mb-3 sm:mb-4 flex items-center">
                <div className="w-1 h-5 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full mr-2" />
                {t("detailedCharacteristics")}
              </h4>
              <div className="space-y-3 sm:space-y-4 text-sm sm:text-base leading-relaxed">
                {hasNameCustom && (
                  <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                    <Sparkles className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
                        {t("gemstoneType")}
                      </span>
                      <span className="font-medium text-foreground">
                        {localizedCustomName}
                      </span>
                    </div>
                  </div>
                )}

                {hasColorCustom && (
                  <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 mt-0.5" />
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
                        {t("colorDescription")}
                      </span>
                      <span className="font-medium text-foreground">
                        {gemstone.color_custom}
                      </span>
                    </div>
                  </div>
                )}

                {hasCutCustom && (
                  <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500">
                        <path d="M12 2L2 9l10 7 10-7-10-7zm0 14.5L4 11l8 5.5 8-5.5-8 5.5z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
                        {t("cutDescription")}
                      </span>
                      <span className="font-medium text-foreground">
                        {gemstone.cut_custom}
                      </span>
                    </div>
                  </div>
                )}

                {hasClarityCustom && (
                  <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400" />
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
                        {t("clarityDescription")}
                      </span>
                      <span className="font-medium text-foreground">
                        {gemstone.clarity_custom}
                      </span>
                    </div>
                  </div>
                )}

                {hasQualityClassification && (
                  <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                    <Award className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
                        {t("qualityClassification")}
                      </span>
                      <span className="font-medium text-foreground">
                        {gemstone.quality_classification}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Origin Section */}
          {(hasEffectiveMiningCountry || hasCuttingCountry) && (
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl p-3 sm:p-4 rounded-xl border border-white/10 shadow-lg">
              <h4 className="font-bold text-sm sm:text-base text-foreground mb-3 sm:mb-4 flex items-center">
                <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full mr-2" />
                {t("originProvenance")}
              </h4>
              <div className="space-y-3 sm:space-y-4 text-sm sm:text-base leading-relaxed">
                {hasEffectiveMiningCountry && (
                  <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                    <MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
                        {/* Show different label based on source */}
                        {hasMiningCountry ? t("miningCountry") : t("originCountry")}
                      </span>
                      <span className="font-medium text-foreground">
                        {effectiveMiningCountry}
                      </span>
                    </div>
                  </div>
                )}

                {hasCuttingCountry && (
                  <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
                    <Globe className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
                        {t("cuttingCountry")}
                      </span>
                      <span className="font-medium text-foreground">
                        {gemstone.cutting_country}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
