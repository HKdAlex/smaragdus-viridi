"use client";

import { useTranslations } from "next-intl";

interface ClaritySelectorProps {
  selectedClarities: string[];
  onClarityChange: (clarities: string[]) => void;
}

export function ClaritySelector({
  selectedClarities,
  onClarityChange,
}: ClaritySelectorProps) {
  const t = useTranslations("filters");

  const clarityGrades = [
    { value: "FL", quality: "excellent" },
    { value: "IF", quality: "excellent" },
    { value: "VVS1", quality: "excellent" },
    { value: "VVS2", quality: "very-good" },
    { value: "VS1", quality: "very-good" },
    { value: "VS2", quality: "good" },
    { value: "SI1", quality: "good" },
    { value: "SI2", quality: "fair" },
    { value: "I1", quality: "fair" },
  ];

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "from-emerald-400 to-emerald-600";
      case "very-good":
        return "from-blue-400 to-blue-600";
      case "good":
        return "from-yellow-400 to-yellow-600";
      case "fair":
        return "from-orange-400 to-orange-600";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const toggleClarity = (clarity: string) => {
    if (selectedClarities.includes(clarity)) {
      onClarityChange(selectedClarities.filter((c) => c !== clarity));
    } else {
      onClarityChange([...selectedClarities, clarity]);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("visual.clarityGrade")}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {clarityGrades.map(({ value, quality }) => (
          <button
            key={value}
            onClick={() => toggleClarity(value)}
            className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 group ${
              selectedClarities.includes(value)
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border bg-card hover:border-primary/50"
            }`}
            title={t(`clarityDescriptions.${value}`)}
          >
            <div className="flex flex-col items-center space-y-2">
              <div
                className={`w-8 h-2 rounded-full bg-gradient-to-r ${getQualityColor(
                  quality
                )}`}
              />
              <span
                className={`text-sm font-bold ${
                  selectedClarities.includes(value)
                    ? "text-primary"
                    : "text-foreground"
                }`}
              >
                {value}
              </span>
            </div>
            {selectedClarities.includes(value) && (
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

