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

    // Fetch gemstone with AI content using gemstones_enriched view
    const { data: gemstone, error: gemstoneError } = await supabase
      .from("gemstones_enriched")
      .select("*")
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

    // Fetch additional related data separately (not in the view)
    const [imagesResult, videosResult, certificationsResult, individualStonesResult] = await Promise.all([
      supabase.from("gemstone_images").select("*").eq("gemstone_id", id),
      supabase.from("gemstone_videos").select("*").eq("gemstone_id", id),
      supabase.from("certifications").select("*").eq("gemstone_id", id),
      supabase.from("gemstone_individual_stones").select("*").eq("gemstone_id", id).order("stone_number")
    ]);

    const images = imagesResult.data || [];
    const videos = videosResult.data || [];
    const certifications = certificationsResult.data || [];
    // Transform individual_stones from database format to application format
    const individual_stones = (individualStonesResult.data || []).map((stone) => ({
      id: stone.id,
      gemstone_id: stone.gemstone_id,
      stone_number: stone.stone_number,
      dimensions: {
        length_mm: Number(stone.length_mm),
        width_mm: Number(stone.width_mm),
        depth_mm: Number(stone.depth_mm),
      },
      created_at: stone.created_at,
      updated_at: stone.updated_at,
    }));

    if (imagesResult.error) {
      console.warn("⚠️ [GemstoneAPI] Failed to fetch images:", imagesResult.error);
    }
    if (videosResult.error) {
      console.warn("⚠️ [GemstoneAPI] Failed to fetch videos:", videosResult.error);
    }
    if (certificationsResult.error) {
      console.warn("⚠️ [GemstoneAPI] Failed to fetch certifications:", certificationsResult.error);
    }
    if (individualStonesResult.error) {
      console.warn("⚠️ [GemstoneAPI] Failed to fetch individual stones:", individualStonesResult.error);
    }

    const result = {
      ...gemstone,
      images,
      videos,
      certifications,
      individual_stones,
      v6Text: gemstone.technical_description_en ? {
        technical_description_en: gemstone.technical_description_en,
        technical_description_ru: gemstone.technical_description_ru,
        emotional_description_en: gemstone.emotional_description_en,
        emotional_description_ru: gemstone.emotional_description_ru,
        narrative_story_en: gemstone.narrative_story_en,
        narrative_story_ru: gemstone.narrative_story_ru,
        historical_context_en: gemstone.historical_context_en,
        historical_context_ru: gemstone.historical_context_ru,
        care_instructions_en: gemstone.care_instructions_en,
        care_instructions_ru: gemstone.care_instructions_ru,
        marketing_highlights: gemstone.marketing_highlights_en,
        promotional_text: gemstone.promotional_text_en,
      } : null,
    };

    console.log(
      `✅ [GemstoneAPI] Successfully fetched gemstone: ${gemstone.name}`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ [GemstoneAPI] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
