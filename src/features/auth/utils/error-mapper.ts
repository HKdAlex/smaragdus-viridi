import type { AuthError } from "@supabase/supabase-js";

export type AuthErrorType = 
  | "invalidCredentials"
  | "emailNotVerified"
  | "tooManyAttempts"
  | "accountDisabled"
  | "sessionExpired";

export interface AuthErrorResult {
  message: string;
  type: AuthErrorType;
}

/**
 * Maps Supabase auth errors to localized translation keys and error types
 */
export function mapAuthError(
  error: Error | AuthError | unknown,
  t: (key: string) => string
): AuthErrorResult {
  if (!(error instanceof Error)) {
    return {
      message: t("errors.invalidCredentials"),
      type: "invalidCredentials",
    };
  }

  // Check if it's a Supabase AuthError
  const message = error.message.toLowerCase();

  // Map common Supabase error messages and codes
  if (message.includes("email not confirmed") || message.includes("email not verified")) {
    return {
      message: t("errors.emailNotVerified"),
      type: "emailNotVerified",
    };
  }

  if (message.includes("too many requests") || message.includes("too many attempts")) {
    return {
      message: t("errors.tooManyAttempts"),
      type: "tooManyAttempts",
    };
  }

  if (message.includes("account disabled") || message.includes("user is disabled")) {
    return {
      message: t("errors.accountDisabled"),
      type: "accountDisabled",
    };
  }

  if (message.includes("session expired") || message.includes("jwt expired")) {
    return {
      message: t("errors.sessionExpired"),
      type: "sessionExpired",
    };
  }

  // Default to invalid credentials for login failures
  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password") ||
    message.includes("user not found")
  ) {
    return {
      message: t("errors.invalidCredentials"),
      type: "invalidCredentials",
    };
  }

  // Fallback to generic error message
  return {
    message: t("errors.invalidCredentials"),
    type: "invalidCredentials",
  };
}

