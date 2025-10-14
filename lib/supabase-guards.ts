import { supabaseAdmin } from "@/lib/supabase";

export function ensureSupabaseAdminConnection() {
  if (!supabaseAdmin) {
    throw new Error("Database connection failed");
  }
  return supabaseAdmin;
}
