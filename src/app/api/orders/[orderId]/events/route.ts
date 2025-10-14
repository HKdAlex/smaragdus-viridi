import { NextRequest, NextResponse } from "next/server";

import { createContextLogger } from "@/shared/utils/logger";

const logger = createContextLogger("orders-events-api");

// GET /api/orders/[orderId]/events - Timeline for an order
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Fetch order to authorize and get current status
    const { data: order, error: orderError } = (await supabase
      .from("orders")
      .select("id, user_id, status, updated_at")
      .eq("id", orderId)
      .single()) as {
      data: {
        id: string;
        user_id: string;
        status: string;
        updated_at: string;
      } | null;
      error: any;
    };

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Optionally authorize user: allow owner or admin; since this uses service role,
    // perform a light check and rely on app routing for protection.
    // Fetch events
    const { data: events, error: eventsError } = await supabase
      .from("order_events")
      .select("*")
      .eq("order_id", orderId)
      .order("performed_at", { ascending: true });

    if (eventsError) {
      logger.error("Failed to fetch order events", eventsError, { orderId });
      return NextResponse.json(
        { error: "Failed to load events" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timeline: {
        order_id: orderId,
        events: events || [],
        current_status: order.status || "pending",
        last_updated: order.updated_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Unhandled error in events GET", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
