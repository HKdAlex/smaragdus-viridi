// Custom hook for translated filter labels
// Replaces hardcoded label constants with dynamic translations

import type {
  GemClarity,
  GemColor,
  GemCut,
  GemstoneType,
} from "@/shared/types";

import { Constants } from "@/shared/types/database";
import { useTranslations } from "next-intl";

export interface FilterLabels {
  gemstoneTypes: Record<GemstoneType, string>;
  colors: Record<GemColor, string>;
  cuts: Record<GemCut, string>;
  clarity: Record<GemClarity, string>;
  sort: Record<string, string>;
}

export function useFilterLabels(): FilterLabels {
  const tGemstones = useTranslations("gemstones");
  const tFilters = useTranslations("filters.advanced");

  // Generate gemstone types dynamically from database constants
  const gemstoneTypes = Constants.public.Enums.gemstone_type.reduce(
    (acc, type) => {
      acc[type as GemstoneType] = tGemstones(`types.${type}`);
      return acc;
    },
    {} as Record<GemstoneType, string>
  );

  return {
    gemstoneTypes,
    colors: {
      // Diamond colors
      D: tGemstones("colors.D"),
      E: tGemstones("colors.E"),
      F: tGemstones("colors.F"),
      G: tGemstones("colors.G"),
      H: tGemstones("colors.H"),
      I: tGemstones("colors.I"),
      J: tGemstones("colors.J"),
      K: tGemstones("colors.K"),
      L: tGemstones("colors.L"),
      M: tGemstones("colors.M"),
      // Basic colors
      red: tGemstones("colors.red"),
      blue: tGemstones("colors.blue"),
      green: tGemstones("colors.green"),
      yellow: tGemstones("colors.yellow"),
      pink: tGemstones("colors.pink"),
      white: tGemstones("colors.white"),
      black: tGemstones("colors.black"),
      colorless: tGemstones("colors.colorless"),
      // Fancy colors
      "fancy-yellow": tGemstones("colors.fancy-yellow"),
      "fancy-blue": tGemstones("colors.fancy-blue"),
      "fancy-pink": tGemstones("colors.fancy-pink"),
      "fancy-green": tGemstones("colors.fancy-green"),
    },
    cuts: {
      round: tGemstones("cuts.round"),
      oval: tGemstones("cuts.oval"),
      marquise: tGemstones("cuts.marquise"),
      pear: tGemstones("cuts.pear"),
      emerald: tGemstones("cuts.emerald"),
      princess: tGemstones("cuts.princess"),
      cushion: tGemstones("cuts.cushion"),
      radiant: tGemstones("cuts.radiant"),
      fantasy: tGemstones("cuts.fantasy"),
      baguette: tGemstones("cuts.baguette"),
      asscher: tGemstones("cuts.asscher"),
      rhombus: tGemstones("cuts.rhombus"),
      trapezoid: tGemstones("cuts.trapezoid"),
      triangle: tGemstones("cuts.triangle"),
      heart: tGemstones("cuts.heart"),
      cabochon: tGemstones("cuts.cabochon"),
      pentagon: tGemstones("cuts.pentagon"),
      hexagon: tGemstones("cuts.hexagon"),
    },
    clarity: {
      FL: tGemstones("clarities.FL"),
      IF: tGemstones("clarities.IF"),
      VVS1: tGemstones("clarities.VVS1"),
      VVS2: tGemstones("clarities.VVS2"),
      VS1: tGemstones("clarities.VS1"),
      VS2: tGemstones("clarities.VS2"),
      SI1: tGemstones("clarities.SI1"),
      SI2: tGemstones("clarities.SI2"),
      I1: tGemstones("clarities.I1"),
    },
    sort: {
      created_at: tFilters("sort.created_at"),
      price_amount: tFilters("sort.price_amount"),
      weight_carats: tFilters("sort.weight_carats"),
      name: tFilters("sort.name"),
      color: tFilters("sort.color"),
      cut: tFilters("sort.cut"),
    },
  };
}

// Helper functions for getting individual labels
export function useGemstoneTypeLabel(type: GemstoneType): string {
  const labels = useFilterLabels();
  return labels.gemstoneTypes[type] || type;
}

export function useColorLabel(color: GemColor): string {
  const labels = useFilterLabels();
  return labels.colors[color] || color;
}

export function useCutLabel(cut: GemCut): string {
  const labels = useFilterLabels();
  return labels.cuts[cut] || cut;
}

export function useClarityLabel(clarity: GemClarity): string {
  const labels = useFilterLabels();
  return labels.clarity[clarity] || clarity;
}

export function useSortLabel(sortKey: string): string {
  const labels = useFilterLabels();
  return labels.sort[sortKey] || sortKey;
}
