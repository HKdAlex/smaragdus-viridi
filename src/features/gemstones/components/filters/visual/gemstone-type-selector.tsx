"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import type { GemstoneType } from "@/shared/types";

interface GemstoneTypeSelectorProps {
  selectedTypes: string[];
  onTypeChange: (types: string[]) => void;
  options?: { value: string; label: string; count: number }[];
}

/**
 * Thumbnail URL for each enum value. Files live under `public/gem-types/*.webp`
 * (lossy WebP derived from OpenAI `source-png`; regenerate via
 * `npm run generate-gem-type-thumbnails:openai -- --all --webp`).
 */
function gemstoneTypeThumbnailSrc(value: GemstoneType): string {
  return `/gem-types/${value}.webp`;
}

/** Canonical order matches `public/gem-types/*.webp` basenames (lowercase). */
const VISUAL_GEMSTONE_TYPE_ORDER = [
  "agate",
  "alexandrite",
  "amethyst",
  "apatite",
  "aquamarine",
  "citrine",
  "diamond",
  "emerald",
  "garnet",
  "morganite",
  "paraiba",
  "peridot",
  "quartz",
  "ruby",
  "sapphire",
  "spinel",
  "tanzanite",
  "topaz",
  "tourmaline",
  "zircon",
] as const satisfies readonly GemstoneType[];

const defaultGemstoneTypes: { value: GemstoneType }[] =
  VISUAL_GEMSTONE_TYPE_ORDER.map((value) => ({ value }));

/**
 * Visual Gemstone Type Selector
 *
 * Displays gemstone types as visual cards with thumbnails.
 * Part of FILTER-C0.2: Add missing filters to Visual mode.
 */
export function GemstoneTypeSelector({
  selectedTypes,
  onTypeChange,
  options,
}: GemstoneTypeSelectorProps) {
  const t = useTranslations("filters");

  const displayTypes = options
    ? defaultGemstoneTypes.filter((gt) =>
        options.some((opt) => opt.value === gt.value)
      )
    : defaultGemstoneTypes;

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypeChange([...selectedTypes, type]);
    }
  };

  const getCount = (value: string) => {
    if (!options) return null;
    const option = options.find((opt) => opt.value === value);
    return option?.count;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("visual.gemstoneType")}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {displayTypes.map(({ value }) => {
          const count = getCount(value);
          const isDisabled = count === 0;
          const isSelected = selectedTypes.includes(value);

          return (
            <button
              key={value}
              type="button"
              onClick={() => !isDisabled && toggleType(value)}
              disabled={isDisabled}
              className={`relative px-2 pt-3 pb-2 rounded-xl border-2 transition-all duration-200 ${
                isDisabled
                  ? "opacity-40 cursor-not-allowed border-border bg-muted"
                  : isSelected
                    ? "border-primary bg-primary/10 shadow-md hover:scale-105"
                    : "border-border bg-card hover:border-primary/50 hover:scale-105"
              }`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="relative mx-auto flex h-[5rem] w-full max-w-[5.5rem] items-center justify-center"
                  aria-hidden
                >
                  <Image
                    src={gemstoneTypeThumbnailSrc(value)}
                    alt=""
                    width={160}
                    height={160}
                    className="h-full w-full object-contain object-center"
                    sizes="(max-width: 640px) 32vw, 96px"
                  />
                </div>
                <span
                  className={`text-xs font-medium truncate w-full text-center ${
                    isSelected ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {t(`advanced.gemstoneTypes.${value}`)}
                </span>
                {typeof count === "number" && count > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    ({count})
                  </span>
                )}
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
