"use client";

import { useTranslations } from "next-intl";

import type { MiningCountryOption } from "../../../hooks/use-mining-country-options";

interface MiningCountrySelectorProps {
  selectedCountries: string[];
  onCountryChange: (countries: string[]) => void;
  options: MiningCountryOption[];
}

/**
 * Visual Mining Country Selector
 *
 * Displays mining countries as visual cards with country flags/icons.
 * Part of FILTER-C1.2: Mining Country filter.
 */
export function MiningCountrySelector({
  selectedCountries,
  onCountryChange,
  options,
}: MiningCountrySelectorProps) {
  const t = useTranslations("filters");

  const countryIcons: Record<string, string> = {
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
    // Default
    unknown: "🌐",
  };

  const getIcon = (value: string) => {
    const normalizedValue = value.toLowerCase().replace(/\s+/g, "-");
    return countryIcons[normalizedValue] || "🌐";
  };

  const toggleCountry = (country: string) => {
    if (selectedCountries.includes(country)) {
      onCountryChange(selectedCountries.filter((value) => value !== country));
    } else {
      onCountryChange([...selectedCountries, country]);
    }
  };

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("visual.miningCountry")}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {options.map(({ value, label, count }) => {
          const isDisabled = count === 0;
          const isSelected = selectedCountries.includes(value);

          return (
            <button
              key={value}
              onClick={() => !isDisabled && toggleCountry(value)}
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
