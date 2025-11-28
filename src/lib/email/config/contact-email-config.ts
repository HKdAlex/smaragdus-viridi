/**
 * Contact Email Configuration (SSOT)
 * 
 * Single source of truth for all contact form email configuration.
 * No business logic - only configuration constants.
 */

export const CONTACT_EMAIL_CONFIG = {
  adminFallbackEmail: process.env.ADMIN_FALLBACK_EMAIL || 'admin@crystallique.com',
  fromAddress: process.env.CONTACT_EMAIL_FROM || process.env.CHAT_EMAIL_FROM || 'noreply@crystallique.com',
  autoResponseEnabled: true,
  adminNotificationEnabled: true,
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://crystallique.com',
  siteName: 'Crystallique',
} as const;

/**
 * Get admin fallback email for notifications
 */
export function getAdminFallbackEmail(): string {
  return CONTACT_EMAIL_CONFIG.adminFallbackEmail;
}

/**
 * Get email sender address for contact notifications
 */
export function getContactEmailFromAddress(): string {
  return CONTACT_EMAIL_CONFIG.fromAddress;
}

/**
 * Check if auto-response emails are enabled
 */
export function isAutoResponseEnabled(): boolean {
  return CONTACT_EMAIL_CONFIG.autoResponseEnabled;
}

/**
 * Check if admin notification emails are enabled
 */
export function isAdminNotificationEnabled(): boolean {
  return CONTACT_EMAIL_CONFIG.adminNotificationEnabled;
}

/**
 * Get site URL for email links
 */
export function getContactSiteUrl(): string {
  return CONTACT_EMAIL_CONFIG.siteUrl;
}

/**
 * Get site name for email templates
 */
export function getContactSiteName(): string {
  return CONTACT_EMAIL_CONFIG.siteName;
}

