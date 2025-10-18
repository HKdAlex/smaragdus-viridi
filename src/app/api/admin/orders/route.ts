import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase";
import type { Database } from "@/shared/types/database";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = searchParams.get("sort_order") || "desc";
    const statusParam = searchParams.get("status");
    const userId = searchParams.get("user_id");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    // Build query using the view that includes user details and order items
    let query = supabase.from("orders_with_user_details").select(
      `
        id,
        user_id,
        status,
        total_amount,
        currency_code,
        delivery_address,
        payment_type,
        notes,
        order_number,
        created_at,
        updated_at,
        profile_id,
        name,
        phone,
        role,
        discount_percentage,
        preferred_currency,
        email,
        order_items (
          id,
          gemstone_id,
          quantity,
          unit_price,
          line_total
        )
      `,
      { count: "exact" }
    );

    // Apply filters
    if (statusParam) {
      type OrderStatus = NonNullable<
        Database["public"]["Enums"]["order_status"]
      >;
      const allowed: OrderStatus[] = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ];
      if ((allowed as readonly string[]).includes(statusParam)) {
        query = query.eq("status", statusParam as OrderStatus);
      }
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error("Failed to fetch orders", error);
      throw error;
    }

    // Transform the data to match the expected format
    const transformedOrders =
      orders?.map((order) => ({
        id: order.id,
        user_id: order.user_id,
        status: order.status,
        total_amount: order.total_amount,
        currency_code: order.currency_code,
        delivery_address: order.delivery_address,
        payment_type: order.payment_type,
        notes: order.notes,
        order_number: order.order_number,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: order.order_items || [],
        user: {
          id: order.profile_id,
          user_id: order.user_id,
          name: order.name || "Unknown User",
          phone: order.phone,
          email: order.email,
          role: order.role,
          discount_percentage: order.discount_percentage,
          preferred_currency: order.preferred_currency,
        },
      })) || [];

    const total = count || 0;
    const hasMore = from + limit < total;

    return NextResponse.json({
      success: true,
      data: {
        orders: transformedOrders,
        total,
        page,
        limit,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Failed to fetch orders", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch orders: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
