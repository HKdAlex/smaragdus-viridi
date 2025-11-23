import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge CSS classes with Tailwind CSS conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price for display in different currencies
 * 
 * @deprecated This function is deprecated. For client-side components, use `useCurrency().formatPrice()` 
 * from the currency context instead. For server-side formatting, use the database function `format_price()`.
 * 
 * This function will be removed in a future version. Migrate to currency context for proper currency conversion.
 */
export function formatPrice(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[DEPRECATED] formatPrice from lib/utils is deprecated. Use useCurrency().formatPrice() instead."
    );
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100); // Convert from smallest unit
}

/**
 * Convert weight to display format with appropriate units
 */
export function formatWeight(carats: number): string {
  if (carats >= 1) {
    return `${carats.toFixed(2)}ct`;
  } else {
    return `${(carats * 100).toFixed(0)} points`;
  }
}

/**
 * Generate SEO-friendly slug from gemstone properties
 */
export function generateGemstoneSlug(
  color: string,
  cut: string,
  weight: number,
  serialNumber: string
): string {
  const baseSlug = `${color}-${cut}-${weight}ct-${serialNumber}`;
  return baseSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
}

/**
 * Validate environment variables
 */
export function validateEnv() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

export function formatCarat(weight: number): string {
  return `${weight.toFixed(2)}ct`;
}

export function formatDimensions(
  length: number,
  width: number,
  depth: number
): string {
  return `${length} × ${width} × ${depth} mm`;
}

export function generateSerialNumber(): string {
  const prefix = "SV";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
