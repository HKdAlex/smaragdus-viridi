import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const supabase = supabaseAdmin;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid gemstone ID format" },
        { status: 400 }
      );
    }

    console.log(`🔍 [GemstoneAPI] Fetching gemstone with ID: ${id}`);

    // Fetch gemstone with all related data (only items with price > 0)
    const { data: gemstone, error: gemstoneError } = await supabase
      .from("gemstones")
      .select(
        `
        *,
        origin:origins(*),
        images:gemstone_images(*),
        videos:gemstone_videos(*),
        certifications:certifications(*)
      `
      )
      .eq("id", id)
      .gt("price_amount", 0)
      .single();

    if (gemstoneError) {
      console.error("❌ [GemstoneAPI] Database error:", gemstoneError);
      if (gemstoneError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Gemstone not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch gemstone" },
        { status: 500 }
      );
    }

    // Fetch v6 text (if available) - only the fields used by the component
    const { data: v6Text, error: v6Error } = await supabase
      .from("gemstones_ai_v6")
      .select(`
        technical_description_en,
        technical_description_ru,
        emotional_description_en,
        emotional_description_ru,
        narrative_story_en,
        narrative_story_ru,
        historical_context_en,
        historical_context_ru,
        care_instructions_en,
        care_instructions_ru,
        marketing_highlights,
        promotional_text
      `)
      .eq("gemstone_id", id)
      .single();

    if (v6Error && v6Error.code !== "PGRST116") {
      console.error("❌ [GemstoneAPI] V6 text fetch error:", v6Error);
      // Don't fail the entire request if v6 text fails
    }

    const result = {
      ...gemstone,
      v6Text: v6Text || null,
    };

    console.log(`✅ [GemstoneAPI] Successfully fetched gemstone: ${gemstone.name}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ [GemstoneAPI] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
