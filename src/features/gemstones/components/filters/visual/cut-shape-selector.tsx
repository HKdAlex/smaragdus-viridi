"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface CutShapeSelectorProps {
  selectedCuts: string[];
  onCutChange: (cuts: string[]) => void;
}

const ALL_CUT_SHAPES = [
  { value: "round",     icon: "●" },
  { value: "oval",      icon: "○" },
  { value: "marquise",  icon: "◊" },
  { value: "pear",      icon: "♦" },
  { value: "heart",     icon: "♥" },
  { value: "emerald",   icon: "▭" },
  { value: "princess",  icon: "■" },
  { value: "cushion",   icon: "▢" },
  { value: "radiant",   icon: "▦" },
  { value: "asscher",   icon: "◈" },
  { value: "baguette",  icon: "▬" },
  { value: "triangle",  icon: "▲" },
  { value: "trapezoid", icon: "⏢" },
  { value: "rhombus",   icon: "◆" },
  { value: "pentagon",  icon: "⬠" },
  { value: "hexagon",   icon: "⬡" },
  { value: "cabochon",  icon: "⬬" },
  { value: "fantasy",   icon: "✦" },
];

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
    ? ALL_CUT_SHAPES.filter(({ value }) =>
        value.includes(normalizedSearch) ||
        t(`advanced.cuts.${value}`).toLowerCase().includes(normalizedSearch)
      )
    : ALL_CUT_SHAPES;

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
        <div className="grid grid-cols-3 gap-2">
          {visibleShapes.map(({ value, icon }) => (
            <button
              key={value}
              onClick={() => toggleCut(value)}
              className={`relative p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                selectedCuts.includes(value)
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <span
                  className={`text-2xl ${
                    selectedCuts.includes(value)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {icon}
                </span>
                <span
                  className={`text-xs font-medium ${
                    selectedCuts.includes(value)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {t(`advanced.cuts.${value}`)}
                </span>
              </div>
              {selectedCuts.includes(value) && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

