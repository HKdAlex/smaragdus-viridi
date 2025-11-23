/**
 * Chat Email Configuration (SSOT)
 * 
 * Single source of truth for all chat-related email configuration.
 * No business logic - only configuration constants.
 */

export const CHAT_EMAIL_CONFIG = {
  fromAddress: process.env.CHAT_EMAIL_FROM || 'noreply@crystallique.com',
  unattendedAlertThresholdMinutes: 15,
  rateLimitWindowMinutes: 60,
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://crystallique.com',
  siteName: 'Crystallique',
} as const;

/**
 * Get email sender address
 */
export function getEmailFromAddress(): string {
  return CHAT_EMAIL_CONFIG.fromAddress;
}

/**
 * Get unattended message alert threshold in minutes
 */
export function getUnattendedAlertThreshold(): number {
  return CHAT_EMAIL_CONFIG.unattendedAlertThresholdMinutes;
}

/**
 * Get rate limit window in minutes
 */
export function getRateLimitWindow(): number {
  return CHAT_EMAIL_CONFIG.rateLimitWindowMinutes;
}

/**
 * Get site URL for email links
 */
export function getSiteUrl(): string {
  return CHAT_EMAIL_CONFIG.siteUrl;
}

/**
 * Get site name for email templates
 */
export function getSiteName(): string {
  return CHAT_EMAIL_CONFIG.siteName;
}

