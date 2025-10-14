"use client";

import { useTranslations } from "next-intl";

interface WeightRangeCardsProps {
  selectedRange: [number, number];
  onRangeChange: (range: [number, number]) => void;
}

export function WeightRangeCards({
  selectedRange,
  onRangeChange,
}: WeightRangeCardsProps) {
  const t = useTranslations("filters");

  const weightRanges = [
    { key: "under1", range: [0, 1] as [number, number], size: "text-xs" },
    { key: "1to2", range: [1, 2] as [number, number], size: "text-sm" },
    { key: "2to3", range: [2, 3] as [number, number], size: "text-base" },
    { key: "3to5", range: [3, 5] as [number, number], size: "text-lg" },
    { key: "5to10", range: [5, 10] as [number, number], size: "text-xl" },
    {
      key: "over10",
      range: [10, 50] as [number, number],
      size: "text-2xl",
    },
  ];

  const isSelected = (range: [number, number]) => {
    return selectedRange[0] === range[0] && selectedRange[1] === range[1];
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("visual.caratWeight")}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {weightRanges.map(({ key, range, size }) => (
          <button
            key={key}
            onClick={() => onRangeChange(range)}
            className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
              isSelected(range)
                ? "border-purple-500 bg-purple-500/10 shadow-md text-purple-700 dark:text-purple-400"
                : "border-border bg-card hover:border-purple-500/50 text-muted-foreground"
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              <span
                className={`${size} ${
                  isSelected(range)
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-muted-foreground"
                }`}
              >
                ◆
              </span>
              <span className="text-xs font-medium text-center">
                {t(`weightRanges.${key}`)}
              </span>
            </div>
            {isSelected(range) && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

