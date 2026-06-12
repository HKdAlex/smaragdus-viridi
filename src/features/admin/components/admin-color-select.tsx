"use client";

import { cn } from "@/lib/utils";
import { FlexibleSelect } from "@/shared/components/ui/flexible-select";
import {
    BASIC_COLOR_PICKER_VISUAL,
    BASIC_GEM_COLORS,
    DIAMOND_COLOR_GRADES,
    DIAMOND_COLOR_PICKER_VISUAL,
    normalizeGemColor,
} from "@/shared/config/basic-gem-colors";

interface AdminColorSelectProps {
  gemstoneType: string;
  color: string;
  colorCustom?: string | null;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string, isKnownValue: boolean) => void;
  translateColor: (color: string) => string;
  placeholder?: string;
  customHint?: string;
  error?: boolean;
}

export function AdminColorSelect({
  gemstoneType,
  color,
  colorCustom,
  options,
  onChange,
  translateColor,
  placeholder,
  customHint,
  error,
}: AdminColorSelectProps) {
  const isDiamond = gemstoneType === "diamond";
  const selectedCode = colorCustom ? null : normalizeGemColor(color);

  const isSelected = (code: string) =>
    selectedCode !== null &&
    selectedCode.toLowerCase() === code.toLowerCase();

  const selectColor = (code: string) => {
    onChange(code, true);
  };

  return (
    <div className="space-y-3">
      {isDiamond ? (
        <div className="grid grid-cols-6 gap-1 sm:grid-cols-11">
          {DIAMOND_COLOR_GRADES.map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => selectColor(grade)}
              className={cn(
                "rounded-lg border-2 p-1.5 transition-all hover:scale-105",
                isSelected(grade)
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/50"
              )}
              title={translateColor(grade)}
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className="h-6 w-6 rounded-full border border-border shadow-inner"
                  style={{
                    backgroundColor: DIAMOND_COLOR_PICKER_VISUAL[grade].hex,
                  }}
                />
                <span className="text-xs font-bold">{grade}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {BASIC_GEM_COLORS.map((code) => {
            const { gradient } = BASIC_COLOR_PICKER_VISUAL[code];
            return (
              <button
                key={code}
                type="button"
                onClick={() => selectColor(code)}
                className={cn(
                  "rounded-lg border-2 p-2 transition-all hover:scale-105",
                  isSelected(code)
                    ? "border-primary shadow-md"
                    : "border-border hover:border-primary/50"
                )}
                title={translateColor(code)}
              >
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full border border-border bg-gradient-to-br shadow-inner",
                      gradient
                    )}
                  />
                  <span className="text-center text-[10px] font-medium leading-tight text-muted-foreground">
                    {translateColor(code)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <FlexibleSelect
        value={colorCustom || translateColor(color)}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        error={error}
      />

      {customHint ? (
        <p className="text-xs text-muted-foreground">{customHint}</p>
      ) : null}
    </div>
  );
}
