"use client";

import { useTranslations } from "next-intl";

interface OriginSelectorProps {
  selectedOrigins: string[];
  onOriginChange: (origins: string[]) => void;
  options?: { value: string; label: string; count: number }[];
}

/**
 * Visual Origin Selector
 *
 * Displays gemstone origins as visual cards with country flags/icons.
 * Part of FILTER-C0.2: Add missing filters to Visual mode.
 */
export function OriginSelector({
  selectedOrigins,
  onOriginChange,
  options = [],
}: OriginSelectorProps) {
  const t = useTranslations("filters");

  // Country/region icons mapping
  const originIcons: Record<string, string> = {
    // Countries
    brazil: "🇧🇷",
    colombia: "🇨🇴",
    zambia: "🇿🇲",
    myanmar: "🇲🇲",
    thailand: "🇹🇭",
    india: "🇮🇳",
    "sri-lanka": "🇱🇰",
    madagascar: "🇲🇬",
    russia: "🇷🇺",
    australia: "🇦🇺",
    tanzania: "🇹🇿",
    kenya: "🇰🇪",
    mozambique: "🇲🇿",
    afghanistan: "🇦🇫",
    pakistan: "🇵🇰",
    nigeria: "🇳🇬",
    ethiopia: "🇪🇹",
    usa: "🇺🇸",
    canada: "🇨🇦",
    china: "🇨🇳",
    vietnam: "🇻🇳",
    cambodia: "🇰🇭",
    // Regions
    africa: "🌍",
    "south-america": "🌎",
    asia: "🌏",
    // Default
    unknown: "🌐",
  };

  const getIcon = (value: string) => {
    const normalizedValue = value.toLowerCase().replace(/\s+/g, "-");
    return originIcons[normalizedValue] || "🌐";
  };

  const toggleOrigin = (origin: string) => {
    if (selectedOrigins.includes(origin)) {
      onOriginChange(selectedOrigins.filter((o) => o !== origin));
    } else {
      onOriginChange([...selectedOrigins, origin]);
    }
  };

  // If no options provided, show nothing (origins are dynamic from database)
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("visual.origin")}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {options.map(({ value, label, count }) => {
          const isDisabled = count === 0;
          const isSelected = selectedOrigins.includes(value);

          return (
            <button
              key={value}
              onClick={() => !isDisabled && toggleOrigin(value)}
              disabled={isDisabled}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 ${
                isDisabled
                  ? "opacity-40 cursor-not-allowed border-border bg-muted"
                  : isSelected
                    ? "border-primary bg-primary/10 shadow-md hover:scale-105"
                    : "border-border bg-card hover:border-primary/50 hover:scale-105"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-xl">{getIcon(value)}</span>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span
                    className={`text-xs font-medium truncate w-full ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                  {count > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      ({count})
                    </span>
                  )}
                </div>
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
