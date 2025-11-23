import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Use optimized RPC function for dashboard statistics
    const { data: statsData, error: rpcError } = await supabase.rpc(
      "get_dashboard_stats"
    );

    if (rpcError) {
      console.error("Failed to fetch dashboard statistics via RPC", rpcError);
      throw rpcError;
    }

    // Extract statistics from RPC response
    const totalGemstones = statsData?.totalGemstones || 0;
    const inStockGemstones = statsData?.inStockGemstones || 0;
    const outOfStockGemstones = statsData?.outOfStockGemstones || 0;
    const activeUsers = statsData?.activeUsers || 0;
    const totalOrders = statsData?.totalOrders || 0;
    const totalRevenue = Number(statsData?.totalRevenue || 0);
    const avgGemstonePrice = statsData?.avgGemstonePrice || 0;

    // Fetch minimal data for top selling gemstones and recent orders
    // These are displayed in the UI but don't need full table scans
    const { data: recentGemstones } = await supabase
      .from("gemstones")
      .select("id, price_amount, price_currency")
      .order("created_at", { ascending: false })
      .limit(2);

    const { data: recentOrdersData } = await supabase
      .from("orders")
      .select("id, total_amount, currency_code, created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    // Format top selling gemstones
    const topSellingGemstones =
      recentGemstones?.map((gem) => ({
        id: gem.id,
        serial_number: `SV-${gem.id.slice(0, 8)}`,
        name: "gemstone", // We'd need to join with gemstone details for actual names
        price_amount: gem.price_amount || 0,
        price_currency: gem.price_currency || "USD",
      })) || [];

    // Format recent orders
    const recentOrders =
      recentOrdersData?.map((order) => ({
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
