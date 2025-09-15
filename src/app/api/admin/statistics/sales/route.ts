import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get orders with count
    const {
      data: orders,
      error: ordersError,
      count: totalOrdersCount,
    } = await supabase
      .from("orders")
      .select("id, total_amount, currency_code, created_at, user_id", {
        count: "exact",
      });

    if (ordersError) {
      console.error("Failed to fetch orders", ordersError);
      throw ordersError;
    }

    // Get order items for product analysis
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("id, order_id, gemstone_id, quantity, unit_price, line_total");

    if (itemsError) {
      console.error("Failed to fetch order items", itemsError);
      throw itemsError;
    }

    // Calculate real statistics
    const totalRevenue =
      orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const totalOrders = totalOrdersCount || 0;
    const averageOrderValue =
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Mock conversion rate for now (would need visitor data)
    const conversionRate = 2.5;

    // Get top products (for now, just some gemstones)
    const { data: gemstones } = await supabase
      .from("gemstones")
      .select("id, name, price_amount")
      .limit(2);

    const topProducts =
      gemstones?.map((gem) => ({
        id: gem.id,
        name: gem.name || "Unknown Gemstone",
        revenue: gem.price_amount || 0,
        orders: 1, // Mock for now
      })) || [];

    // Mock revenue by month for now (would need historical data)
    const revenueByMonth = [
      { month: "Jan", revenue: 0, orders: 0 },
      { month: "Feb", revenue: 0, orders: 0 },
      { month: "Mar", revenue: 0, orders: 0 },
      { month: "Apr", revenue: 0, orders: 0 },
      { month: "May", revenue: 0, orders: 0 },
      { month: "Jun", revenue: 0, orders: 0 },
    ];

    const stats = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      conversionRate,
      topProducts,
      revenueByMonth,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Failed to fetch sales statistics", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch sales statistics: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
