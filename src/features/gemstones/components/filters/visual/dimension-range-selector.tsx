"use client";

import { useTranslations } from "next-intl";

import { RangeSlider } from "../range-slider";
import type { DimensionRange } from "../../../types/filter.types";

interface DimensionRangeSelectorProps {
  value?: DimensionRange;
  onChange: (value?: DimensionRange) => void;
  minLength: number;
  maxLength: number;
  minWidth: number;
  maxWidth: number;
  disabled?: boolean;
}

export function DimensionRangeSelector({
  value,
  onChange,
  minLength,
  maxLength,
  minWidth,
  maxWidth,
  disabled = false,
}: DimensionRangeSelectorProps) {
  const t = useTranslations("filters.advanced");

  const lengthValue: [number, number] = [
    value?.minLength ?? minLength,
    value?.maxLength ?? maxLength,
  ];

  const widthValue: [number, number] = [
    value?.minWidth ?? minWidth,
    value?.maxWidth ?? maxWidth,
  ];

  const handleChange = (
    nextLength: [number, number],
    nextWidth: [number, number]
  ) => {
    const isDefaultLength =
      nextLength[0] === minLength && nextLength[1] === maxLength;
    const isDefaultWidth =
      nextWidth[0] === minWidth && nextWidth[1] === maxWidth;

    if (isDefaultLength && isDefaultWidth) {
      onChange(undefined);
      return;
    }

    onChange({
      minLength: nextLength[0],
      maxLength: nextLength[1],
      minWidth: nextWidth[0],
      maxWidth: nextWidth[1],
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">
        {t("dimensionRange")}
      </h3>
      <RangeSlider
        label={t("length")}
        min={minLength}
        max={maxLength}
        value={lengthValue}
        onChange={(range) => handleChange(range, widthValue)}
        step={0.5}
        formatValue={(val) => `${val} mm`}
        disabled={disabled}
      />
      <RangeSlider
        label={t("width")}
        min={minWidth}
        max={maxWidth}
        value={widthValue}
        onChange={(range) => handleChange(lengthValue, range)}
        step={0.5}
        formatValue={(val) => `${val} mm`}
        disabled={disabled}
      />
    </div>
  );
}
