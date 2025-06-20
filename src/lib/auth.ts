import type { Database } from "@/shared/types/database";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
// eslint-disable-next-line no-restricted-syntax
export type UserRole = Database["public"]["Enums"]["user_role"];

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

    // Auto-create user profile if signup was successful
    if (data.user && !error) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: data.user.id,
          name: name,
          role: "regular_customer",
        });

      if (profileError) {
        console.error("Failed to create user profile:", profileError);
        // Don't throw here as the user account was created successfully
      }
    }

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

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch user profile:", error);
      return null;
    }
    return data;
  },

  async updateUserProfile(
    userId: string, 
    updates: Partial<Pick<UserProfile, "name" | "phone" | "preferred_currency">>
  ): Promise<UserProfile | null> {
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
}; 