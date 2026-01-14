"use client";

import { useTranslations } from "next-intl";

import type { QualityClassificationOption } from "../../../hooks/use-quality-classification-options";

interface QualityClassificationSelectorProps {
  selectedValues: string[];
  onChange: (values: string[]) => void;
  options: QualityClassificationOption[];
}

/**
 * Visual Quality Classification Selector
 *
 * Displays quality classifications as selectable chips.
 * Part of FILTER-C1.3: Quality Classification filter.
 */
export function QualityClassificationSelector({
  selectedValues,
  onChange,
  options,
}: QualityClassificationSelectorProps) {
  const t = useTranslations("filters");

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("visual.qualityClassification")}
      </h3>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("dropdown.noOptions")}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map(({ value, label, count }) => {
            const isSelected = selectedValues.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggleValue(value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className="ml-1 text-[10px] text-muted-foreground">
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
