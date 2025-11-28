/**
 * Unit Tests: UserInvitationService
 *
 * Tests for invitation service operations
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserInvitationService } from "@/features/admin/services/user-invitation-service";

// Mock fetch globally
global.fetch = vi.fn();

describe("UserInvitationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendInvitation", () => {
    it("should send invitation successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          id: "inv1",
          email: "test@example.com",
          role: "regular_customer",
          invited_by: "admin1",
          invited_by_name: "Admin",
          token: "token123",
          expires_at: "2025-01-28T10:00:00Z",
          accepted_at: null,
          created_at: "2025-01-25T10:00:00Z",
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await UserInvitationService.sendInvitation({
        email: "test@example.com",
        role: "regular_customer",
      });

      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/invitations",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            role: "regular_customer",
          }),
        })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("test@example.com");
      }
    });

    it("should handle API errors", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: "Email already invited",
        }),
      } as Response);

      const result = await UserInvitationService.sendInvitation({
        email: "existing@example.com",
        role: "regular_customer",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Email already invited");
    });
  });

  describe("getInvitations", () => {
    it("should fetch all invitations", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: "inv1",
            email: "test@example.com",
            role: "regular_customer",
            invited_by: "admin1",
            invited_by_name: "Admin",
            token: "token123",
            expires_at: "2025-01-28T10:00:00Z",
            accepted_at: null,
            created_at: "2025-01-25T10:00:00Z",
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await UserInvitationService.getInvitations();

      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/invitations",
        expect.objectContaining({
          method: "GET",
        })
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
      }
    });

    it("should filter by status", async () => {
      const mockResponse = {
        success: true,
        data: [],
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      await UserInvitationService.getInvitations({ status: "pending" });

      const callUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(callUrl).toContain("status=pending");
    });
  });

  describe("resendInvitation", () => {
    it("should resend invitation", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const result = await UserInvitationService.resendInvitation("inv1");

      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/invitations/inv1",
        expect.objectContaining({
          method: "POST",
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe("cancelInvitation", () => {
    it("should cancel invitation", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const result = await UserInvitationService.cancelInvitation("inv1");

      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/invitations/inv1",
        expect.objectContaining({
          method: "DELETE",
        })
      );
      expect(result.success).toBe(true);
    });
  });
});

