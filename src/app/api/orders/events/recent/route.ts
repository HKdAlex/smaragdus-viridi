import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/orders/events/recent?limit=50
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || "50");

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("order_events")
      .select("*")
      .order("performed_at", { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 200));

    if (error) {
      return NextResponse.json(
        { error: "Failed to load recent events" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, events: data || [] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
