// Custom hook for translated filter labels
// Replaces hardcoded label constants with dynamic translations

import type {
  GemClarity,
  GemColor,
  GemCut,
  GemstoneType,
} from "@/shared/types";

import { useTranslations } from "next-intl";

export interface FilterLabels {
  gemstoneTypes: Record<GemstoneType, string>;
  colors: Record<GemColor, string>;
  cuts: Record<GemCut, string>;
  clarity: Record<GemClarity, string>;
  sort: Record<string, string>;
}

export function useFilterLabels(): FilterLabels {
  const t = useTranslations("filters.advanced");

  return {
    gemstoneTypes: {
      diamond: t("gemstoneTypes.diamond"),
      emerald: t("gemstoneTypes.emerald"),
      ruby: t("gemstoneTypes.ruby"),
      sapphire: t("gemstoneTypes.sapphire"),
      amethyst: t("gemstoneTypes.amethyst"),
      topaz: t("gemstoneTypes.topaz"),
      garnet: t("gemstoneTypes.garnet"),
      peridot: t("gemstoneTypes.peridot"),
      citrine: t("gemstoneTypes.citrine"),
      tanzanite: t("gemstoneTypes.tanzanite"),
      aquamarine: t("gemstoneTypes.aquamarine"),
      morganite: t("gemstoneTypes.morganite"),
      tourmaline: t("gemstoneTypes.tourmaline"),
      zircon: t("gemstoneTypes.zircon"),
      apatite: t("gemstoneTypes.apatite"),
      quartz: t("gemstoneTypes.quartz"),
      paraiba: t("gemstoneTypes.paraiba"),
      spinel: t("gemstoneTypes.spinel"),
      alexandrite: t("gemstoneTypes.alexandrite"),
      agate: t("gemstoneTypes.agate"),
    },
    colors: {
      // Diamond colors
      D: t("colors.D"),
      E: t("colors.E"),
      F: t("colors.F"),
      G: t("colors.G"),
      H: t("colors.H"),
      I: t("colors.I"),
      J: t("colors.J"),
      K: t("colors.K"),
      L: t("colors.L"),
      M: t("colors.M"),
      // Basic colors
      red: t("colors.red"),
      blue: t("colors.blue"),
      green: t("colors.green"),
      yellow: t("colors.yellow"),
      pink: t("colors.pink"),
      white: t("colors.white"),
      black: t("colors.black"),
      colorless: t("colors.colorless"),
      // Fancy colors
      "fancy-yellow": t("colors.fancy-yellow"),
      "fancy-blue": t("colors.fancy-blue"),
      "fancy-pink": t("colors.fancy-pink"),
      "fancy-green": t("colors.fancy-green"),
    },
    cuts: {
      round: t("cuts.round"),
      oval: t("cuts.oval"),
      marquise: t("cuts.marquise"),
      pear: t("cuts.pear"),
      emerald: t("cuts.emerald"),
      princess: t("cuts.princess"),
      cushion: t("cuts.cushion"),
      radiant: t("cuts.radiant"),
      fantasy: t("cuts.fantasy"),
      baguette: t("cuts.baguette"),
      asscher: t("cuts.asscher"),
      rhombus: t("cuts.rhombus"),
      trapezoid: t("cuts.trapezoid"),
      triangle: t("cuts.triangle"),
      heart: t("cuts.heart"),
      cabochon: t("cuts.cabochon"),
      pentagon: t("cuts.pentagon"),
      hexagon: t("cuts.hexagon"),
    },
    clarity: {
      FL: t("clarity.FL"),
      IF: t("clarity.IF"),
      VVS1: t("clarity.VVS1"),
      VVS2: t("clarity.VVS2"),
      VS1: t("clarity.VS1"),
      VS2: t("clarity.VS2"),
      SI1: t("clarity.SI1"),
      SI2: t("clarity.SI2"),
      I1: t("clarity.I1"),
    },
    sort: {
      created_at: t("sort.created_at"),
      price_amount: t("sort.price_amount"),
      weight_carats: t("sort.weight_carats"),
      name: t("sort.name"),
      color: t("sort.color"),
      cut: t("sort.cut"),
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
