import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    console.log("Order status update request for orderId:", orderId);
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

    if (profileError || !userProfile || userProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { new_status } = body;

    if (!new_status) {
      return NextResponse.json(
        {
          success: false,
          error: "new_status is required",
        },
        { status: 400 }
      );
    }

    // Update the order status
    console.log("Updating order status:", { orderId, new_status });
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: new_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order status", updateError);
      throw updateError;
    }

    // Fetch the updated order with user details
    const { data: order, error } = await supabase
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
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Failed to update order status", error);
      throw error;
    }

    // Transform the data to match the expected format
    const transformedOrder = {
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
    };

    return NextResponse.json({
      success: true,
      data: { order: transformedOrder },
    });
  } catch (error) {
    console.error("Failed to update order status", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update order status: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
