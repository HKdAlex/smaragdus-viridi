"use client";

/**
 * User Invitation Service (SRP: Invitation Operations)
 *
 * Handles user invitation operations.
 */

import type {
  UserInvitation,
  CreateInvitationRequest,
} from "../types/user-management.types";

// Simple logger for invitation service
const logger = {
  info: (message: string, data?: unknown) =>
    console.log(`[USER-INVITE INFO] ${message}`, data),
  error: (message: string, error?: unknown, data?: unknown) =>
    console.error(`[USER-INVITE ERROR] ${message}`, error, data),
};

type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

export class UserInvitationService {
  /**
   * Send invitation to user
   */
  static async sendInvitation(
    data: CreateInvitationRequest
  ): Promise<Result<UserInvitation>> {
    try {
      logger.info("Sending invitation", { email: data.email });

      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to send invitation");
      }

      logger.info("Invitation sent successfully", {
        invitationId: result.data.id,
      });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to send invitation", error, { email: data.email });
      return {
        success: false,
        error: `Failed to send invitation: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get list of invitations
   */
  static async getInvitations(params?: {
    status?: "pending" | "accepted" | "expired";
  }): Promise<Result<UserInvitation[]>> {
    try {
      logger.info("Fetching invitations", { params });

      const searchParams = new URLSearchParams();
      if (params?.status) {
        searchParams.set("status", params.status);
      }

      const url = `/api/admin/invitations${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch invitations");
      }

      logger.info("Invitations fetched successfully", {
        count: result.data.length,
      });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to fetch invitations", error);
      return {
        success: false,
        error: `Failed to fetch invitations: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Resend invitation email
   */
  static async resendInvitation(
    invitationId: string
  ): Promise<Result<void>> {
    try {
      logger.info("Resending invitation", { invitationId });

      const response = await fetch(`/api/admin/invitations/${invitationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to resend invitation");
      }

      logger.info("Invitation resent successfully", { invitationId });

      return { success: true, data: undefined };
    } catch (error) {
      logger.error("Failed to resend invitation", error, { invitationId });
      return {
        success: false,
        error: `Failed to resend invitation: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Cancel invitation
   */
  static async cancelInvitation(invitationId: string): Promise<Result<void>> {
    try {
      logger.info("Cancelling invitation", { invitationId });

      const response = await fetch(`/api/admin/invitations/${invitationId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to cancel invitation");
      }

      logger.info("Invitation cancelled successfully", { invitationId });

      return { success: true, data: undefined };
    } catch (error) {
      logger.error("Failed to cancel invitation", error, { invitationId });
      return {
        success: false,
        error: `Failed to cancel invitation: ${(error as Error).message}`,
      };
    }
  }
}

