/**
 * Toggle Cards Component
 * 
 * Quick filter toggles with premium animations.
 * FILTER-C5.3: Enhanced with micro-interactions.
 */

"use client";

import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion";

interface ToggleCardsProps {
  inStockOnly: boolean;
  onInStockChange: (value: boolean) => void;
  withCertification: boolean;
  onCertificationChange: (value: boolean) => void;
  withImages: boolean;
  onImagesChange: (value: boolean) => void;
  withColorChange: boolean;
  onColorChange: (value: boolean) => void;
  withAIAnalysis: boolean;
  onAIAnalysisChange: (value: boolean) => void;
}

export function ToggleCards({
  inStockOnly,
  onInStockChange,
  withCertification,
  onCertificationChange,
  withImages,
  onImagesChange,
  withColorChange,
  onColorChange,
  withAIAnalysis,
  onAIAnalysisChange,
}: ToggleCardsProps) {
  const t = useTranslations("filters");
  const prefersReducedMotion = useReducedMotion();

  const toggleOptions = [
    {
      labelKey: "visual.inStockOnly",
      icon: "📦",
      active: inStockOnly,
      onChange: onInStockChange,
      activeColor:
        "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 shadow-green-500/20",
      descriptionKey: "visual.availableNow",
    },
    {
      labelKey: "visual.certified",
      icon: "🏆",
      active: withCertification,
      onChange: onCertificationChange,
      activeColor:
        "border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 shadow-yellow-500/20",
      descriptionKey: "visual.withCertificate",
    },
    {
      labelKey: "visual.withImages",
      icon: "📸",
      active: withImages,
      onChange: onImagesChange,
      activeColor:
        "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-blue-500/20",
      descriptionKey: "visual.photosAvailable",
    },
    {
      labelKey: "visual.colorChange",
      icon: "🌈",
      active: withColorChange,
      onChange: onColorChange,
      activeColor:
        "border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-400 shadow-purple-500/20",
      descriptionKey: "visual.colorChangeHint",
    },
    {
      labelKey: "visual.aiAnalysis",
      icon: "🧠",
      active: withAIAnalysis,
      onChange: onAIAnalysisChange,
      activeColor:
        "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-indigo-500/20",
      descriptionKey: "visual.aiAnalysisHint",
    },
  ];

  const transitionClasses = prefersReducedMotion
    ? ""
    : "transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]";

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("visual.quickFilters")}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {toggleOptions.map(
          ({
            labelKey,
            icon,
            active,
            onChange,
            activeColor,
            descriptionKey,
          }) => (
            <button
              key={labelKey}
              onClick={() => onChange(!active)}
              className={`relative p-3 rounded-xl border-2 ${transitionClasses} ${
                active
                  ? `${activeColor} shadow-lg`
                  : "border-border bg-card hover:border-muted-foreground/50 text-muted-foreground hover:shadow-md"
              }`}
              title={t(descriptionKey)}
            >
              <div className="flex flex-col items-center space-y-1">
                <span
                  className={`text-xl ${
                    !prefersReducedMotion && active
                      ? "animate-bounce-in"
                      : ""
                  }`}
                >
                  {icon}
                </span>
                <span className="text-xs font-medium text-center">
                  {t(labelKey)}
                </span>
              </div>
              {/* Animated check mark */}
              <div
                className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center ${
                  !prefersReducedMotion
                    ? "transition-all duration-200"
                    : ""
                } ${
                  active
                    ? "bg-current scale-100 opacity-100"
                    : "scale-0 opacity-0"
                }`}
              >
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </button>
          )
        )}
      </div>
    </div>
  );
}

