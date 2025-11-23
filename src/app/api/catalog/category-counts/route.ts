import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/catalog/category-counts
 *
 * Returns accurate counts of gemstones by category (name).
 * Uses optimized database function with GROUP BY for efficient aggregation.
 *
 * Filtering logic matches catalog:
 * - price_amount > 0
 * - primary_image_url IS NOT NULL
 * - in_stock = true
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Use optimized database function with GROUP BY for accurate counts
    // This avoids Supabase max_rows limit and improves performance
    const { data, error } = await supabaseAdmin.rpc(
      "get_catalog_category_counts"
    );

    if (error) {
      console.error("❌ [CategoryCountsAPI] RPC error:", error);
      return NextResponse.json(
        { error: `Failed to fetch category counts: ${error.message}` },
        { status: 500 }
      );
    }

    // Return counts from optimized database function
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ [CategoryCountsAPI] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
