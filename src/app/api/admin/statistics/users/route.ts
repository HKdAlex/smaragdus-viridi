import { ERROR_CODES, LocalizedError } from "@/shared/constants/error-codes";
import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new LocalizedError(ERROR_CODES.SERVICE_ROLE_KEY_NOT_AVAILABLE);
    }

    const supabase = supabaseAdmin;

    // Get user profiles with count
    const {
      data: userProfiles,
      error: usersError,
      count: totalUsersCount,
    } = await supabase
      .from("user_profiles")
      .select("id, role, created_at", { count: "exact" });

    if (usersError) {
      console.error("Failed to fetch user profiles", usersError);
      throw usersError;
    }

    // Get orders for user activity calculation with count
    const {
      data: orders,
      error: ordersError,
      count: totalOrdersCount,
    } = await supabase
      .from("orders")
      .select("id, user_id, created_at", { count: "exact" });

    if (ordersError) {
      console.error("Failed to fetch orders", ordersError);
      throw ordersError;
    }

    // Calculate real statistics
    const totalUsers = totalUsersCount || 0;
    const activeUsers = totalUsers; // For now, consider all users as active
    const premiumUsers =
      userProfiles?.filter((u) => u.role === "premium_customer").length || 0;
    const admins = userProfiles?.filter((u) => u.role === "admin").length || 0;

    // Calculate new users this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth =
      userProfiles?.filter((u) => new Date(u.created_at || "") >= thisMonth)
        .length || 0;

    // Calculate average orders per user
    const totalOrders = totalOrdersCount || 0;
    const averageOrdersPerUser =
      totalUsers > 0 ? Math.round((totalOrders / totalUsers) * 10) / 10 : 0;

    // Mock retention rate for now (would need historical data)
    const userRetentionRate = 85.0;

    const stats = {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      premiumUsers,
      admins,
      userRetentionRate,
      averageOrdersPerUser,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Failed to fetch user activity statistics", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch user statistics: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
