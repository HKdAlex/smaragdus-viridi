/**
 * Zod validation schemas for user profile operations
 * 
 * SSOT for profile form validation - used by both client and server
 */

import { z } from "zod";

// ===== CONSTANTS =====

const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "RUB", "CHF", "JPY", "KZT"] as const;
const SUPPORTED_LANGUAGES = ["en", "ru"] as const;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 100;
const PHONE_MAX_LENGTH = 20;

// ===== PROFILE UPDATE SCHEMA =====

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(NAME_MIN_LENGTH, "Name is required")
    .max(NAME_MAX_LENGTH, `Name must be less than ${NAME_MAX_LENGTH} characters`)
    .trim()
    .optional(),
  phone: z
    .string()
    .max(PHONE_MAX_LENGTH, `Phone must be less than ${PHONE_MAX_LENGTH} characters`)
    .regex(/^[+]?[\d\s\-()]*$/, "Invalid phone number format")
    .trim()
    .optional()
    .or(z.literal("")),
  avatar_url: z
    .string()
    .url("Invalid URL format")
    .optional(),
  email: z
    .string()
    .email("Invalid email format")
    .optional(),
  preferred_currency: z
    .enum(SUPPORTED_CURRENCIES, {
      errorMap: () => ({ message: "Invalid currency code" }),
    })
    .optional()
    .nullable(),
  language_preference: z
    .enum(SUPPORTED_LANGUAGES, {
      errorMap: () => ({ message: "Invalid language preference" }),
    })
    .optional()
    .nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ===== PASSWORD CHANGE SCHEMA =====

export const changePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(1, "Current password is required"),
    new_password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      .max(PASSWORD_MAX_LENGTH, `Password must be less than ${PASSWORD_MAX_LENGTH} characters`)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirm_password: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "New password must be different from current password",
    path: ["new_password"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ===== PREFERENCES SCHEMA =====

export const updatePreferencesSchema = z.object({
  email_notifications: z.boolean().optional(),
  order_updates: z.boolean().optional(),
  marketing_emails: z.boolean().optional(),
  chat_messages: z.boolean().optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

// ===== SIMPLE PASSWORD SCHEMA (less strict, for basic validation) =====

export const simplePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(1, "Current password is required"),
    new_password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
    confirm_password: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type SimplePasswordInput = z.infer<typeof simplePasswordSchema>;

// ===== VALIDATION HELPERS =====

/**
 * Validate profile update data
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateProfileUpdate(data: unknown): {
  success: boolean;
  data?: UpdateProfileInput;
  errors?: z.ZodError;
} {
  const result = updateProfileSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate password change data
 * Returns { success: true, data } or { success: false, errors }
 */
export function validatePasswordChange(data: unknown): {
  success: boolean;
  data?: ChangePasswordInput;
  errors?: z.ZodError;
} {
  const result = changePasswordSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate preferences update data
 * Returns { success: true, data } or { success: false, errors }
 */
export function validatePreferencesUpdate(data: unknown): {
  success: boolean;
  data?: UpdatePreferencesInput;
  errors?: z.ZodError;
} {
  const result = updatePreferencesSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Format Zod errors into a simple key-value map
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}

