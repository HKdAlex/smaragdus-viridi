"use client";

/**
 * User Audit Service (SRP: Audit Log Operations)
 *
 * Handles audit log operations for user management actions.
 */

import type { AuditLogEntry } from "../types/user-management.types";

// Simple logger for audit service
const logger = {
  info: (message: string, data?: unknown) =>
    console.log(`[USER-AUDIT INFO] ${message}`, data),
  error: (message: string, error?: unknown, data?: unknown) =>
    console.error(`[USER-AUDIT ERROR] ${message}`, error, data),
};

type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

export class UserAuditService {
  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(params?: {
    target_user_id?: string;
    action?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ logs: AuditLogEntry[]; total: number }>> {
    try {
      logger.info("Fetching audit logs", { params });

      const searchParams = new URLSearchParams();
      if (params?.target_user_id) {
        searchParams.set("target_user_id", params.target_user_id);
      }
      if (params?.action) {
        searchParams.set("action", params.action);
      }
      if (params?.page) {
        searchParams.set("page", String(params.page));
      }
      if (params?.limit) {
        searchParams.set("limit", String(params.limit));
      }

      const url = `/api/admin/users/audit-logs${
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
        throw new Error(result.error || "Failed to fetch audit logs");
      }

      logger.info("Audit logs fetched successfully", {
        count: result.data.logs.length,
      });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to fetch audit logs", error);
      return {
        success: false,
        error: `Failed to fetch audit logs: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get audit logs for a specific user
   */
  static async getAuditLogsForUser(
    userId: string,
    page?: number,
    limit?: number
  ): Promise<Result<{ logs: AuditLogEntry[]; total: number }>> {
    return this.getAuditLogs({
      target_user_id: userId,
      page,
      limit,
    });
  }

  /**
   * Get audit logs for a specific user (via user detail endpoint)
   */
  static async getUserAuditLogs(
    userId: string
  ): Promise<Result<AuditLogEntry[]>> {
    try {
      logger.info("Fetching user audit logs", { userId });

      const response = await fetch(`/api/admin/users/${userId}/audit-logs`, {
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
        throw new Error(result.error || "Failed to fetch user audit logs");
      }

      logger.info("User audit logs fetched successfully", {
        userId,
        count: result.data.length,
      });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to fetch user audit logs", error, { userId });
      return {
        success: false,
        error: `Failed to fetch user audit logs: ${(error as Error).message}`,
      };
    }
  }
}

