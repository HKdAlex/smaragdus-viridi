"use client";

import {
  BASIC_COLOR_PICKER_VISUAL,
  BASIC_GEM_COLORS,
  DIAMOND_COLOR_GRADES,
  DIAMOND_COLOR_PICKER_VISUAL,
} from "@/shared/config/basic-gem-colors";
import { useTranslations } from "next-intl";

interface ColorPickerProps {
  selectedColors: string[];
  onColorChange: (colors: string[]) => void;
}

export function ColorPicker({
  selectedColors,
  onColorChange,
}: ColorPickerProps) {
  const t = useTranslations("filters");

  const toggleColor = (color: string) => {
    if (selectedColors.includes(color)) {
      onColorChange(selectedColors.filter((c) => c !== color));
    } else {
      onColorChange([...selectedColors, color]);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        {t("advanced.color")}
      </h3>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {t("visual.coloredGemstones")}
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {BASIC_GEM_COLORS.map((value) => {
            const { gradient } = BASIC_COLOR_PICKER_VISUAL[value];
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleColor(value)}
                className={`relative p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  selectedColors.includes(value)
                    ? "border-primary shadow-md"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} shadow-inner border border-border`}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {t(`advanced.colors.${value}`)}
                  </span>
                </div>
                {selectedColors.includes(value) && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-xs">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("visual.diamondColorGrades")}
        </h4>
        <div className="grid grid-cols-6 gap-1 sm:grid-cols-11">
          {DIAMOND_COLOR_GRADES.map((value) => {
            const { hex } = DIAMOND_COLOR_PICKER_VISUAL[value];
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleColor(value)}
                className={`relative p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  selectedColors.includes(value)
                    ? "border-primary shadow-md"
                    : "border-border hover:border-primary/50"
                }`}
                title={t(`advanced.colors.${value}`)}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div
                    className="w-6 h-6 rounded-full shadow-inner border border-border"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-xs font-bold text-foreground">
                    {value}
                  </span>
                </div>
                {selectedColors.includes(value) && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-xs">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
