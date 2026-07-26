import { normalizeGemColor } from "@/shared/config/basic-gem-colors";
import { useLocale } from "next-intl";
import { useCallback } from "react";

import {
  resolveGemstoneTypeLabelSource,
  type GemstoneTypeDisplayInput,
} from "../utils/gemstone-type-display";
import { useGemstoneTranslations } from "../utils/gemstone-translations";

/** Storefront + admin shared label pipeline (resolve custom/locale names, then translate enums). */
export function useGemstoneDisplayLabels() {
  const locale = useLocale();
  const {
    translateIfEnumCode,
    translateGemstoneType,
    translateColor,
    translateCut,
    translateClarity,
  } = useGemstoneTranslations();

  const getTypeLabel = useCallback(
    (gemstone: GemstoneTypeDisplayInput) => {
      const raw = resolveGemstoneTypeLabelSource(locale, gemstone);
      return translateIfEnumCode(raw, translateGemstoneType);
    },
    [locale, translateIfEnumCode, translateGemstoneType]
  );

  const getColorLabel = useCallback(
    (color: string | null | undefined) => {
      if (!color) return "";
      const key = normalizeGemColor(color) || color;
      return translateIfEnumCode(key, translateColor);
    },
    [translateIfEnumCode, translateColor]
  );

  const getCutLabel = useCallback(
    (cut: string | null | undefined) => {
      if (!cut) return "";
      const translated = translateIfEnumCode(cut, translateCut);
      return translated !== cut ? translated : cut.replace(/_/g, " ");
    },
    [translateIfEnumCode, translateCut]
  );

  const getClarityLabel = useCallback(
    (clarity: string | null | undefined) => {
      if (!clarity) return "";
      return translateIfEnumCode(clarity, translateClarity);
    },
    [translateIfEnumCode, translateClarity]
  );

  return {
    getTypeLabel,
    getColorLabel,
    getCutLabel,
    getClarityLabel,
  };
}
