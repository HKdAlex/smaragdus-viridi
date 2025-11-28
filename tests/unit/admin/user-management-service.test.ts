/**
 * Unit Tests: UserManagementService
 *
 * Tests for user management service operations
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserManagementService } from "@/features/admin/services/user-management-service";
import type { UserListRequest, CreateUserRequest, UpdateUserRequest } from "@/features/admin/types/user-management.types";

// Mock fetch globally
global.fetch = vi.fn();

describe("UserManagementService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUsers", () => {
    it("should fetch users with default pagination", async () => {
      const mockResponse = {
        success: true,
        data: {
          users: [],
          total: 0,
          page: 1,
          limit: 20,
          total_pages: 0,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await UserManagementService.getUsers({});

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users"),
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result.success).toBe(true);
    });

    it("should apply filters correctly", async () => {
      const mockResponse = {
        success: true,
        data: {
          users: [],
          total: 0,
          page: 1,
          limit: 20,
          total_pages: 0,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const request: UserListRequest = {
        page: 2,
        limit: 10,
        filters: {
          search: "test",
          role: ["admin", "premium_customer"],
          is_active: true,
        },
      };

      await UserManagementService.getUsers(request);

      const callUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(callUrl).toContain("page=2");
      expect(callUrl).toContain("limit=10");
      expect(callUrl).toContain("search=test");
      expect(callUrl).toContain("role=admin%2Cpremium_customer");
      expect(callUrl).toContain("is_active=true");
    });

    it("should handle API errors", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: "Unauthorized" }),
      } as Response);

      const result = await UserManagementService.getUsers({});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle network errors", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

      const result = await UserManagementService.getUsers({});

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });
  });

  describe("createUser", () => {
    it("should create user with password", async () => {
      const mockResponse = {
        success: true,
        data: {
          user_id: "123",
          name: "Test User",
          email: "test@example.com",
          role: "regular_customer",
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const request: CreateUserRequest = {
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        role: "regular_customer",
      };

      const result = await UserManagementService.createUser(request);

      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/users",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(request),
        })
      );
      expect(result.success).toBe(true);
    });

    it("should create user with invitation", async () => {
      const mockResponse = {
        success: true,
        data: {
          user_id: "123",
          name: "Test User",
          email: "test@example.com",
          role: "regular_customer",
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const request: CreateUserRequest = {
        email: "test@example.com",
        name: "Test User",
        role: "regular_customer",
        send_invitation: true,
      };

      await UserManagementService.createUser(request);

      const callBody = JSON.parse(
        vi.mocked(fetch).mock.calls[0][1]?.body as string
      );
      expect(callBody.send_invitation).toBe(true);
    });
  });

  describe("updateUser", () => {
    it("should update user profile", async () => {
      const mockResponse = {
        success: true,
        data: {
          user_id: "123",
          name: "Updated Name",
          role: "premium_customer",
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const request: UpdateUserRequest = {
        name: "Updated Name",
        role: "premium_customer",
      };

      const result = await UserManagementService.updateUser("123", request);

      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/users/123",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(request),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe("deleteUser", () => {
    it("should delete user", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null }),
      } as Response);

      const result = await UserManagementService.deleteUser("123");

      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/users/123",
        expect.objectContaining({
          method: "DELETE",
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe("getUserStatistics", () => {
    it("should fetch user statistics", async () => {
      const mockResponse = {
        success: true,
        data: {
          totalUsers: 100,
          activeUsers: 80,
          premiumUsers: 20,
          admins: 3,
          newUsersThisMonth: 10,
          regularCustomers: 77,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await UserManagementService.getUserStatistics();

      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/users/statistics",
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalUsers).toBe(100);
        expect(result.data.activeUsers).toBe(80);
      }
    });
  });

  describe("bulkOperation", () => {
    it("should perform bulk role change", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { success: 3, failed: 0, errors: [] },
        }),
      } as Response);

      const result = await UserManagementService.bulkOperation({
        user_ids: ["1", "2", "3"],
        operation: "role_change",
        role: "premium_customer",
      });

      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/users/bulk",
        expect.objectContaining({
          method: "POST",
        })
      );
      expect(result.success).toBe(true);
    });

    it("should perform bulk activate", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { success: 2, failed: 0, errors: [] },
        }),
      } as Response);

      const result = await UserManagementService.bulkOperation({
        user_ids: ["1", "2"],
        operation: "activate",
      });

      expect(result.success).toBe(true);
    });

    it("should perform bulk delete", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { success: 2, failed: 0, errors: [] },
        }),
      } as Response);

      const result = await UserManagementService.bulkOperation({
        user_ids: ["1", "2"],
        operation: "delete",
      });

      expect(result.success).toBe(true);
    });
  });
});

