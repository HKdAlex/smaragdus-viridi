/**
 * Resolve raw type label for storefront (before translateIfEnumCode).
 * Prefers locale-specific custom names, then legacy name_custom, then enum/type_code.
 */

export type GemstoneTypeDisplayInput = {
  name: string;
  type_code?: string | null;
  display_name?: string | null;
  name_custom?: string | null;
  name_custom_en?: string | null;
  name_custom_ru?: string | null;
};

export function resolveGemstoneTypeLabelSource(
  locale: string,
  gemstone: GemstoneTypeDisplayInput
): string {
  const isRu = locale.toLowerCase().startsWith("ru");
  const primary = (
    isRu
      ? gemstone.name_custom_ru ?? gemstone.name_custom
      : gemstone.name_custom_en ?? gemstone.name_custom
  )?.trim();
  if (primary) return primary;

  const legacy = gemstone.name_custom?.trim();
  if (legacy) return legacy;

  const code = gemstone.type_code?.trim();
  if (code) return code;

  const display = gemstone.display_name?.trim();
  if (display) return display;

  return gemstone.name ?? "";
}
