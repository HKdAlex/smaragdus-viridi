"use client";

import { cn } from "@/lib/utils";
import { FlexibleSelect } from "@/shared/components/ui/flexible-select";
import {
    BASIC_COLOR_PICKER_VISUAL,
    BASIC_GEM_COLORS,
    DIAMOND_COLOR_GRADES,
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
    <div className="space-y-2">
      <FlexibleSelect
        value={colorCustom || translateColor(color)}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        error={error}
      />

      {isDiamond ? (
        <div className="flex flex-wrap gap-0.5">
          {DIAMOND_COLOR_GRADES.map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => selectColor(grade)}
              className={cn(
                "flex h-4 min-w-[1rem] items-center justify-center rounded border px-1 text-[10px] font-semibold leading-none transition-colors",
                isSelected(grade)
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-muted/40 text-foreground hover:border-primary/50"
              )}
              title={translateColor(grade)}
              aria-label={translateColor(grade)}
              aria-pressed={isSelected(grade)}
            >
              {grade}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {BASIC_GEM_COLORS.map((code) => {
            const { gradient } = BASIC_COLOR_PICKER_VISUAL[code];
            const label = translateColor(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => selectColor(code)}
                className={cn(
                  "relative rounded-full p-px transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  isSelected(code)
                    ? "ring-2 ring-primary ring-offset-1"
                    : "ring-1 ring-border hover:ring-primary/40"
                )}
                title={label}
                aria-label={label}
                aria-pressed={isSelected(code)}
              >
                <div
                  className={cn(
                    "h-[18px] w-[18px] rounded-full border border-black/10 bg-gradient-to-br shadow-inner dark:border-white/10",
                    gradient
                  )}
                />
                {isSelected(code) ? (
                  <span className="absolute -right-px -top-px flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary text-[8px] leading-none text-primary-foreground">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {customHint ? (
        <p className="text-xs text-muted-foreground">{customHint}</p>
      ) : null}
    </div>
  );
}
