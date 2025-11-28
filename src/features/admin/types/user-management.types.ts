import type { Database } from "@/shared/types/database";
import type { UserRole, CurrencyCode } from "@/shared/types";

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type UserProfileInsert =
  Database["public"]["Tables"]["user_profiles"]["Insert"];
export type UserProfileUpdate =
  Database["public"]["Tables"]["user_profiles"]["Update"];

export interface UserWithAuth extends UserProfile {
  auth_email: string;
  auth_created_at: string;
  auth_last_sign_in: string | null;
  is_active: boolean;
}

export interface UserFilters {
  search?: string; // Search by name, email, phone
  role?: UserRole[];
  is_active?: boolean;
  registered_from?: string; // ISO date
  registered_to?: string; // ISO date
  has_orders?: boolean;
}

export interface UserListRequest {
  page?: number;
  limit?: number;
  filters?: UserFilters;
  sort_by?: "name" | "email" | "created_at" | "role";
  sort_order?: "asc" | "desc";
}

export interface UserListResponse {
  users: UserWithAuth[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateUserRequest {
  email: string;
  password?: string; // Optional: if not provided, send invitation
  name: string;
  phone?: string;
  role: UserRole;
  preferred_currency?: CurrencyCode;
  send_invitation?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  email?: string;
  role?: UserRole;
  preferred_currency?: CurrencyCode;
  discount_percentage?: number;
  language_preference?: string;
}

export interface BulkUserOperation {
  user_ids: string[];
  operation: "role_change" | "activate" | "suspend" | "delete";
  role?: UserRole; // Required for role_change
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ user_id: string; error: string }>;
}

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  admin_name: string;
  target_user_id: string | null;
  target_user_name: string | null;
  action: string;
  changes: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  invited_by_name: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  admins: number;
  newUsersThisMonth: number;
  regularCustomers: number;
}

export interface CreateInvitationRequest {
  email: string;
  role: UserRole;
}

