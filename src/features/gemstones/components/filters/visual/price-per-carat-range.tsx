"use client";

import type { PriceRange } from "../../../types/filter.types";
import { RangeSlider } from "../range-slider";
import { useTranslations } from "next-intl";

interface PricePerCaratRangeProps {
  value?: PriceRange;
  onChange: (value?: PriceRange) => void;
  min: number;
  max: number;
  disabled?: boolean;
}

export function PricePerCaratRange({
  value,
  onChange,
  min,
  max,
  disabled = false,
}: PricePerCaratRangeProps) {
  const t = useTranslations("filters.advanced");

  const currentValue: [number, number] = [
    value?.min ?? min,
    value?.max ?? max,
  ];

  const handleChange = (nextRange: [number, number]) => {
    if (nextRange[0] === min && nextRange[1] === max) {
      onChange(undefined);
      return;
    }

    onChange({
      min: nextRange[0],
      max: nextRange[1],
      currency: "USD",
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        {t("pricePerCaratRange")}
      </h3>
      <RangeSlider
        label={t("pricePerCaratRange")}
        min={min}
        max={max}
        value={currentValue}
        onChange={handleChange}
        step={1000}
        formatValue={(value) =>
          `${new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            useGrouping: false,
          }).format(value / 100)} / ct`
        }
        disabled={disabled}
      />
    </div>
  );
}
