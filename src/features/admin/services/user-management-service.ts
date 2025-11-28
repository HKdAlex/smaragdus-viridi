"use client";

/**
 * User Management Service (SRP: User Data Operations)
 *
 * SSOT for user management operations.
 * Handles all user CRUD operations via API routes.
 */

import type {
  UserListRequest,
  UserListResponse,
  UserWithAuth,
  CreateUserRequest,
  UpdateUserRequest,
  BulkUserOperation,
  BulkOperationResult,
  UserStatistics,
  UserFilters,
} from "../types/user-management.types";

// Simple logger for user management service
const logger = {
  info: (message: string, data?: unknown) =>
    console.log(`[USER-MGMT INFO] ${message}`, data),
  error: (message: string, error?: unknown, data?: unknown) =>
    console.error(`[USER-MGMT ERROR] ${message}`, error, data),
  warn: (message: string, data?: unknown) =>
    console.warn(`[USER-MGMT WARN] ${message}`, data),
};

type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

export class UserManagementService {
  /**
   * Get paginated list of users with filtering
   */
  static async getUsers(
    request: UserListRequest
  ): Promise<Result<UserListResponse>> {
    try {
      logger.info("Fetching users", { request });

      const searchParams = new URLSearchParams();
      searchParams.set("page", String(request.page || 1));
      searchParams.set("limit", String(request.limit || 20));
      searchParams.set("sort_by", request.sort_by || "created_at");
      searchParams.set("sort_order", request.sort_order || "desc");

      if (request.filters) {
        if (request.filters.search) {
          searchParams.set("search", request.filters.search);
        }
        if (request.filters.role?.length) {
          searchParams.set("role", request.filters.role.join(","));
        }
        if (request.filters.is_active !== undefined) {
          searchParams.set("is_active", String(request.filters.is_active));
        }
        if (request.filters.registered_from) {
          searchParams.set("registered_from", request.filters.registered_from);
        }
        if (request.filters.registered_to) {
          searchParams.set("registered_to", request.filters.registered_to);
        }
        if (request.filters.has_orders !== undefined) {
          searchParams.set("has_orders", String(request.filters.has_orders));
        }
      }

      const response = await fetch(`/api/admin/users?${searchParams.toString()}`, {
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
        throw new Error(result.error || "Failed to fetch users");
      }

      logger.info("Users fetched successfully", {
        count: result.data.users.length,
        total: result.data.total,
      });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to fetch users", error);
      return {
        success: false,
        error: `Failed to fetch users: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get single user by ID
   */
  static async getUserById(userId: string): Promise<Result<UserWithAuth>> {
    try {
      logger.info("Fetching user", { userId });

      const response = await fetch(`/api/admin/users/${userId}`, {
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
        throw new Error(result.error || "Failed to fetch user");
      }

      logger.info("User fetched successfully", { userId });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to fetch user", error, { userId });
      return {
        success: false,
        error: `Failed to fetch user: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Create new user
   */
  static async createUser(
    data: CreateUserRequest
  ): Promise<Result<UserWithAuth>> {
    try {
      logger.info("Creating user", { email: data.email });

      const response = await fetch("/api/admin/users", {
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
        throw new Error(result.error || "Failed to create user");
      }

      logger.info("User created successfully", { userId: result.data.id });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to create user", error, { email: data.email });
      return {
        success: false,
        error: `Failed to create user: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(
    userId: string,
    data: UpdateUserRequest
  ): Promise<Result<UserWithAuth>> {
    try {
      logger.info("Updating user", { userId, updates: Object.keys(data) });

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
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
        throw new Error(result.error || "Failed to update user");
      }

      logger.info("User updated successfully", { userId });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to update user", error, { userId });
      return {
        success: false,
        error: `Failed to update user: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<Result<void>> {
    try {
      logger.info("Deleting user", { userId });

      const response = await fetch(`/api/admin/users/${userId}`, {
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
        throw new Error(result.error || "Failed to delete user");
      }

      logger.info("User deleted successfully", { userId });

      return { success: true, data: undefined };
    } catch (error) {
      logger.error("Failed to delete user", error, { userId });
      return {
        success: false,
        error: `Failed to delete user: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Perform bulk operation on users
   */
  static async bulkOperation(
    operation: BulkUserOperation
  ): Promise<Result<BulkOperationResult>> {
    try {
      logger.info("Performing bulk operation", {
        operation: operation.operation,
        count: operation.user_ids.length,
      });

      const response = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(operation),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to perform bulk operation");
      }

      logger.info("Bulk operation completed", {
        success: result.data.success,
        failed: result.data.failed,
      });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to perform bulk operation", error);
      return {
        success: false,
        error: `Failed to perform bulk operation: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics(): Promise<Result<UserStatistics>> {
    try {
      logger.info("Fetching user statistics");

      const response = await fetch("/api/admin/users/statistics", {
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
        throw new Error(result.error || "Failed to fetch statistics");
      }

      logger.info("User statistics fetched successfully");

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Failed to fetch user statistics", error);
      return {
        success: false,
        error: `Failed to fetch statistics: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Export users to CSV
   */
  static async exportUsers(filters?: UserFilters): Promise<Result<Blob>> {
    try {
      logger.info("Exporting users", { filters });

      const searchParams = new URLSearchParams();
      if (filters) {
        if (filters.search) searchParams.set("search", filters.search);
        if (filters.role?.length) {
          searchParams.set("role", filters.role.join(","));
        }
        if (filters.is_active !== undefined) {
          searchParams.set("is_active", String(filters.is_active));
        }
        if (filters.registered_from) {
          searchParams.set("registered_from", filters.registered_from);
        }
        if (filters.registered_to) {
          searchParams.set("registered_to", filters.registered_to);
        }
        if (filters.has_orders !== undefined) {
          searchParams.set("has_orders", String(filters.has_orders));
        }
      }

      const response = await fetch(
        `/api/admin/users/export?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      logger.info("Users exported successfully");

      return { success: true, data: blob };
    } catch (error) {
      logger.error("Failed to export users", error);
      return {
        success: false,
        error: `Failed to export users: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Reset user password (sends reset email)
   */
  static async resetPassword(userId: string): Promise<Result<void>> {
    try {
      logger.info("Resetting password", { userId });

      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
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
        throw new Error(result.error || "Failed to reset password");
      }

      logger.info("Password reset email sent", { userId });

      return { success: true, data: undefined };
    } catch (error) {
      logger.error("Failed to reset password", error, { userId });
      return {
        success: false,
        error: `Failed to reset password: ${(error as Error).message}`,
      };
    }
  }
}

