/**
 * Database Enums Cache Service
 *
 * Provides cached access to database enum values to avoid repeated queries.
 * Uses the Constants object from the generated database types.
 */

import { Constants } from "@/shared/types/database";

export type GemstoneType =
  (typeof Constants.public.Enums.gemstone_type)[number];
export type GemColor = (typeof Constants.public.Enums.gem_color)[number];
export type GemCut = (typeof Constants.public.Enums.gem_cut)[number];
export type GemClarity = (typeof Constants.public.Enums.gem_clarity)[number];
export type CurrencyCode =
  (typeof Constants.public.Enums.currency_code)[number];
export type MetadataStatus =
  (typeof Constants.public.Enums.metadata_status)[number];

/**
 * Cached database enum values
 * These are loaded once and cached for the lifetime of the application
 */
export const DatabaseEnums = {
  /**
   * Get all gemstone types
   */
  getGemstoneTypes(): readonly GemstoneType[] {
    return Constants.public.Enums.gemstone_type;
  },

  /**
   * Get all gem colors
   */
  getGemColors(): readonly GemColor[] {
    return Constants.public.Enums.gem_color;
  },

  /**
   * Get all gem cuts
   */
  getGemCuts(): readonly GemCut[] {
    return Constants.public.Enums.gem_cut;
  },

  /**
   * Get all gem clarities
   */
  getGemClarities(): readonly GemClarity[] {
    return Constants.public.Enums.gem_clarity;
  },

  /**
   * Get all currency codes
   */
  getCurrencyCodes(): readonly CurrencyCode[] {
    return Constants.public.Enums.currency_code;
  },

  /**
   * Get all metadata statuses
   */
  getMetadataStatuses(): readonly MetadataStatus[] {
    return Constants.public.Enums.metadata_status;
  },

  /**
   * Check if a value is a valid gemstone type
   */
  isValidGemstoneType(value: string): value is GemstoneType {
    return Constants.public.Enums.gemstone_type.includes(value as GemstoneType);
  },

  /**
   * Check if a value is a valid gem color
   */
  isValidGemColor(value: string): value is GemColor {
    return Constants.public.Enums.gem_color.includes(value as GemColor);
  },

  /**
   * Check if a value is a valid gem cut
   */
  isValidGemCut(value: string): value is GemCut {
    return Constants.public.Enums.gem_cut.includes(value as GemCut);
  },

  /**
   * Check if a value is a valid gem clarity
   */
  isValidGemClarity(value: string): value is GemClarity {
    return Constants.public.Enums.gem_clarity.includes(value as GemClarity);
  },

  /**
   * Check if a value is a valid currency code
   */
  isValidCurrencyCode(value: string): value is CurrencyCode {
    return Constants.public.Enums.currency_code.includes(value as CurrencyCode);
  },

  /**
   * Check if a value is a valid metadata status
   */
  isValidMetadataStatus(value: string): value is MetadataStatus {
    return Constants.public.Enums.metadata_status.includes(
      value as MetadataStatus
    );
  },
} as const;

/**
 * Type-safe enum arrays for use in components
 */
export const GEMSTONE_TYPES = DatabaseEnums.getGemstoneTypes();
export const GEM_COLORS = DatabaseEnums.getGemColors();
export const GEM_CUTS = DatabaseEnums.getGemCuts();
export const GEM_CLARITIES = DatabaseEnums.getGemClarities();
export const CURRENCY_CODES = DatabaseEnums.getCurrencyCodes();
export const METADATA_STATUSES = DatabaseEnums.getMetadataStatuses();

/**
 * Default values for forms
 */
export const DEFAULT_GEMSTONE_VALUES = {
  type: "diamond" as const,
  color: "D" as const,
  cut: "round" as const,
  clarity: "FL" as const,
  currency: "USD" as const,
} as const;
