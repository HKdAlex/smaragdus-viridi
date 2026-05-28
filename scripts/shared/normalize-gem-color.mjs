/** Mirror of src/shared/config/basic-gem-colors.ts for import/AI scripts. */

const BASIC = new Set([
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
]);

const LEGACY = {
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
};

const DIAMOND = new Set(["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"]);

export function normalizeGemColor(color) {
  if (!color) return "";
  const key = String(color).trim().toLowerCase();
  if (BASIC.has(key)) return key;
  if (LEGACY[key]) return LEGACY[key];
  const upper = key.toUpperCase();
  if (DIAMOND.has(upper)) return upper;
  return key;
}

export function sanitizeColorForWrite(color, gemstoneType) {
  if (gemstoneType === "diamond" && DIAMOND.has(String(color).toUpperCase())) {
    return String(color).toUpperCase();
  }
  return normalizeGemColor(color);
}
