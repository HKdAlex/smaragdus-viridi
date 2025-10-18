"use client";

import { BookOpen, Clock, Info, Shield, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface V6TextContent {
  technical_description_en: string | null;
  technical_description_ru: string | null;
  emotional_description_en: string | null;
  emotional_description_ru: string | null;
  narrative_story_en: string | null;
  narrative_story_ru: string | null;
  historical_context_en: string | null;
  historical_context_ru: string | null;
  care_instructions_en: string | null;
  care_instructions_ru: string | null;
  marketing_highlights: string[] | null;
  marketing_highlights_ru: string[] | null;
  promotional_text: string | null;
  promotional_text_ru: string | null;
}

interface GemstoneDetailV6TabsProps {
  v6Text: V6TextContent | null;
  locale?: string;
}

export function GemstoneDetailV6Tabs({
  v6Text,
  locale,
}: GemstoneDetailV6TabsProps) {
  const t = useTranslations("catalog.gemstone.detail");
  const [activeTab, setActiveTab] = useState<"overview" | "story" | "care">(
    "overview"
  );

  if (!v6Text) return null;

  const tabs = [
    { id: "overview" as const, label: t("overview"), icon: Info },
    { id: "story" as const, label: t("storyAndHistory"), icon: BookOpen },
    { id: "care" as const, label: t("careAndDetails"), icon: Shield },
  ];

  return (
    <Card className="border border-white/10 shadow-2xl bg-white/5 dark:bg-black/20 backdrop-blur-xl">
      <CardContent className="p-0">
        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-white/5 dark:bg-black/10 backdrop-blur-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "text-primary border-b-2 border-primary bg-white/10 dark:bg-black/20 backdrop-blur-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 dark:hover:bg-black/10"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Technical & Emotional Split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Technical Description */}
                {v6Text.technical_description_en && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Info className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">
                          {t("technicalDescription")}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {t("aiGenerated")}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {locale === "ru"
                        ? v6Text.technical_description_ru ||
                          v6Text.technical_description_en
                        : v6Text.technical_description_en}
                    </p>
                  </div>
                )}

                {/* Emotional Description */}
                {v6Text.emotional_description_en && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">
                          {t("emotionalDescription")}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {t("theFeeling")}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed italic">
                      {locale === "ru"
                        ? v6Text.emotional_description_ru ||
                          v6Text.emotional_description_en
                        : v6Text.emotional_description_en}
                    </p>
                  </div>
                )}
              </div>

              {/* Marketing Highlights */}
              {(() => {
                const highlights =
                  locale === "ru"
                    ? v6Text.marketing_highlights_ru ||
                      v6Text.marketing_highlights
                    : v6Text.marketing_highlights;
                return (
                  highlights &&
                  highlights.length > 0 && (
                    <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                      <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        {t("keyHighlights")}
                      </h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {highlights.map((highlight, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-foreground/90"
                          >
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                );
              })()}

              {/* Promotional Text */}
              {(() => {
                const promoText =
                  locale === "ru"
                    ? v6Text.promotional_text_ru || v6Text.promotional_text
                    : v6Text.promotional_text;
                return (
                  promoText && (
                    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 rounded-xl p-6 border border-amber-500/20">
                      <p className="text-sm text-foreground/90 leading-relaxed text-center font-medium">
                        {promoText}
                      </p>
                    </div>
                  )
                );
              })()}
            </div>
          )}

          {/* Story Tab */}
          {activeTab === "story" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Narrative Story */}
              {v6Text.narrative_story_en && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">
                        {t("narrativeStory")}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("journey")}
                      </p>
                    </div>
                  </div>
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                      {locale === "ru"
                        ? v6Text.narrative_story_ru || v6Text.narrative_story_en
                        : v6Text.narrative_story_en}
                    </p>
                  </div>
                </div>
              )}

              {/* Historical Context */}
              {v6Text.historical_context_en && (
                <div className="space-y-4 border-t border-border pt-6">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10">
                      <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">
                        {t("historicalContext")}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("throughAges")}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {locale === "ru"
                      ? v6Text.historical_context_ru ||
                        v6Text.historical_context_en
                      : v6Text.historical_context_en}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Care Tab */}
          {activeTab === "care" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Care Instructions */}
              {v6Text.care_instructions_en && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                      <Shield className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">
                        {t("careInstructions")}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("keepPristine")}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {locale === "ru"
                      ? v6Text.care_instructions_ru ||
                        v6Text.care_instructions_en
                      : v6Text.care_instructions_en}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
