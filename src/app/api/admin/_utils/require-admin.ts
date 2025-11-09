import type { Database } from "@/shared/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase";

export class AdminAuthError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface RequireAdminResult {
  supabase: SupabaseClient<Database, "public">;
  userId: string;
}

/**
 * Ensures the incoming request belongs to an authenticated admin user.
 * Throws {@link AdminAuthError} with appropriate HTTP status when authentication fails.
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AdminAuthError("Authentication required", 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    throw new AdminAuthError("Admin access required", 403);
  }

  return { supabase, userId: user.id };
}
