/**
 * Unit Tests: UserAuditService
 *
 * Tests for audit log service operations
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserAuditService } from "@/features/admin/services/user-audit-service";

// Mock fetch globally
global.fetch = vi.fn();

describe("UserAuditService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAuditLogs", () => {
    it("should fetch audit logs with pagination", async () => {
      const mockResponse = {
        success: true,
        data: {
          logs: [
            {
              id: "1",
              admin_user_id: "admin1",
              admin_name: "Admin User",
              target_user_id: "user1",
              target_user_name: "Test User",
              action: "update",
              changes: {},
              created_at: "2025-01-25T10:00:00Z",
            },
          ],
          total: 1,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await UserAuditService.getAuditLogs({
        page: 1,
        limit: 20,
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/audit-logs"),
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logs).toHaveLength(1);
        expect(result.data.total).toBe(1);
      }
    });

    it("should filter by action type", async () => {
      const mockResponse = {
        success: true,
        data: {
          logs: [],
          total: 0,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await UserAuditService.getAuditLogs({
        action: "role_change",
        page: 1,
      });

      const callUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(callUrl).toContain("action=role_change");
    });

    it("should filter by target user ID", async () => {
      const mockResponse = {
        success: true,
        data: {
          logs: [],
          total: 0,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await UserAuditService.getAuditLogs({
        target_user_id: "user123",
        page: 1,
      });

      const callUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(callUrl).toContain("target_user_id=user123");
    });

    it("should handle API errors", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: "Unauthorized" }),
      } as Response);

      const result = await UserAuditService.getAuditLogs({});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("getAuditLogsForUser", () => {
    it("should fetch logs for specific user", async () => {
      const mockResponse = {
        success: true,
        data: {
          logs: [],
          total: 0,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await UserAuditService.getAuditLogsForUser("user123", 1, 20);

      const callUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(callUrl).toContain("target_user_id=user123");
    });
  });

  describe("getUserAuditLogs", () => {
    it("should fetch logs via user detail endpoint", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: "1",
            admin_user_id: "admin1",
            admin_name: "Admin",
            target_user_id: "user1",
            target_user_name: "User",
            action: "update",
            changes: {},
            created_at: "2025-01-25T10:00:00Z",
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await UserAuditService.getUserAuditLogs("user123");

      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/users/user123/audit-logs",
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });
  });
});

