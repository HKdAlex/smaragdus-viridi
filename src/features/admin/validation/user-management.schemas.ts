/**
 * User Management Validation Schemas
 *
 * Zod schemas for validating user management API requests.
 * Used in /api/admin/users routes for type-safe validation.
 */

import { z } from "zod";
import type { UserRole, CurrencyCode } from "@/shared/types";

// User role enum validation
const userRoleSchema = z.enum([
  "guest",
  "regular_customer",
  "premium_customer",
  "admin",
]);

// Currency code enum validation
const currencyCodeSchema = z.enum([
  "USD",
  "EUR",
  "GBP",
  "RUB",
  "CHF",
  "JPY",
  "KZT",
]);

/**
 * User Filters Schema
 */
export const userFiltersSchema = z.object({
  search: z.string().min(1).max(500).optional(),
  role: z.array(userRoleSchema).optional(),
  is_active: z.coerce.boolean().optional(),
  registered_from: z.string().datetime().optional(),
  registered_to: z.string().datetime().optional(),
  has_orders: z.coerce.boolean().optional(),
});

export type UserFiltersInput = z.infer<typeof userFiltersSchema>;

/**
 * User List Request Schema
 */
export const userListRequestSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  filters: userFiltersSchema.optional().default({}),
  sort_by: z.enum(["name", "email", "created_at", "role"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export type UserListRequestInput = z.infer<typeof userListRequestSchema>;

/**
 * Create User Schema
 */
export const createUserSchema = z
  .object({
    email: z.string().email().min(1).max(255),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .optional(),
    name: z.string().min(1).max(255),
    phone: z.string().max(50).optional(),
    role: userRoleSchema,
    preferred_currency: currencyCodeSchema.optional(),
    send_invitation: z.coerce.boolean().default(false),
  })
  .refine(
    (data) => {
      // Either password is provided OR send_invitation is true
      return data.password || data.send_invitation;
    },
    {
      message:
        "Either password must be provided or send_invitation must be true",
      path: ["password"],
    }
  );

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Update User Schema
 */
export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().min(1).max(255).optional(),
  role: userRoleSchema.optional(),
  preferred_currency: currencyCodeSchema.optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  language_preference: z.string().min(2).max(5).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Bulk User Operation Schema
 */
export const bulkUserOperationSchema = z
  .object({
    user_ids: z.array(z.string().uuid()).min(1).max(100),
    operation: z.enum(["role_change", "activate", "suspend", "delete"]),
    role: userRoleSchema.optional(),
  })
  .refine(
    (data) => {
      // If operation is role_change, role must be provided
      if (data.operation === "role_change") {
        return data.role !== undefined;
      }
      return true;
    },
    {
      message: "Role is required for role_change operation",
      path: ["role"],
    }
  );

export type BulkUserOperationInput = z.infer<typeof bulkUserOperationSchema>;

/**
 * Create Invitation Schema
 */
export const createInvitationSchema = z.object({
  email: z.string().email().min(1).max(255),
  role: userRoleSchema.default("regular_customer"),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;

/**
 * Helper: Parse user list request from URL params
 */
export function parseUserListRequest(
  searchParams: URLSearchParams
): UserListRequestInput {
  const filters: UserFiltersInput = {};

  // Parse search
  const search = searchParams.get("search");
  if (search) filters.search = search;

  // Parse roles
  const roles = searchParams.get("role");
  if (roles) {
    filters.role = roles.split(",") as UserRole[];
  }

  // Parse active status
  const isActive = searchParams.get("is_active");
  if (isActive !== null) {
    filters.is_active = isActive === "true";
  }

  // Parse date range
  const registeredFrom = searchParams.get("registered_from");
  if (registeredFrom) filters.registered_from = registeredFrom;

  const registeredTo = searchParams.get("registered_to");
  if (registeredTo) filters.registered_to = registeredTo;

  // Parse has orders
  const hasOrders = searchParams.get("has_orders");
  if (hasOrders !== null) {
    filters.has_orders = hasOrders === "true";
  }

  return {
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 20),
    filters,
    sort_by: (searchParams.get("sort_by") as "name" | "email" | "created_at" | "role") || "created_at",
    sort_order: (searchParams.get("sort_order") as "asc" | "desc") || "desc",
  };
}

