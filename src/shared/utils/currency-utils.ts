import type { CurrencyCode } from "@/shared/types";

/**
 * Currency conversion utilities
 * 
 * Note: For price formatting and conversion, use useCurrency() hook from currency context.
 * These utilities provide helper functions for currency symbols, names, and unit conversions.
 */

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  const symbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    RUB: "₽",
    CHF: "CHF",
    JPY: "¥",
    KZT: "₸",
  };
  return symbols[currency] || currency;
}

/**
 * Get currency name for a given currency code
 */
export function getCurrencyName(currency: CurrencyCode): string {
  const names: Record<CurrencyCode, string> = {
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    RUB: "Russian Ruble",
    CHF: "Swiss Franc",
    JPY: "Japanese Yen",
    KZT: "Kazakhstani Tenge",
  };
  return names[currency] || currency;
}

/**
 * Convert amount from cents to the base unit (dollars, euros, etc.)
 */
export function centsToBaseUnit(amount: number): number {
  return amount / 100;
}

/**
 * Convert amount from base unit to cents
 */
export function baseUnitToCents(amount: number): number {
  return Math.round(amount * 100);
}

