import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge CSS classes with Tailwind CSS conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format price for display in different currencies
 */
export function formatPrice(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100) // Convert from cents to dollars
}

/**
 * Convert weight to display format with appropriate units
 */
export function formatWeight(carats: number): string {
  if (carats >= 1) {
    return `${carats.toFixed(2)}ct`
  } else {
    return `${(carats * 100).toFixed(0)} points`
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
  const baseSlug = `${color}-${cut}-${weight}ct-${serialNumber}`
  return baseSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
}

/**
 * Validate environment variables
 */
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}
