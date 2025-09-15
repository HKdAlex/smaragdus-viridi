import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get real gemstone statistics with count
    const {
      data: gemstones,
      error: gemstonesError,
      count: totalGemstonesCount,
    } = await supabase
      .from("gemstones")
      .select("id, price_amount, price_currency, in_stock, created_at", {
        count: "exact",
      });

    if (gemstonesError) {
      console.error("Failed to fetch gemstones", gemstonesError);
      throw gemstonesError;
    }

    // Get real user statistics with count
    const {
      data: userProfiles,
      error: usersError,
      count: totalUsersCount,
    } = await supabase
      .from("user_profiles")
      .select("id, created_at", { count: "exact" });

    if (usersError) {
      console.error("Failed to fetch user profiles", usersError);
      throw usersError;
    }

    // Get real order statistics with count
    const {
      data: orders,
      error: ordersError,
      count: totalOrdersCount,
    } = await supabase
      .from("orders")
      .select("id, total_amount, currency_code, created_at", {
        count: "exact",
      });

    if (ordersError) {
      console.error("Failed to fetch orders", ordersError);
      throw ordersError;
    }

    // Calculate real statistics
    const totalGemstones = totalGemstonesCount || 0;
    const inStockGemstones = gemstones?.filter((g) => g.in_stock).length || 0;
    const outOfStockGemstones = totalGemstones - inStockGemstones;
    const activeUsers = totalUsersCount || 0;
    const totalOrders = totalOrdersCount || 0;

    // Calculate total revenue
    const totalRevenue =
      orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    // Calculate average gemstone price
    const totalGemstoneValue =
      gemstones?.reduce((sum, gem) => sum + (gem.price_amount || 0), 0) || 0;
    const avgGemstonePrice =
      totalGemstones > 0 ? Math.round(totalGemstoneValue / totalGemstones) : 0;

    // Get top selling gemstones (for now, just get some recent ones)
    const topSellingGemstones =
      gemstones?.slice(0, 2).map((gem) => ({
        id: gem.id,
        serial_number: `SV-${gem.id.slice(0, 8)}`,
        name: "gemstone", // We'd need to join with gemstone details for actual names
        price_amount: gem.price_amount || 0,
        price_currency: gem.price_currency || "USD",
      })) || [];

    // Get recent orders
    const recentOrders =
      orders?.slice(0, 1).map((order) => ({
        id: order.id,
        user_id: "user-1", // We'd need to join for actual user info
        total_amount: order.total_amount || 0,
        currency_code: order.currency_code || "USD",
        created_at: order.created_at || new Date().toISOString(),
      })) || [];

    const realStats = {
      totalGemstones,
      activeUsers,
      totalRevenue,
      totalOrders,
      inStockGemstones,
      outOfStockGemstones,
      avgGemstonePrice,
      topSellingGemstones,
      recentOrders,
    };

    // Calculate changes (for now, using simple mock changes since we don't have historical data)
    const changes = {
      totalGemstones: {
        value: Math.floor(totalGemstones * 0.1),
        percentage: 10,
        trend: "up" as const,
      },
      activeUsers: {
        value: Math.floor(activeUsers * 0.05),
        percentage: 5,
        trend: "up" as const,
      },
      totalRevenue: {
        value: Math.floor(totalRevenue * 0.15),
        percentage: 15,
        trend: "up" as const,
      },
      totalOrders: {
        value: Math.floor(totalOrders * 0.2),
        percentage: 20,
        trend: "up" as const,
      },
    };

    const result = {
      ...realStats,
      changes,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to fetch dashboard statistics", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch statistics: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
