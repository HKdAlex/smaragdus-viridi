import { useTranslations } from "next-intl";

/**
 * Hook to get translated gemstone property values
 */
export function useGemstoneTranslations() {
  const tTypes = useTranslations("gemstones.types");
  const tColors = useTranslations("gemstones.colors");
  const tCuts = useTranslations("gemstones.cuts");
  const tClarities = useTranslations("gemstones.clarities");
  const tOrigins = useTranslations("gemstones.origins");
  const tLabels = useTranslations("gemstones.labels");

  const translateGemstoneType = (type: string) => {
    return tTypes(type as any) || type;
  };

  const translateColor = (color: string) => {
    return tColors(color as any) || color;
  };

  const translateCut = (cut: string) => {
    return tCuts(cut as any) || cut;
  };

  const translateClarity = (clarity: string) => {
    return tClarities(clarity as any) || clarity;
  };

  const translateOrigin = (origin: string) => {
    return tOrigins(origin as any) || origin;
  };

  const translateCutLabel = () => {
    return tLabels("cut");
  };

  const translateClarityLabel = () => {
    return tLabels("clarity");
  };

  return {
    translateGemstoneType,
    translateColor,
    translateCut,
    translateClarity,
    translateOrigin,
    translateCutLabel,
    translateClarityLabel,
  };
}
