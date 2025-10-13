/**
 * Type-Safe Enum Parsers
 * 
 * Validates and parses string values into typed enums.
 * Eliminates the need for `as any` when parsing query params or user input.
 */

import type { GemstoneType, GemColor, GemCut, GemClarity } from '@/shared/types';

// Valid enum values (should match database enums)
const VALID_GEMSTONE_TYPES = new Set<string>([
  'diamond', 'emerald', 'ruby', 'sapphire', 'amethyst', 'topaz',
  'garnet', 'peridot', 'citrine', 'tanzanite', 'aquamarine', 'morganite',
  'tourmaline', 'zircon', 'apatite', 'spinel', 'opal', 'jade', 'onyx', 'agate'
]);

const VALID_GEM_COLORS = new Set<string>([
  // Diamond colors
  'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
  // Colored gemstone colors
  'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'brown',
  'black', 'white', 'colorless', 'multi'
]);

const VALID_GEM_CUTS = new Set<string>([
  'round', 'princess', 'cushion', 'emerald', 'oval', 'radiant', 'asscher',
  'marquise', 'heart', 'pear', 'trillion', 'baguette', 'rose', 'cabochon'
]);

const VALID_GEM_CLARITIES = new Set<string>([
  'fl', 'if', 'vvs1', 'vvs2', 'vs1', 'vs2', 'si1', 'si2', 'i1', 'i2', 'i3'
]);

const VALID_SORT_BY = new Set<string>([
  'created_at', 'price_amount', 'weight_carats', 'name', 'color', 'cut'
]);

const VALID_SORT_DIRECTION = new Set<string>(['asc', 'desc']);

/**
 * Type guard to check if a value is a valid GemstoneType
 */
export function isGemstoneType(value: unknown): value is GemstoneType {
  return typeof value === 'string' && VALID_GEMSTONE_TYPES.has(value);
}

/**
 * Type guard to check if a value is a valid GemColor
 */
export function isGemColor(value: unknown): value is GemColor {
  return typeof value === 'string' && VALID_GEM_COLORS.has(value);
}

/**
 * Type guard to check if a value is a valid GemCut
 */
export function isGemCut(value: unknown): value is GemCut {
  return typeof value === 'string' && VALID_GEM_CUTS.has(value);
}

/**
 * Type guard to check if a value is a valid GemClarity
 */
export function isGemClarity(value: unknown): value is GemClarity {
  return typeof value === 'string' && VALID_GEM_CLARITIES.has(value);
}

/**
 * Parse comma-separated string into valid GemstoneType array
 */
export function parseGemstoneTypes(value: string): GemstoneType[] {
  if (!value) return [];
  
  return value
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(isGemstoneType);
}

/**
 * Parse comma-separated string into valid GemColor array
 */
export function parseGemColors(value: string): GemColor[] {
  if (!value) return [];
  
  return value
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(isGemColor);
}

/**
 * Parse comma-separated string into valid GemCut array
 */
export function parseGemCuts(value: string): GemCut[] {
  if (!value) return [];
  
  return value
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(isGemCut);
}

/**
 * Parse comma-separated string into valid GemClarity array
 */
export function parseGemClarities(value: string): GemClarity[] {
  if (!value) return [];
  
  return value
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(isGemClarity);
}

/**
 * Parse sortBy value with validation
 */
export function parseSortBy(value: string): 'created_at' | 'price_amount' | 'weight_carats' | 'name' | 'color' | 'cut' | undefined {
  if (!value || !VALID_SORT_BY.has(value)) return undefined;
  return value as any; // Safe here after validation
}

/**
 * Parse sortDirection value with validation
 */
export function parseSortDirection(value: string): 'asc' | 'desc' | undefined {
  if (!value || !VALID_SORT_DIRECTION.has(value)) return undefined;
  return value as 'asc' | 'desc'; // Safe here after validation
}

