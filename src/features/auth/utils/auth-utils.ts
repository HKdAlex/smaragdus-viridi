import { DatabaseUserProfile, UserRole } from "@/shared/types";

/**
 * Authentication Utilities
 *
 * Centralized utilities for authentication-related operations, role checking,
 * permission validation, and user profile management.
 */

// Re-export for components that need it
export type { UserRole };
export type UserProfile = DatabaseUserProfile;

/**
 * Role hierarchy definition (higher number = more permissions)
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  regular_customer: 1,
  premium_customer: 2,
  admin: 3,
} as const;

/**
 * Permission definitions for different areas of the application
 */
export const PERMISSIONS = {
  // Catalog permissions
  VIEW_CATALOG: [
    "guest",
    "regular_customer",
    "premium_customer",
    "admin",
  ] as UserRole[],
  VIEW_PREMIUM_STONES: ["premium_customer", "admin"] as UserRole[],
  VIEW_STONE_DETAILS: [
    "guest",
    "regular_customer",
    "premium_customer",
    "admin",
  ] as UserRole[],

  // Cart and Orders permissions
  USE_CART: ["regular_customer", "premium_customer", "admin"] as UserRole[],
  PLACE_ORDERS: ["regular_customer", "premium_customer", "admin"] as UserRole[],
  VIEW_ORDER_HISTORY: [
    "regular_customer",
    "premium_customer",
    "admin",
  ] as UserRole[],

  // Profile permissions
  MANAGE_PROFILE: [
    "regular_customer",
    "premium_customer",
    "admin",
  ] as UserRole[],
  VIEW_FAVORITES: [
    "regular_customer",
    "premium_customer",
    "admin",
  ] as UserRole[],

  // Admin permissions
  ADMIN_DASHBOARD: ["admin"] as UserRole[],
  MANAGE_INVENTORY: ["admin"] as UserRole[],
  VIEW_ALL_ORDERS: ["admin"] as UserRole[],
  MANAGE_USERS: ["admin"] as UserRole[],
  VIEW_ANALYTICS: ["admin"] as UserRole[],
} as const;

/**
 * Check if a user role has permission to perform an action
 */
export function hasPermission(
  userRole: UserRole | null | undefined,
  permission: keyof typeof PERMISSIONS
): boolean {
  if (!userRole) return false;

  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}

/**
 * Check if a user role has at least the specified minimum role level
 */
export function hasMinimumRole(
  userRole: UserRole | null | undefined,
  minimumRole: UserRole
): boolean {
  if (!userRole) return false;

  const userLevel = ROLE_HIERARCHY[userRole];
  const minimumLevel = ROLE_HIERARCHY[minimumRole];

  return userLevel >= minimumLevel;
}

/**
 * Check if a user is an admin
 */
export function isAdmin(userRole: UserRole | null | undefined): boolean {
  return userRole === "admin";
}

/**
 * Check if a user is a premium customer or admin
 */
export function isPremium(userRole: UserRole | null | undefined): boolean {
  return hasMinimumRole(userRole, "premium_customer");
}

/**
 * Check if a user is authenticated (has any role above guest)
 */
export function isAuthenticated(
  userRole: UserRole | null | undefined
): boolean {
  return hasMinimumRole(userRole, "regular_customer");
}

/**
 * Get user display information
 */
export function getUserDisplayInfo(profile: UserProfile | null) {
  if (!profile) {
    return {
      displayName: "Guest User",
      initials: "GU",
      role: "guest" as UserRole,
      roleLabel: "Guest",
    };
  }

  const displayName = profile.name || "Unknown User";
  const initials =
    displayName
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2) || "U";

  const roleLabels: Record<UserRole, string> = {
    guest: "Guest",
    regular_customer: "Customer",
    premium_customer: "Premium Customer",
    admin: "Administrator",
  };

  return {
    displayName,
    initials,
    role: profile.role || ("guest" as UserRole),
    roleLabel: roleLabels[profile.role || "guest"],
  };
}

/**
 * Validate user profile completeness
 */
export interface ProfileValidation {
  isComplete: boolean;
  missingFields: string[];
  recommendations: string[];
  score: number; // 0-100
}

export function validateProfileCompleteness(
  profile: UserProfile | null
): ProfileValidation {
  if (!profile) {
    return {
      isComplete: false,
      missingFields: ["profile"],
      recommendations: ["Create your user profile"],
      score: 0,
    };
  }

  const missingFields: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // Required fields
  if (!profile.name || profile.name.trim().length === 0) {
    missingFields.push("name");
    recommendations.push("Add your full name");
  } else {
    score += 40;
  }

  // Recommended fields
  if (!profile.phone) {
    missingFields.push("phone");
    recommendations.push("Add your phone number for order updates");
  } else {
    score += 30;
  }

  if (!profile.preferred_currency) {
    missingFields.push("preferred_currency");
    recommendations.push("Set your preferred currency");
  } else {
    score += 15;
  }

  // Role should be set
  if (!profile.role) {
    missingFields.push("role");
    recommendations.push("Account role needs to be configured");
  } else {
    score += 15;
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    recommendations,
    score: Math.min(100, score),
  };
}

/**
 * Generate authentication redirect URLs with proper locale handling
 */
export function getAuthRedirectUrl(
  locale: string,
  action: "login" | "register" | "logout" | "profile",
  returnTo?: string
): string {
  const baseUrl = `/${locale}/${action}`;

  if (returnTo && (action === "login" || action === "register")) {
    const url = new URL(baseUrl, "http://localhost"); // Base URL for URL constructor
    url.searchParams.set("redirectTo", returnTo);
    return url.pathname + url.search;
  }

  return baseUrl;
}

/**
 * Rate limiting helper for authentication attempts
 */
interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitState>();

export function checkRateLimit(
  identifier: string, // IP address or user ID
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  blockDurationMs: number = 60 * 60 * 1000 // 1 hour
): { allowed: boolean; remainingAttempts: number; resetTime?: number } {
  const now = Date.now();
  const state = rateLimitStore.get(identifier);

  // Clean up old entries
  if (state && now - state.lastAttempt > windowMs && !state.blockedUntil) {
    rateLimitStore.delete(identifier);
  }

  // Check if currently blocked
  if (state?.blockedUntil && now < state.blockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: state.blockedUntil,
    };
  }

  // Initialize or update state
  const currentState: RateLimitState =
    state?.blockedUntil && now >= state.blockedUntil
      ? { attempts: 1, lastAttempt: now } // Reset after block period
      : {
          attempts: (state?.attempts || 0) + 1,
          lastAttempt: now,
        };

  // Check if limit exceeded
  if (currentState.attempts > maxAttempts) {
    currentState.blockedUntil = now + blockDurationMs;
    rateLimitStore.set(identifier, currentState);

    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: currentState.blockedUntil,
    };
  }

  rateLimitStore.set(identifier, currentState);

  return {
    allowed: true,
    remainingAttempts: maxAttempts - currentState.attempts,
  };
}

/**
 * Security headers for authentication-related responses
 */
export const AUTH_SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
} as const;

/**
 * Sanitize user input for logging and display
 */
export function sanitizeForLog(input: string, maxLength: number = 100): string {
  return input
    .replace(/[<>&'"]/g, "") // Remove potential XSS characters
    .substring(0, maxLength)
    .trim();
}

/**
 * Generate session fingerprint for additional security
 */
export function generateSessionFingerprint(request: {
  userAgent?: string;
  ip?: string;
}): string {
  const components = [
    request.userAgent?.substring(0, 200) || "",
    request.ip || "",
    // Add more fingerprint components as needed
  ];

  // Simple hash function (in production, use a proper hash library)
  let hash = 0;
  const str = components.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
}
