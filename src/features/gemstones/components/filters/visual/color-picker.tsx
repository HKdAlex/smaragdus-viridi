"use client";

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

  const colorOptions = [
    {
      value: "red",
      hex: "#DC143C",
      gradient: "from-red-400 to-red-600",
    },
    {
      value: "blue",
      hex: "#4169E1",
      gradient: "from-blue-400 to-blue-600",
    },
    {
      value: "green",
      hex: "#32CD32",
      gradient: "from-green-400 to-green-600",
    },
    {
      value: "yellow",
      hex: "#FFD700",
      gradient: "from-yellow-300 to-yellow-500",
    },
    {
      value: "pink",
      hex: "#FF69B4",
      gradient: "from-pink-400 to-pink-600",
    },
    {
      value: "white",
      hex: "#FFFFFF",
      gradient: "from-gray-100 to-gray-300",
    },
    {
      value: "black",
      hex: "#2F2F2F",
      gradient: "from-gray-700 to-gray-900",
    },
    {
      value: "colorless",
      hex: "#F8F8FF",
      gradient: "from-gray-50 to-gray-200",
    },
  ];

  const diamondGrades = [
    {
      value: "D",
      hex: "#FFFFFF",
      description: "Absolutely colorless",
    },
    { value: "E", hex: "#FEFEFE", description: "Colorless" },
    { value: "F", hex: "#FDFDFD", description: "Colorless" },
    { value: "G", hex: "#FBFBFB", description: "Near colorless" },
    { value: "H", hex: "#F9F9F9", description: "Near colorless" },
    { value: "I", hex: "#F7F7F7", description: "Near colorless" },
    { value: "J", hex: "#F5F5F5", description: "Near colorless" },
  ];

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

      {/* Colored Gemstones */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {t("visual.coloredGemstones")}
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {colorOptions.map(({ value, gradient }) => (
            <button
              key={value}
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
          ))}
        </div>
      </div>

      {/* Diamond Color Grades */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("visual.diamondColorGrades")}
        </h4>
        <div className="grid grid-cols-7 gap-1">
          {diamondGrades.map(({ value, hex, description }) => (
            <button
              key={value}
              onClick={() => toggleColor(value)}
              className={`relative p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 group ${
                selectedColors.includes(value)
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/50"
              }`}
              title={description}
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
          ))}
        </div>
      </div>
    </div>
  );
}

