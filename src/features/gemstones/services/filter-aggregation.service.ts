/**
 * Filter Aggregation Service
 *
 * Processes raw filter counts into structured options for UI components.
 * Handles categorization, sorting, and formatting of filter data.
 *
 * Following clean-code principles:
 * - Single Responsibility: Only handles filter data transformation
 * - Pure Functions: No side effects, predictable outputs
 * - Type Safety: Strict typing for all transformations
 */

import type { GemColorCategory } from "@/shared/config/basic-gem-colors";
import {
    BASIC_GEM_COLORS,
    categorizeGemColor,
    DIAMOND_COLOR_GRADES,
    isDiamondColorGrade,
    normalizeGemColor,
} from "@/shared/config/basic-gem-colors";
import type {
    GemClarity,
    GemColor,
    // CUT-C3.1: GemCut enum removed
    GemstoneType,
} from "@/shared/types";

import type { FilterCounts } from "./gemstone-fetch.service";

// ===== TYPES =====

export interface FilterOption<T = string> {
  value: T;
  label: string;
  count: number;
}

export interface ColorFilterOption extends FilterOption<GemColor> {
  category: GemColorCategory;
}

export interface ClarityFilterOption extends FilterOption<GemClarity> {
  order: number;
}

export interface OriginFilterOption extends FilterOption<string> {
  country: string;
}

export interface AggregatedFilterOptions {
  gemstoneTypes: FilterOption<GemstoneType>[];
  colors: ColorFilterOption[];
  cuts: FilterOption<string>[]; // CUT-C3.1: cuts are now strings
  clarities: ClarityFilterOption[];
  origins: OriginFilterOption[];
  priceRange: {
    min: number;
    max: number;
    currency: "USD";
  };
  weightRange: {
    min: number;
    max: number;
  };
}

// ===== SERVICE CLASS =====

export class FilterAggregationService {
  /**
   * Aggregate all filter options from raw counts
   */
  static aggregateFilterOptions(counts: FilterCounts): AggregatedFilterOptions {
    return {
      gemstoneTypes: this.aggregateGemstoneTypes(counts.gemstoneTypes),
      colors: this.aggregateColors(counts.colors),
      cuts: this.aggregateCuts(counts.cuts),
      clarities: this.aggregateClarities(counts.clarities),
      origins: this.aggregateOrigins(counts.origins),
      priceRange: {
        min: 0,
        max: 5000000, // $50,000 in cents
        currency: "USD",
      },
      weightRange: {
        min: 0,
        max: 20, // 20 carats
      },
    };
  }

  /**
   * Process gemstone type counts into filter options
   */
  static aggregateGemstoneTypes(
    counts: Record<string, number>
  ): FilterOption<GemstoneType>[] {
    return Object.entries(counts)
      .map(([value, count]) => ({
        value: value as GemstoneType,
        label: this.formatGemstoneTypeLabel(value),
        count,
      }))
      .sort((a, b) => b.count - a.count); // Sort by popularity
  }

  /**
   * Process color counts into categorized filter options
   */
  static aggregateColors(counts: Record<string, number>): ColorFilterOption[] {
    const rolled = new Map<string, number>();

    for (const [rawValue, count] of Object.entries(counts)) {
      const bucket = normalizeGemColor(rawValue);
      rolled.set(bucket, (rolled.get(bucket) ?? 0) + count);
    }

    const facetKeys = [
      ...DIAMOND_COLOR_GRADES,
      ...BASIC_GEM_COLORS,
    ] as string[];

    return facetKeys
      .map((value) => ({
        value: value as GemColor,
        label: this.formatColorLabel(value as GemColor),
        count: rolled.get(value) ?? 0,
        category: categorizeGemColor(value),
      }))
      .filter((opt) => opt.count > 0)
      .sort((a, b) => {
        if (a.category !== b.category) {
          const categoryOrder = { diamond: 0, colored: 1 };
          return categoryOrder[a.category] - categoryOrder[b.category];
        }
        return b.count - a.count;
      });
  }

  /**
   * Process cut counts into filter options (CUT-C3.1: cuts are now strings)
   */
  static aggregateCuts(counts: Record<string, number>): FilterOption<string>[] {
    return Object.entries(counts)
      .map(([value, count]) => ({
        value: value,
        label: this.formatCutLabel(value),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Process clarity counts into sorted filter options
   */
  static aggregateClarities(
    counts: Record<string, number>
  ): ClarityFilterOption[] {
    return Object.entries(counts)
      .map(([value, count]) => ({
        value: value as GemClarity,
        label: value, // Clarity codes are already formatted (FL, VVS1, etc.)
        count,
        order: this.getClarityOrder(value as GemClarity),
      }))
      .sort((a, b) => a.order - b.order); // Sort by quality (best first)
  }

  /**
   * Process origin counts into filter options
   */
  static aggregateOrigins(
    counts: Record<string, number>
  ): OriginFilterOption[] {
    return Object.entries(counts)
      .map(([value, count]) => ({
        value: value,
        label: value,
        country: "Various", // TODO: Link to actual country data
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get sorting order for clarity grades
   */
  private static getClarityOrder(clarity: GemClarity): number {
    const order: Record<GemClarity, number> = {
      FL: 1,
      IF: 2,
      VVS1: 3,
      VVS2: 4,
      VS1: 5,
      VS2: 6,
      SI1: 7,
      SI2: 8,
      I1: 9,
    };
    return order[clarity] || 10;
  }

  // ===== FORMATTING HELPERS =====

  /**
   * Format gemstone type for display
   */
  private static formatGemstoneTypeLabel(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  /**
   * Format color for display
   */
  private static formatColorLabel(color: GemColor): string {
    const normalized = normalizeGemColor(color);
    if (isDiamondColorGrade(normalized)) {
      return normalized;
    }
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  /**
   * Format cut for display
   */
  private static formatCutLabel(cut: string): string {
    return cut.charAt(0).toUpperCase() + cut.slice(1);
  }

  // ===== UTILITY METHODS =====

  /**
   * Filter options by minimum count threshold
   */
  static filterByMinCount<T extends { count: number }>(
    options: T[],
    minCount: number = 1
  ): T[] {
    return options.filter((option) => option.count >= minCount);
  }

  /**
   * Get top N options by count
   */
  static getTopOptions<T extends { count: number }>(
    options: T[],
    limit: number
  ): T[] {
    return options.slice(0, limit);
  }
}
