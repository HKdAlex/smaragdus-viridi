import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get all gemstones with their properties and count
    const {
      data: gemstones,
      error,
      count: totalCount,
    } = await supabase
      .from("gemstones")
      .select("id, name, color, cut, price_amount, in_stock", {
        count: "exact",
      });

    if (error) {
      console.error("Failed to fetch gemstones", error);
      throw error;
    }

    // Calculate real statistics
    const total = totalCount || 0;
    const inStock = gemstones?.filter((g) => g.in_stock).length || 0;
    const outOfStock = total - inStock;

    // Calculate by type
    const byType: Record<string, number> = {};
    gemstones?.forEach((gem) => {
      const type = gem.name || "unknown";
      byType[type] = (byType[type] || 0) + 1;
    });

    // Calculate by color
    const byColor: Record<string, number> = {};
    gemstones?.forEach((gem) => {
      const color = gem.color || "unknown";
      byColor[color] = (byColor[color] || 0) + 1;
    });

    // Calculate by cut
    const byCut: Record<string, number> = {};
    gemstones?.forEach((gem) => {
      const cut = gem.cut || "unknown";
      byCut[cut] = (byCut[cut] || 0) + 1;
    });

    // Calculate average price and total value
    const totalValue =
      gemstones?.reduce((sum, gem) => sum + (gem.price_amount || 0), 0) || 0;
    const averagePrice = total > 0 ? Math.round(totalValue / total) : 0;

    const stats = {
      total,
      inStock,
      outOfStock,
      byType,
      byColor,
      byCut,
      averagePrice,
      totalValue,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Failed to fetch gemstone statistics", error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch gemstone statistics: ${
          (error as Error).message
        }`,
      },
      { status: 500 }
    );
  }
}
