import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  GetActivityHistoryRequest,
  GetActivityHistoryResponse,
  GetOrderHistoryRequest,
  GetOrderHistoryResponse,
  ProfileStats,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UserOrder,
  UserProfile,
} from "../types/user-profile.types";

import type { SupabaseClient } from "@supabase/supabase-js";
import { UserProfileError } from "../types/user-profile.types";
import { createContextLogger } from "@/shared/utils/logger";
import { supabase } from "@/lib/supabase";

export class UserProfileService {
  private supabase: SupabaseClient<any>;
  private logger = createContextLogger("user-profile-service");

  constructor(supabaseClient?: SupabaseClient<any>) {
    this.supabase = supabaseClient || supabase;
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data: profile, error } = await this.supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          this.logger.warn("Profile not found", { userId });
          return null;
        }
        throw new UserProfileError(
          "PROFILE_NOT_FOUND",
          "Failed to load profile"
        );
      }

      this.logger.info("Profile loaded successfully", { userId });
      return profile as UserProfile;
    } catch (error) {
      this.logger.error("Failed to get profile", error as Error, { userId });
      throw error;
    }
  }

  /**
   * Create user profile
   */
  async createProfile(
    userId: string,
    profileData: Partial<UpdateProfileRequest>
  ): Promise<UpdateProfileResponse> {
    try {
      const { data: profile, error } = await this.supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          name: profileData.name || "User",
          phone: profileData.phone || "",
          preferred_currency: profileData.preferred_currency || "USD",
          language_preference: profileData.language_preference || "en",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        this.logger.error("Failed to create profile", error, {
          userId,
          profileData,
        });
        throw new UserProfileError("CREATE_FAILED", "Failed to create profile");
      }

      // Log the profile creation activity
      await this.logActivity(
        userId,
        "profile_created",
        "Profile created successfully",
        { profileData }
      );

      this.logger.info("Profile created successfully", { userId });
      return { success: true, profile: profile as UserProfile };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to create profile", error as Error, { userId });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: UpdateProfileRequest
  ): Promise<UpdateProfileResponse> {
    try {
      const { data: profile, error } = await this.supabase
        .from("user_profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        this.logger.error("Failed to update profile", error, {
          userId,
          updates,
        });
        throw new UserProfileError("UPDATE_FAILED", "Failed to update profile");
      }

      // Log the profile update activity
      await this.logActivity(
        userId,
        "profile_updated",
        "Profile information updated",
        { updates }
      );

      this.logger.info("Profile updated successfully", { userId });
      return { success: true, profile: profile as UserProfile };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to update profile", error as Error, { userId });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    request: ChangePasswordRequest
  ): Promise<ChangePasswordResponse> {
    try {
      const { current_password, new_password, confirm_password } = request;

      // Validate passwords match
      if (new_password !== confirm_password) {
        return { success: false, error: "New passwords do not match" };
      }

      // Validate password strength
      if (new_password.length < 8) {
        return {
          success: false,
          error: "Password must be at least 8 characters long",
        };
      }

      // Update password using Supabase Auth
      const { error } = await this.supabase.auth.updateUser({
        password: new_password,
      });

      if (error) {
        this.logger.error("Failed to change password", error, { userId });
        return { success: false, error: "Failed to change password" };
      }

      // Log the password change activity
      await this.logActivity(
        userId,
        "password_changed",
        "Password changed successfully"
      );

      this.logger.info("Password changed successfully", { userId });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to change password", error as Error, {
        userId,
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get user order history
   */
  async getOrderHistory(
    userId: string,
    request: GetOrderHistoryRequest = {}
  ): Promise<GetOrderHistoryResponse> {
    try {
      const { page = 1, limit = 10, status, date_from, date_to } = request;

      const offset = (page - 1) * limit;

      let query = this.supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            *,
            gemstones (
              id,
              name,
              color,
              cut,
              weight_carats,
              serial_number
            )
          )
        `,
          { count: "exact" }
        )
        .eq("user_id", userId);

      // Apply filters
      if (status && status.length > 0) {
        query = query.in("status", status);
      }

      if (date_from) {
        query = query.gte("created_at", date_from);
      }

      if (date_to) {
        query = query.lte("created_at", date_to);
      }

      // Apply sorting and pagination
      query = query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: orders, error, count } = await query;

      if (error) {
        this.logger.error("Failed to get order history", error, {
          userId,
          request,
        });
        throw new UserProfileError(
          "UPDATE_FAILED",
          "Failed to load order history"
        );
      }

      const total = count || 0;
      const hasMore = total > offset + limit;

      // Map DB response to strict UserOrder shape
      const mappedOrders: UserOrder[] =
        (orders as any[] | null | undefined)?.map((order) => {
          const rawItems: any[] = Array.isArray(order?.order_items)
            ? order.order_items
            : [];

          const items = rawItems.map((item) => {
            const g = item?.gemstones || {};
            const quantity =
              typeof item?.quantity === "number" ? item.quantity : 1;

            return {
              id: String(item?.id ?? ""),
              gemstone: {
                id: String(g?.id ?? ""),
                name: String(g?.name ?? ""),
                color: String(g?.color ?? ""),
                cut: String(g?.cut ?? ""),
                weight_carats: Number(g?.weight_carats ?? 0),
                serial_number: String(g?.serial_number ?? ""),
              },
              quantity,
              unit_price: Number(item?.unit_price ?? 0),
              line_total:
                Number(item?.line_total ?? 0) ||
                Number(item?.unit_price ?? 0) * quantity,
            };
          });

          return {
            id: String(order?.id ?? ""),
            status: (order?.status ?? "pending") as UserOrder["status"],
            total_amount: Number(order?.total_amount ?? 0),
            currency_code: String(order?.currency_code ?? "USD"),
            created_at: String(order?.created_at ?? new Date().toISOString()),
            updated_at: String(
              order?.updated_at ?? order?.created_at ?? new Date().toISOString()
            ),
            items,
            delivery_address: (order?.delivery_address as any) || undefined,
          };
        }) || [];

      this.logger.info("Order history loaded successfully", {
        userId,
        total,
        page,
        limit,
        hasMore,
      });

      return {
        success: true,
        orders: mappedOrders,
        total,
        page,
        limit,
        hasMore,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Failed to get order history", error as Error, {
        userId,
        request,
      });
      return {
        success: false,
        error: errorMessage,
        orders: [],
        total: 0,
        page: 1,
        limit: 10,
        hasMore: false,
      };
    }
  }

  /**
   * Get user activity history
   */
  async getActivityHistory(
    userId: string,
    request: GetActivityHistoryRequest = {}
  ): Promise<GetActivityHistoryResponse> {
    // TODO: Implement activity history when user_activities table is created
    this.logger.info("Activity history requested but not yet implemented", {
      userId,
    });

    return {
      success: true,
      activities: [],
      total: 0,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  }

  /**
   * Get user profile statistics
   */
  async getProfileStats(userId: string): Promise<ProfileStats> {
    try {
      // Get order statistics
      const { data: orderStats, error: orderError } = await this.supabase
        .from("orders")
        .select("total_amount, created_at")
        .eq("user_id", userId)
        .eq("status", "delivered");

      if (orderError) {
        this.logger.error("Failed to get order stats", orderError, { userId });
      }

      const totalOrders = orderStats?.length || 0;
      const totalSpent =
        orderStats?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      // Get user creation date
      const { data: userProfile, error: profileError } = await this.supabase
        .from("user_profiles")
        .select("created_at")
        .eq("user_id", userId)
        .single();

      const memberSince = userProfile?.created_at || new Date().toISOString();

      // Get favorites count
      const { count: favoriteCount, error: favoriteError } = await this.supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Get cart items count
      const { count: cartCount, error: cartError } = await this.supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      this.logger.info("Profile stats calculated", {
        userId,
        totalOrders,
        totalSpent,
        favoriteCount: favoriteCount || 0,
        cartCount: cartCount || 0,
      });

      return {
        totalOrders,
        totalSpent,
        averageOrderValue,
        memberSince,
        favoriteGemstones: favoriteCount || 0,
        cartItems: cartCount || 0,
      };
    } catch (error) {
      this.logger.error("Failed to get profile stats", error as Error, {
        userId,
      });
      // Return default stats on error
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        memberSince: new Date().toISOString(),
        favoriteGemstones: 0,
        cartItems: 0,
      };
    }
  }

  /**
   * Log user activity
   */
  private async logActivity(
    userId: string,
    type: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // TODO: Implement activity logging when user_activities table is created
    this.logger.debug("Activity logged (not persisted)", {
      userId,
      type,
      description,
    });
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();
