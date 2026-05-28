import type { GemColor } from "@/shared/services/database-enums";

/** Twelve basic hues for colored gemstones (admin picker + catalog filters). */
export const BASIC_GEM_COLORS = [
  "colorless",
  "white",
  "black",
  "gray",
  "brown",
  "yellow",
  "orange",
  "red",
  "pink",
  "violet",
  "blue",
  "green",
] as const;

export type BasicGemColor = (typeof BASIC_GEM_COLORS)[number];

/** GIA diamond letter grades — separate from basic hues. */
export const DIAMOND_COLOR_GRADES = [
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
] as const;

export type DiamondColorGrade = (typeof DIAMOND_COLOR_GRADES)[number];

const LEGACY_TO_BASIC: Record<string, BasicGemColor> = {
  "fancy-yellow": "yellow",
  "fancy-blue": "blue",
  "fancy-pink": "pink",
  "fancy-green": "green",
  "fancy-red": "red",
  "fancy-purple": "violet",
  "fancy-orange": "orange",
  "fancy-brown": "brown",
  "fancy-gray": "gray",
  "fancy-black": "black",
  amber: "yellow",
  coral: "pink",
  peach: "pink",
  mint: "green",
  teal: "green",
  smoky: "gray",
  purple: "violet",
};

const BASIC_SET = new Set<string>(BASIC_GEM_COLORS);

/**
 * Map any stored gem_color (including legacy fancy-*) to a basic hue for
 * display grouping and catalog filter matching. Diamond grades pass through.
 */
export function normalizeGemColor(color: string | null | undefined): string {
  if (!color) return "";
  const key = color.trim().toLowerCase();
  if (BASIC_SET.has(key)) return key;
  if (LEGACY_TO_BASIC[key]) return LEGACY_TO_BASIC[key];
  const upper = key.toUpperCase();
  if (DIAMOND_COLOR_GRADES.includes(upper as DiamondColorGrade)) return upper;
  return key;
}

/** Filter values to pass to DB/API so legacy rows match a basic color filter. */
export function expandColorFilterValues(basicColor: string): string[] {
  const normalized = normalizeGemColor(basicColor);
  const expanded = new Set<string>([normalized, basicColor]);
  for (const [legacy, basic] of Object.entries(LEGACY_TO_BASIC)) {
    if (basic === normalized) expanded.add(legacy);
  }
  return [...expanded];
}

export function isDiamondColorGrade(color: string): boolean {
  return DIAMOND_COLOR_GRADES.includes(
    color.toUpperCase() as DiamondColorGrade
  );
}

export function isBasicGemColor(color: string): color is BasicGemColor {
  return BASIC_SET.has(color);
}

/** Colors allowed when saving from admin/import/AI (no new fancy-* writes). */
export function sanitizeColorForWrite(
  color: string,
  gemstoneType: string
): GemColor | string {
  if (gemstoneType === "diamond" && isDiamondColorGrade(color)) {
    return color.toUpperCase() as GemColor;
  }
  const normalized = normalizeGemColor(color);
  if (isBasicGemColor(normalized)) return normalized as GemColor;
  return normalized;
}
