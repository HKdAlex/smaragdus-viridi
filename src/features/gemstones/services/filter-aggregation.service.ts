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

import type {
  GemClarity,
  GemColor,
  GemCut,
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
  category: "diamond" | "colored" | "fancy";
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
  cuts: FilterOption<GemCut>[];
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
    return Object.entries(counts)
      .map(([value, count]) => ({
        value: value as GemColor,
        label: this.formatColorLabel(value as GemColor),
        count,
        category: this.categorizeColor(value as GemColor),
      }))
      .sort((a, b) => {
        // Sort by category first, then by count
        if (a.category !== b.category) {
          const categoryOrder = { diamond: 0, fancy: 1, colored: 2 };
          return categoryOrder[a.category] - categoryOrder[b.category];
        }
        return b.count - a.count;
      });
  }

  /**
   * Process cut counts into filter options
   */
  static aggregateCuts(counts: Record<string, number>): FilterOption<GemCut>[] {
    return Object.entries(counts)
      .map(([value, count]) => ({
        value: value as GemCut,
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

  // ===== CATEGORIZATION HELPERS =====

  /**
   * Categorize a color into diamond, fancy, or colored
   */
  static categorizeColor(color: GemColor): "diamond" | "colored" | "fancy" {
    const diamondColors: GemColor[] = [
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
    ];
    const fancyColors: GemColor[] = [
      "fancy-yellow",
      "fancy-blue",
      "fancy-pink",
      "fancy-green",
    ];

    if (diamondColors.includes(color)) return "diamond";
    if (fancyColors.includes(color)) return "fancy";
    return "colored";
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
    // Diamond grades stay as-is
    if (["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"].includes(color)) {
      return color;
    }

    // Fancy colors
    if (color.startsWith("fancy-")) {
      return color
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    // Regular colors
    return color.charAt(0).toUpperCase() + color.slice(1);
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
