import { useTranslations } from "next-intl";

/**
 * Hook to get translated gemstone property values
 *
 * Uses the "gemstones" namespace and accesses nested keys.
 * Fixed: Previously used incorrect nested namespace paths like "gemstones.types"
 * which caused untranslated key paths to be displayed.
 */
export function useGemstoneTranslations() {
  const t = useTranslations("gemstones");

  const translateGemstoneType = (type: string) => {
    if (!type) return type;

    // If the type is already capitalized (e.g., "Emerald" from search_gemstones_multilingual),
    // it's already been translated by the database - use it directly
    if (type[0] === type[0].toUpperCase() && type[0] !== type[0].toLowerCase()) {
      return type;
    }

    // Otherwise, translate the raw enum value (e.g., "emerald")
    try {
      return t(`types.${type}` as any) || type;
    } catch {
      return type;
    }
  };

  const translateGemstoneTypePlural = (type: string) => {
    try {
      return t(`typesPlural.${type}` as any) || type;
    } catch {
      return type;
    }
  };

  const translateColor = (color: string) => {
    if (!color) return color;

    // If the color is already capitalized (e.g., "Green" from search_gemstones_multilingual),
    // it's already been translated by the database - use it directly
    // Exception: single-letter diamond grades (D, E, F, etc.) should be kept as-is
    if (
      color.length > 1 &&
      color[0] === color[0].toUpperCase() &&
      color[0] !== color[0].toLowerCase()
    ) {
      return color;
    }

    // Otherwise, translate the raw enum value (e.g., "green")
    try {
      return t(`colors.${color}` as any) || color;
    } catch {
      return color;
    }
  };

  const translateCut = (cut: string) => {
    if (!cut) return cut;

    // If the cut contains Cyrillic characters, it's already translated (from database)
    // Database functions like search_gemstones_multilingual return translated names
    const hasCyrillic = /[А-Яа-яЁё]/.test(cut);
    if (hasCyrillic) {
      return cut;
    }

    // If the cut contains spaces, it's likely a translated name (e.g., "Round Brilliant")
    // Cut codes don't have spaces (e.g., "round", "oval")
    if (cut.includes(" ")) {
      return cut;
    }

    // If the cut contains non-ASCII characters (other languages), it's likely already translated
    const hasNonASCII = /[^\x00-\x7F]/.test(cut);
    if (hasNonASCII && cut.length > 5) {
      return cut;
    }

    // Cut codes are typically lowercase and short (round, oval, etc.)
    // If it's capitalized and longer than 8 chars, it might be a translated name
    if (cut.length > 8 && cut[0] === cut[0].toUpperCase() && cut[0] !== cut[0].toLowerCase()) {
      return cut;
    }

    // Otherwise, translate the cut code (e.g., "round", "oval")
    // Use a safe translation that won't throw if key doesn't exist
    try {
      const translation = t(`cuts.${cut}` as any);
      // If translation returns the same value (key not found), return as-is
      if (translation === `cuts.${cut}`) {
        return cut;
      }
      return translation || cut;
    } catch (error: any) {
      // Handle MissingMessageError or other translation errors
      if (error?.code === "MISSING_MESSAGE" || error?.message?.includes("MISSING_MESSAGE")) {
        return cut;
      }
      return cut;
    }
  };

  const translateClarity = (clarity: string) => {
    try {
      return t(`clarities.${clarity}` as any) || clarity;
    } catch {
      return clarity;
    }
  };

  const translateOrigin = (origin: string) => {
    try {
      return t(`origins.${origin}` as any) || origin;
    } catch {
      return origin;
    }
  };

  const translateCutLabel = () => {
    return t("labels.cut");
  };

  const translateClarityLabel = () => {
    return t("labels.clarity");
  };

  return {
    translateGemstoneType,
    translateGemstoneTypePlural,
    translateColor,
    translateCut,
    translateClarity,
    translateOrigin,
    translateCutLabel,
    translateClarityLabel,
  };
}
