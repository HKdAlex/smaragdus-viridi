import type { DatabaseUserProfile, UserRole } from "@/shared/types";

import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface AdminUser extends DatabaseUserProfile {
  role: "admin";
}

export interface AuthResult {
  success: boolean;
  user?: User;
  profile?: DatabaseUserProfile;
  error?: string;
}

export const auth = {
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) throw error;

    // Profile will be created automatically by database trigger when user confirms email
    console.log("User account created successfully:", data.user?.email);
    console.log(
      "Please check your email and click the confirmation link to complete registration."
    );

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  async getUserProfile(userId: string): Promise<DatabaseUserProfile | null> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If profile doesn't exist, return null instead of throwing
      if (error.code === "PGRST116") {
        console.log("User profile not found, will create on demand");
        return null;
      }
      console.error("Failed to fetch user profile:", error);
      return null;
    }
    return data;
  },

  async updateUserProfile(
    userId: string,
    updates: Partial<
      Pick<DatabaseUserProfile, "name" | "phone" | "preferred_currency">
    >
  ): Promise<DatabaseUserProfile | null> {
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update user profile:", error);
      return null;
    }
    return data;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) throw error;
  },

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
  },

  // Admin-specific methods
  async isAdmin(userId: string, profile?: DatabaseUserProfile): Promise<boolean> {
    // If profile is already provided, use it to avoid redundant database call
    if (profile) {
      return profile.role === "admin";
    }
    // Otherwise, fetch the profile (backward compatibility)
    const fetchedProfile = await this.getUserProfile(userId);
    return fetchedProfile?.role === "admin";
  },

  async getAdminUsers(): Promise<DatabaseUserProfile[]> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch admin users:", error);
      return [];
    }
    return data || [];
  },

  async promoteToAdmin(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("user_profiles")
      .update({
        role: "admin",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to promote user to admin:", error);
      return false;
    }
    return true;
  },

  async demoteFromAdmin(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("user_profiles")
      .update({
        role: "regular_customer",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to demote admin:", error);
      return false;
    }
    return true;
  },

  async createAdminUser(
    email: string,
    password: string,
    name: string
  ): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: "admin", // This will be set by the database trigger
          },
        },
      });

      if (error) throw error;

      // Wait a moment for the profile to be created by the trigger
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const profile = data.user
        ? await this.getUserProfile(data.user.id)
        : null;

      return {
        success: true,
        user: data.user || undefined,
        profile: profile || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create admin user",
      };
    }
  },

  async getAllUsers(): Promise<DatabaseUserProfile[]> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch all users:", error);
      return [];
    }
    return data || [];
  },

  async updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    const { error } = await supabase
      .from("user_profiles")
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to update user role:", error);
      return false;
    }
    return true;
  },
};
