"use client";

import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type { DetailGemstone } from "@/shared/types";
import { AlertCircle, CheckCircle, Flame, Info, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface TreatmentDisclosureProps {
  gemstone: DetailGemstone;
}

/**
 * Treatment & Enhancement Disclosure Section (FLEX-C3.2)
 * 
 * Displays treatment and enhancement information for professional jewelers:
 * - Treatment status (with visual indicators)
 * - Enhancement notes
 * - Color change description (for alexandrites and similar)
 * 
 * Visual indicators:
 * - "Untreated/Natural" shows green badge
 * - "Treated" shows amber/yellow badge with treatment type
 * 
 * Only renders if at least one field has data.
 */
export function TreatmentDisclosure({
  gemstone,
}: TreatmentDisclosureProps) {
  const t = useTranslations("catalog.gemstone.detail");

  // Check if any treatment fields have data
  const hasTreatmentStatus = gemstone.treatment_status && gemstone.treatment_status.trim();
  const hasEnhancementNotes = gemstone.enhancement_notes && gemstone.enhancement_notes.trim();
  const hasColorChangeDescription = gemstone.color_change_description && gemstone.color_change_description.trim();

  const hasAnyData = hasTreatmentStatus || hasEnhancementNotes || hasColorChangeDescription;

  // Don't render if no data
  if (!hasAnyData) {
    return null;
  }

  // Determine if the stone is natural/untreated based on treatment status
  const treatmentStatus = gemstone.treatment_status?.toLowerCase() || "";
  const isNatural = 
    treatmentStatus.includes("untreated") ||
    treatmentStatus.includes("natural") ||
    treatmentStatus.includes("no treatment") ||
    treatmentStatus.includes("без обработки") ||
    treatmentStatus.includes("природн") ||
    treatmentStatus.includes("необлагорожен");

  const isHeated = 
    treatmentStatus.includes("heat") ||
    treatmentStatus.includes("heated") ||
    treatmentStatus.includes("нагрев") ||
    treatmentStatus.includes("термообработ");

  const isOiled = 
    treatmentStatus.includes("oil") ||
    treatmentStatus.includes("oiled") ||
    treatmentStatus.includes("масл") ||
    treatmentStatus.includes("промасл");

  return (
    <Card className="border border-white/10 shadow-2xl bg-white/5 dark:bg-black/20 backdrop-blur-xl">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center text-xl sm:text-2xl font-bold text-foreground">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <Info className="w-5 h-5 text-white" />
          </div>
          {t("treatmentProvenance")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-4 sm:space-y-6">
          {/* Treatment Status with Visual Indicator */}
          {hasTreatmentStatus && (
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl p-4 sm:p-5 rounded-xl border border-white/10 shadow-lg">
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className={`p-2.5 rounded-xl ${
                  isNatural 
                    ? "bg-emerald-500/20 text-emerald-500" 
                    : "bg-amber-500/20 text-amber-500"
                }`}>
                  {isNatural ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : isHeated ? (
                    <Flame className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      {t("treatmentStatus")}
                    </span>
                    {/* Status Badge */}
                    <Badge
                      variant={isNatural ? "default" : "secondary"}
                      className={`text-xs font-semibold ${
                        isNatural
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : isHeated
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : isOiled
                          ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
                          : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
                      }`}
                    >
                      {isNatural ? t("natural") : isHeated ? t("heatTreated") : isOiled ? t("oiled") : t("treated")}
                    </Badge>
                  </div>
                  <p className="text-foreground font-medium leading-relaxed">
                    {gemstone.treatment_status}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Color Change Description (for alexandrites) */}
          {hasColorChangeDescription && (
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl p-4 sm:p-5 rounded-xl border border-white/10 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold block mb-2">
                    {t("colorChangeEffect")}
                  </span>
                  <p className="text-foreground font-medium leading-relaxed">
                    {gemstone.color_change_description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enhancement Notes */}
          {hasEnhancementNotes && (
            <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl p-4 sm:p-5 rounded-xl border border-white/10 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-blue-500/20">
                  <Info className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold block mb-2">
                    {t("enhancementNotes")}
                  </span>
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {gemstone.enhancement_notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
