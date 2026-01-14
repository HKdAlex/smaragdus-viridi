"use client";

import { useTranslations } from "next-intl";

interface GemstoneTypeSelectorProps {
  selectedTypes: string[];
  onTypeChange: (types: string[]) => void;
  options?: { value: string; label: string; count: number }[];
}

/**
 * Visual Gemstone Type Selector
 *
 * Displays gemstone types as visual cards with icons.
 * Part of FILTER-C0.2: Add missing filters to Visual mode.
 */
export function GemstoneTypeSelector({
  selectedTypes,
  onTypeChange,
  options,
}: GemstoneTypeSelectorProps) {
  const t = useTranslations("filters");

  // Default gemstone types with icons (emoji representations)
  const defaultGemstoneTypes = [
    { value: "diamond", icon: "💎", color: "#E8E8E8" },
    { value: "emerald", icon: "💚", color: "#50C878" },
    { value: "ruby", icon: "❤️", color: "#E0115F" },
    { value: "sapphire", icon: "💙", color: "#0F52BA" },
    { value: "amethyst", icon: "💜", color: "#9966CC" },
    { value: "topaz", icon: "🧡", color: "#FFC87C" },
    { value: "garnet", icon: "🔴", color: "#733635" },
    { value: "peridot", icon: "💚", color: "#AAFF00" },
    { value: "citrine", icon: "🟡", color: "#E4D00A" },
    { value: "tanzanite", icon: "🔵", color: "#4169E1" },
    { value: "aquamarine", icon: "🩵", color: "#7FFFD4" },
    { value: "morganite", icon: "🩷", color: "#FFB7C5" },
    { value: "tourmaline", icon: "🌈", color: "#86C67C" },
    { value: "spinel", icon: "✨", color: "#FF0080" },
    { value: "alexandrite", icon: "🔮", color: "#008080" },
    { value: "paraiba", icon: "💠", color: "#00CED1" },
  ];

  // Use options if provided (for dynamic counts), otherwise use defaults
  const displayTypes = options
    ? defaultGemstoneTypes.filter((gt) =>
        options.some((opt) => opt.value === gt.value)
      )
    : defaultGemstoneTypes;

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypeChange([...selectedTypes, type]);
    }
  };

  const getCount = (value: string) => {
    if (!options) return null;
    const option = options.find((opt) => opt.value === value);
    return option?.count;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("visual.gemstoneType")}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {displayTypes.map(({ value, icon, color }) => {
          const count = getCount(value);
          const isDisabled = count === 0;
          const isSelected = selectedTypes.includes(value);

          return (
            <button
              key={value}
              onClick={() => !isDisabled && toggleType(value)}
              disabled={isDisabled}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                isDisabled
                  ? "opacity-40 cursor-not-allowed border-border bg-muted"
                  : isSelected
                    ? "border-primary bg-primary/10 shadow-md hover:scale-105"
                    : "border-border bg-card hover:border-primary/50 hover:scale-105"
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <span
                  className="text-2xl"
                  style={{
                    filter: isSelected ? "none" : "grayscale(30%)",
                  }}
                >
                  {icon}
                </span>
                <span
                  className={`text-xs font-medium truncate w-full text-center ${
                    isSelected ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {t(`advanced.gemstoneTypes.${value}`)}
                </span>
                {typeof count === "number" && count > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    ({count})
                  </span>
                )}
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
