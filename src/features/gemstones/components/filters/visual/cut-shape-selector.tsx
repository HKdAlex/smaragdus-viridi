"use client";

import { useTranslations } from "next-intl";

interface CutShapeSelectorProps {
  selectedCuts: string[];
  onCutChange: (cuts: string[]) => void;
}

export function CutShapeSelector({
  selectedCuts,
  onCutChange,
}: CutShapeSelectorProps) {
  const t = useTranslations("filters");

  const cutShapes = [
    { value: "round", icon: "●" },
    { value: "oval", icon: "○" },
    { value: "marquise", icon: "◊" },
    { value: "pear", icon: "♦" },
    { value: "emerald", icon: "▭" },
    { value: "princess", icon: "■" },
    { value: "cushion", icon: "▢" },
    { value: "radiant", icon: "▦" },
    { value: "fantasy", icon: "✦" },
  ];

  const toggleCut = (cut: string) => {
    if (selectedCuts.includes(cut)) {
      onCutChange(selectedCuts.filter((c) => c !== cut));
    } else {
      onCutChange([...selectedCuts, cut]);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("visual.cutShape")}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {cutShapes.map(({ value, icon }) => (
          <button
            key={value}
            onClick={() => toggleCut(value)}
            className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
              selectedCuts.includes(value)
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              <span
                className={`text-2xl ${
                  selectedCuts.includes(value)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {icon}
              </span>
              <span
                className={`text-xs font-medium ${
                  selectedCuts.includes(value)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {t(`advanced.cuts.${value}`)}
              </span>
            </div>
            {selectedCuts.includes(value) && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

