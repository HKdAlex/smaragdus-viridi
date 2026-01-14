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
    try {
      return t(`cuts.${cut}` as any) || cut;
    } catch {
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
