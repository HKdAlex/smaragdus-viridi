"use client";

import { useTranslations } from "next-intl";

interface PriceRangeCardsProps {
  selectedRange: [number, number];
  onRangeChange: (range: [number, number]) => void;
}

export function PriceRangeCards({
  selectedRange,
  onRangeChange,
}: PriceRangeCardsProps) {
  const t = useTranslations("filters");

  const priceRanges = [
    { key: "under100", range: [0, 10000] as [number, number], icon: "💎" },
    {
      key: "100to500",
      range: [10000, 50000] as [number, number],
      icon: "💍",
    },
    {
      key: "500to1000",
      range: [50000, 100000] as [number, number],
      icon: "👑",
    },
    {
      key: "1000to5000",
      range: [100000, 500000] as [number, number],
      icon: "✨",
    },
    {
      key: "5000to10000",
      range: [500000, 1000000] as [number, number],
      icon: "🌟",
    },
    {
      key: "over10000",
      range: [1000000, 10000000] as [number, number],
      icon: "💫",
    },
  ];

  const isSelected = (range: [number, number]) => {
    return selectedRange[0] === range[0] && selectedRange[1] === range[1];
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("visual.priceRange")}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {priceRanges.map(({ key, range, icon }) => (
          <button
            key={key}
            onClick={() => onRangeChange(range)}
            className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
              isSelected(range)
                ? "border-green-500 bg-green-500/10 shadow-md text-green-700 dark:text-green-400"
                : "border-border bg-card hover:border-green-500/50 text-muted-foreground"
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              <span className="text-xl">{icon}</span>
              <span className="text-xs font-medium text-center">
                {t(`priceRanges.${key}`)}
              </span>
            </div>
            {isSelected(range) && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

