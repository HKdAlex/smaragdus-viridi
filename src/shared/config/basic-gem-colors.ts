import type { GemColor } from "@/shared/services/database-enums";
import { Constants } from "@/shared/types/database";

export type GemColorCategory = "diamond" | "colored";

const GEM_COLOR_ENUM_LOWER = new Set(
  Constants.public.Enums.gem_color.map((c) => c.toLowerCase())
);

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

/** Swatches for catalog/admin visual color pickers. */
export const BASIC_COLOR_PICKER_VISUAL: Record<
  BasicGemColor,
  { hex: string; gradient: string }
> = {
  colorless: { hex: "#F8F8FF", gradient: "from-gray-50 to-gray-200" },
  white: { hex: "#FFFFFF", gradient: "from-gray-100 to-gray-300" },
  black: { hex: "#2F2F2F", gradient: "from-gray-700 to-gray-900" },
  gray: { hex: "#9CA3AF", gradient: "from-gray-400 to-gray-600" },
  brown: { hex: "#92400E", gradient: "from-amber-700 to-amber-900" },
  yellow: { hex: "#FFD700", gradient: "from-yellow-300 to-yellow-500" },
  orange: { hex: "#F97316", gradient: "from-orange-400 to-orange-600" },
  red: { hex: "#DC143C", gradient: "from-red-400 to-red-600" },
  pink: { hex: "#FF69B4", gradient: "from-pink-400 to-pink-600" },
  violet: { hex: "#8B5CF6", gradient: "from-violet-400 to-violet-600" },
  blue: { hex: "#4169E1", gradient: "from-blue-400 to-blue-600" },
  green: { hex: "#32CD32", gradient: "from-green-400 to-green-600" },
};

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

/** Neutral swatches for D–M diamond grade picker tiles. */
export const DIAMOND_COLOR_PICKER_VISUAL: Record<
  DiamondColorGrade,
  { hex: string }
> = {
  D: { hex: "#FFFFFF" },
  E: { hex: "#FEFEFE" },
  F: { hex: "#FDFDFD" },
  G: { hex: "#FBFBFB" },
  H: { hex: "#F9F9F9" },
  I: { hex: "#F7F7F7" },
  J: { hex: "#F5F5F5" },
  K: { hex: "#F0F0F0" },
  L: { hex: "#EBEBEB" },
  M: { hex: "#E5E5E5" },
};

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

/** Whether a token is a stored `gem_color` enum value (case-insensitive for D–M). */
export function isStoredGemColorToken(token: string): boolean {
  const trimmed = token.trim();
  if (!trimmed) return false;
  return (
    GEM_COLOR_ENUM_LOWER.has(trimmed.toLowerCase()) ||
    GEM_COLOR_ENUM_LOWER.has(trimmed.toUpperCase())
  );
}

/** Diamond vs colored gemstone bucket for filter UI (no separate fancy group). */
export function categorizeGemColor(color: string): GemColorCategory {
  const normalized = normalizeGemColor(color);
  if (isDiamondColorGrade(normalized)) return "diamond";
  return "colored";
}

/**
 * Parse comma-separated color filter params; canonicalize to 12 basics or D–M.
 * Legacy `fancy-*` tokens normalize to basics (deduped with explicit basic).
 */
export function parseColorFilterTokens(csv: string): string[] {
  if (!csv.trim()) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of csv.split(",")) {
    const token = raw.trim();
    if (!token || !isStoredGemColorToken(token)) continue;

    const canonical = normalizeGemColor(token);
    if (!canonical || seen.has(canonical)) continue;

    seen.add(canonical);
    result.push(canonical);
  }

  return result;
}

const LEGACY_FANCY_HEX: Record<string, number> = {
  "fancy-yellow": 0xffd700,
  "fancy-blue": 0x4169e1,
  "fancy-pink": 0xff69b4,
  "fancy-green": 0x32cd32,
};

/** Three.js material color from enum / legacy stored value. */
export function hexFromGemColor(color: string): number {
  const normalized = normalizeGemColor(color);
  const lower = color.trim().toLowerCase();

  if (LEGACY_FANCY_HEX[lower]) return LEGACY_FANCY_HEX[lower];

  if (isDiamondColorGrade(normalized)) {
    const hex =
      DIAMOND_COLOR_PICKER_VISUAL[normalized as DiamondColorGrade]?.hex;
    return hex ? Number.parseInt(hex.slice(1), 16) : 0xffffff;
  }

  if (isBasicGemColor(normalized)) {
    const hex = BASIC_COLOR_PICKER_VISUAL[normalized].hex;
    return Number.parseInt(hex.slice(1), 16);
  }

  return 0xffffff;
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
