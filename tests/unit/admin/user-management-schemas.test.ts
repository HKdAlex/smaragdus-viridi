/**
 * Unit Tests: User Management Validation Schemas
 *
 * Tests for Zod validation schemas
 */

import { describe, expect, it } from "vitest";
import {
  userFiltersSchema,
  userListRequestSchema,
  createUserSchema,
  updateUserSchema,
  bulkUserOperationSchema,
  createInvitationSchema,
} from "@/features/admin/validation/user-management.schemas";

describe("User Management Schemas", () => {
  describe("userFiltersSchema", () => {
    it("should accept valid filters", () => {
      const valid = {
        search: "test",
        role: ["admin", "premium_customer"],
        is_active: true,
      };
      expect(() => userFiltersSchema.parse(valid)).not.toThrow();
    });

    it("should accept empty filters", () => {
      expect(() => userFiltersSchema.parse({})).not.toThrow();
    });

    it("should reject invalid role", () => {
      const invalid = {
        role: ["invalid_role"],
      };
      expect(() => userFiltersSchema.parse(invalid)).toThrow();
    });

    it("should reject search longer than 500 chars", () => {
      const invalid = {
        search: "a".repeat(501),
      };
      expect(() => userFiltersSchema.parse(invalid)).toThrow();
    });
  });

  describe("userListRequestSchema", () => {
    it("should accept valid request", () => {
      const valid = {
        page: 1,
        limit: 20,
        filters: {},
        sort_by: "created_at",
        sort_order: "desc",
      };
      expect(() => userListRequestSchema.parse(valid)).not.toThrow();
    });

    it("should default page to 1", () => {
      const result = userListRequestSchema.parse({});
      expect(result.page).toBe(1);
    });

    it("should default limit to 20", () => {
      const result = userListRequestSchema.parse({});
      expect(result.limit).toBe(20);
    });

    it("should reject limit > 100", () => {
      const invalid = {
        limit: 101,
      };
      expect(() => userListRequestSchema.parse(invalid)).toThrow();
    });

    it("should reject page < 1", () => {
      const invalid = {
        page: 0,
      };
      expect(() => userListRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe("createUserSchema", () => {
    it("should accept valid user data", () => {
      const valid = {
        email: "test@example.com",
        password: "Password123",
        name: "Test User",
        role: "regular_customer",
      };
      expect(() => createUserSchema.parse(valid)).not.toThrow();
    });

    it("should reject invalid email", () => {
      const invalid = {
        email: "not-an-email",
        name: "Test",
        role: "regular_customer",
      };
      expect(() => createUserSchema.parse(invalid)).toThrow();
    });

    it("should reject password < 8 characters", () => {
      const invalid = {
        email: "test@example.com",
        password: "short",
        name: "Test",
        role: "regular_customer",
      };
      expect(() => createUserSchema.parse(invalid)).toThrow();
    });

    it("should accept user without password (invitation)", () => {
      const valid = {
        email: "test@example.com",
        name: "Test User",
        role: "regular_customer",
        send_invitation: true,
      };
      expect(() => createUserSchema.parse(valid)).not.toThrow();
    });
  });

  describe("updateUserSchema", () => {
    it("should accept partial updates", () => {
      const valid = {
        name: "Updated Name",
      };
      expect(() => updateUserSchema.parse(valid)).not.toThrow();
    });

    it("should accept empty update", () => {
      expect(() => updateUserSchema.parse({})).not.toThrow();
    });

    it("should reject invalid role", () => {
      const invalid = {
        role: "invalid_role",
      };
      expect(() => updateUserSchema.parse(invalid)).toThrow();
    });

    it("should reject discount > 100", () => {
      const invalid = {
        discount_percentage: 101,
      };
      expect(() => updateUserSchema.parse(invalid)).toThrow();
    });
  });

  describe("bulkUserOperationSchema", () => {
    it("should accept valid bulk role change", () => {
      const valid = {
        user_ids: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"],
        operation: "role_change" as const,
        role: "premium_customer",
      };
      expect(() => bulkUserOperationSchema.parse(valid)).not.toThrow();
    });

    it("should accept valid bulk activate", () => {
      const valid = {
        user_ids: ["123e4567-e89b-12d3-a456-426614174000"],
        operation: "activate" as const,
      };
      expect(() => bulkUserOperationSchema.parse(valid)).not.toThrow();
    });

    it("should reject empty user_ids array", () => {
      const invalid = {
        user_ids: [],
        operation: "activate" as const,
      };
      expect(() => bulkUserOperationSchema.parse(invalid)).toThrow();
    });

    it("should reject invalid UUID", () => {
      const invalid = {
        user_ids: ["not-a-uuid"],
        operation: "activate" as const,
      };
      expect(() => bulkUserOperationSchema.parse(invalid)).toThrow();
    });

    it("should require role for role_change operation", () => {
      const invalid = {
        user_ids: ["123e4567-e89b-12d3-a456-426614174000"],
        operation: "role_change" as const,
      };
      expect(() => bulkUserOperationSchema.parse(invalid)).toThrow();
    });

    it("should reject more than 100 user_ids", () => {
      const invalid = {
        user_ids: Array.from({ length: 101 }, (_, i) => `123e4567-e89b-12d3-a456-42661417400${i}`),
        operation: "activate" as const,
      };
      expect(() => bulkUserOperationSchema.parse(invalid)).toThrow();
    });
  });

  describe("createInvitationSchema", () => {
    it("should accept valid invitation", () => {
      const valid = {
        email: "test@example.com",
        role: "regular_customer",
      };
      expect(() => createInvitationSchema.parse(valid)).not.toThrow();
    });

    it("should default role to regular_customer", () => {
      const result = createInvitationSchema.parse({
        email: "test@example.com",
      });
      expect(result.role).toBe("regular_customer");
    });

    it("should reject invalid email", () => {
      const invalid = {
        email: "not-an-email",
        role: "regular_customer",
      };
      expect(() => createInvitationSchema.parse(invalid)).toThrow();
    });
  });
});

