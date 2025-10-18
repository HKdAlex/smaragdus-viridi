import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase";

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profileError || userProfile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { order_ids, new_status } = body;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "order_ids array is required",
        },
        { status: 400 }
      );
    }

    if (!new_status) {
      return NextResponse.json(
        {
          success: false,
          error: "new_status is required",
        },
        { status: 400 }
      );
    }

    // Update multiple orders
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: new_status,
        updated_at: new Date().toISOString(),
      })
      .in("id", order_ids);

    if (updateError) {
      console.error("Failed to bulk update orders", updateError);
      throw updateError;
    }

    // Fetch the updated orders with user details
    const { data: orders, error } = await supabase
      .from("orders_with_user_details")
      .select(
        `
        id,
        user_id,
        status,
        total_amount,
        currency_code,
        delivery_address,
        payment_type,
        notes,
        created_at,
        updated_at,
        profile_id,
        name,
        phone,
        role,
        discount_percentage,
        preferred_currency,
        email
      `
      )
      .in("id", order_ids);

    if (error) {
      console.error("Failed to bulk update orders", error);
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
        created_at: order.created_at,
        updated_at: order.updated_at,
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

    return NextResponse.json({
      success: true,
      data: {
        updated_count: transformedOrders.length,
        orders: transformedOrders,
      },
    });
  } catch (error) {
    console.error("Failed to bulk update orders", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to bulk update orders: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
