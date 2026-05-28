import { normalizeGemColor } from "@/shared/config/basic-gem-colors";
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

    const key = normalizeGemColor(color);
    if (!key) return color;

    // If display_color is already a localized phrase (not an enum code), keep it
    if (
      key === color &&
      color.length > 1 &&
      color[0] === color[0].toUpperCase() &&
      color[0] !== color[0].toLowerCase() &&
      !color.includes("-")
    ) {
      return color;
    }

    try {
      return t(`colors.${key}` as any) || color;
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

  /**
   * Translates a value only if it's an enum code.
   * Custom values (with spaces, Unicode, proper capitalization) are returned as-is.
   *
   * Contract: DISPLAY-C8.0
   * This helper works with display_* fields from the database which may contain:
   * - Enum codes (e.g., "ruby", "red") - need translation
   * - Custom text (e.g., "Pigeon Blood Ruby", "Кроваво-красный") - already translated
   *
   * @param value - The value to potentially translate (from display_* field)
   * @param translator - The translation function to use for enum codes
   * @returns Translated enum code or original custom value
   */
  const translateIfEnumCode = (
    value: string | null | undefined,
    translator: (code: string) => string
  ): string => {
    if (!value) return '';

    // Detect already-translated custom values:
    const hasSpaces = value.includes(' ');            // "Pigeon Blood Ruby"
    const hasCyrillic = /[А-Яа-яЁё]/.test(value);    // "Кроваво-красный"
    const hasNonASCII = /[^\x00-\x7F]/.test(value);
    const isProperName = value.length > 8 && value[0] === value[0].toUpperCase() && value[0] !== value[0].toLowerCase();

    // If it looks like custom text, return as-is
    if (hasSpaces || hasCyrillic || (hasNonASCII && value.length > 5) || isProperName) {
      return value;
    }

    // Otherwise, it's an enum code - translate it
    return translator(value);
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
    translateIfEnumCode, // NEW: General helper for display_* fields
  };
}
