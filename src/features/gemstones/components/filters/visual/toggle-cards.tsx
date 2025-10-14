"use client";

import { useTranslations } from "next-intl";

interface ToggleCardsProps {
  inStockOnly: boolean;
  onInStockChange: (value: boolean) => void;
  withCertification: boolean;
  onCertificationChange: (value: boolean) => void;
  withImages: boolean;
  onImagesChange: (value: boolean) => void;
}

export function ToggleCards({
  inStockOnly,
  onInStockChange,
  withCertification,
  onCertificationChange,
  withImages,
  onImagesChange,
}: ToggleCardsProps) {
  const t = useTranslations("filters");

  const toggleOptions = [
    {
      labelKey: "visual.inStockOnly",
      icon: "📦",
      active: inStockOnly,
      onChange: onInStockChange,
      activeColor:
        "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
      descriptionKey: "visual.availableNow",
    },
    {
      labelKey: "visual.certified",
      icon: "🏆",
      active: withCertification,
      onChange: onCertificationChange,
      activeColor:
        "border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      descriptionKey: "visual.withCertificate",
    },
    {
      labelKey: "visual.withImages",
      icon: "📸",
      active: withImages,
      onChange: onImagesChange,
      activeColor:
        "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400",
      descriptionKey: "visual.photosAvailable",
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("visual.quickFilters")}
      </h3>
      <div className="grid grid-cols-3 gap-2">
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
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                active
                  ? activeColor
                  : "border-border bg-card hover:border-muted-foreground/50 text-muted-foreground"
              }`}
              title={t(descriptionKey)}
            >
              <div className="flex flex-col items-center space-y-1">
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-medium text-center">
                  {t(labelKey)}
                </span>
              </div>
              {active && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-current rounded-full flex items-center justify-center opacity-75">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}

