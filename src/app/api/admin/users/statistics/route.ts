import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/shared/types/database";
import { createClient } from "@supabase/supabase-js";
import { AdminAuthError, requireAdmin } from "@/app/api/admin/_utils/require-admin";
import type { UserStatistics } from "@/features/admin/types/user-management.types";

// Server-side admin client
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// GET /api/admin/users/statistics - Get user statistics
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const adminClient = getAdminClient();

    // Call database function for optimized stats
    const { data: stats, error } = await adminClient.rpc("get_user_statistics");

    if (error || !stats) {
      // Fallback to manual query if function doesn't exist
      const [
        { count: totalUsers },
        { count: premiumUsers },
        { count: admins },
        { count: regularCustomers },
      ] = await Promise.all([
        adminClient.from("user_profiles").select("*", { count: "exact", head: true }),
        adminClient
          .from("user_profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "premium_customer"),
        adminClient
          .from("user_profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin"),
        adminClient
          .from("user_profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "regular_customer"),
      ]);

      // Get active users (not banned)
      const { data: authUsers } = await adminClient.auth.admin.listUsers();
      const activeUsers = authUsers.users.filter(
        (u) => !(u as any).banned_until || new Date((u as any).banned_until) < new Date()
      ).length;

      // Get new users this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsersThisMonth } = await adminClient
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString());

      const statistics: UserStatistics = {
        totalUsers: totalUsers || 0,
        activeUsers,
        premiumUsers: premiumUsers || 0,
        admins: admins || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        regularCustomers: regularCustomers || 0,
      };

      return NextResponse.json({
        success: true,
        data: statistics,
      });
    }

    // Type assertion for RPC result
    const statistics = stats as unknown as UserStatistics;
    
    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("Failed to fetch user statistics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

