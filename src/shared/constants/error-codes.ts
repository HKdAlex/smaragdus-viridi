/**
 * Error Codes Constants
 *
 * Centralized error codes that can be translated in components.
 * Services should throw these codes, components should translate them.
 */

export const ERROR_CODES = {
  // Admin errors
  ADMIN_ACCESS_REQUIRED: "ADMIN_ACCESS_REQUIRED",
  ANALYTICS_FETCH_FAILED: "ANALYTICS_FETCH_FAILED",
  DATABASE_CONNECTION_FAILED: "DATABASE_CONNECTION_FAILED",
  SERVICE_ROLE_KEY_NOT_AVAILABLE: "SERVICE_ROLE_KEY_NOT_AVAILABLE",
  SUPABASE_ADMIN_CLIENT_NOT_INITIALIZED:
    "SUPABASE_ADMIN_CLIENT_NOT_INITIALIZED",

  // User errors
  PROFILE_NOT_LOADED: "PROFILE_NOT_LOADED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Custom error class that includes error codes for translation
 */
export class LocalizedError extends Error {
  constructor(public code: ErrorCode, message?: string) {
    super(message || code);
    this.name = "LocalizedError";
  }
}
