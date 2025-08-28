/**
 * Utility functions for formatting data in the application
 */

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100); // Convert from cents to dollars
}

export function formatWeight(weight: number): string {
  return `${weight}ct`;
}

export function formatDimensions(length?: number, width?: number, depth?: number): string {
  const dims = [];
  if (length) dims.push(`${length}mm L`);
  if (width) dims.push(`${width}mm W`);
  if (depth) dims.push(`${depth}mm D`);
  return dims.length > 0 ? dims.join(' × ') : 'Not specified';
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}
