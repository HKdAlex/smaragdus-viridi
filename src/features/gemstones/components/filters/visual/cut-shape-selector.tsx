"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

/**
 * `public/images/cut-shapes/<id>.webp`. After regenerating source PNGs, run
 * `npm run normalize-cut-shape-icons` so stroke, fill, and framing match the set.
 * Image slot matches gemstone-type tiles: `h-[5rem]` and `max-w-[5.5rem]`.
 */
function cutShapeIconSrc(value: string): string {
  return `/images/cut-shapes/${value}.webp`;
}

interface CutShapeSelectorProps {
  selectedCuts: string[];
  onCutChange: (cuts: string[]) => void;
}

const ALL_CUT_SHAPE_VALUES = [
  "round",
  "oval",
  "marquise",
  "pear",
  "heart",
  "emerald",
  "princess",
  "cushion",
  "radiant",
  "asscher",
  "baguette",
  "triangle",
  "trapezoid",
  "rhombus",
  "pentagon",
  "hexagon",
  "cabochon",
  "fantasy",
  "code",
] as const;

export function CutShapeSelector({
  selectedCuts,
  onCutChange,
}: CutShapeSelectorProps) {
  const t = useTranslations("filters");
  const [search, setSearch] = useState("");

  const toggleCut = (cut: string) => {
    if (selectedCuts.includes(cut)) {
      onCutChange(selectedCuts.filter((c) => c !== cut));
    } else {
      onCutChange([...selectedCuts, cut]);
    }
  };

  const normalizedSearch = search.trim().toLowerCase();
  const visibleShapes = normalizedSearch
    ? ALL_CUT_SHAPE_VALUES.filter(
        (value) =>
          value.includes(normalizedSearch) ||
          t(`advanced.cuts.${value}`).toLowerCase().includes(normalizedSearch)
      )
    : [...ALL_CUT_SHAPE_VALUES];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("visual.cutShape")}
      </h3>

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("visual.cutSearchPlaceholder")}
          className="w-full px-3 py-1.5 text-sm bg-muted/50 border border-border/60 rounded-lg focus:outline-none focus:border-primary/50 focus:ring-0 placeholder:text-muted-foreground/60"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {visibleShapes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          {t("visual.cutNoResults")}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {visibleShapes.map((value) => {
            const isSelected = selectedCuts.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleCut(value)}
                className={`relative px-2 pt-3 pb-2 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-1.5 text-center">
                  <div
                    className="relative mx-auto flex h-[5rem] w-full max-w-[5.5rem] items-center justify-center"
                    aria-hidden
                  >
                    <Image
                      src={cutShapeIconSrc(value)}
                      alt=""
                      width={160}
                      height={160}
                      className="h-full w-full object-contain object-center opacity-90 dark:opacity-[0.92]"
                      sizes="(max-width: 640px) 32vw, 96px"
                    />
                  </div>
                  <span
                    className={`text-xs font-semibold leading-snug line-clamp-4 ${
                      isSelected ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {t(`advanced.cuts.${value}`)}
                  </span>
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
      )}
    </div>
  );
}

