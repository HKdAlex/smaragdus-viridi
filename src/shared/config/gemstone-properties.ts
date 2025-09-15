// Centralized gemstone properties configuration
// This file serves as the single source of truth for gemstone properties
// that are not stored in the database but needed for import scripts and UI

import type { GemColor, GemstoneType } from "@/shared/types";

// Default color mappings for gemstone types
// Used by import scripts and UI components
export const GEMSTONE_DEFAULT_COLORS: Record<GemstoneType, GemColor> = {
  diamond: "D",
  emerald: "green",
  ruby: "red",
  sapphire: "blue",
  amethyst: "colorless",
  topaz: "colorless",
  garnet: "red",
  peridot: "green",
  citrine: "yellow",
  tanzanite: "fancy-blue",
  aquamarine: "blue",
  morganite: "pink",
  tourmaline: "green",
  zircon: "colorless",
  apatite: "blue",
  quartz: "colorless",
  paraiba: "fancy-blue",
  spinel: "red",
  alexandrite: "fancy-green",
  agate: "colorless",
} as const;

// Emoji representations for gemstone types
// Used by import scripts and UI components
export const GEMSTONE_EMOJIS: Record<GemstoneType, string> = {
  diamond: "💎",
  emerald: "💚",
  ruby: "❤️",
  sapphire: "💙",
  amethyst: "💜",
  topaz: "💛",
  garnet: "🔴",
  peridot: "💚",
  citrine: "💛",
  tanzanite: "💙",
  aquamarine: "💙",
  morganite: "💗",
  tourmaline: "💚",
  zircon: "💎",
  apatite: "💙",
  quartz: "💎",
  paraiba: "💙",
  spinel: "🔴",
  alexandrite: "💚",
  agate: "🤍",
} as const;

// Default image URLs for gemstone types
// Used by import scripts when no specific image is available
export const GEMSTONE_DEFAULT_IMAGES: Record<GemstoneType, string[]> = {
  diamond: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  emerald: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  ruby: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  sapphire: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  amethyst: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  topaz: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  garnet: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  peridot: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  citrine: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  tanzanite: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  aquamarine: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  morganite: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  tourmaline: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  zircon: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  apatite: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  quartz: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  paraiba: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  spinel: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  alexandrite: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
  agate: [
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544376664-80b17f09d399?w=800&auto=format&fit=crop&q=80",
  ],
} as const;

// Utility functions for gemstone properties
export const getGemstoneDefaultColor = (type: GemstoneType): GemColor => {
  return GEMSTONE_DEFAULT_COLORS[type];
};

export const getGemstoneEmoji = (type: GemstoneType): string => {
  return GEMSTONE_EMOJIS[type];
};

export const getGemstoneDefaultImages = (type: GemstoneType): string[] => {
  return GEMSTONE_DEFAULT_IMAGES[type];
};
