import { NextRequest, NextResponse } from "next/server";

import { Database } from "@/shared/types/database";
import { createClient } from "@supabase/supabase-js";

import { mergeAdminGemstoneRecords } from "@/features/admin/utils/gemstone-record-merge";

// Server-side admin client
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// GET /api/admin/gemstones/[id] - Get single gemstone
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getAdminClient();

    const [
      { data: enriched, error: enrichedError },
      { data: baseGemstone, error: baseError },
      imagesResult,
      videosResult,
      certificationsResult,
      individualStonesResult,
    ] = await Promise.all([
      supabase.from("gemstones_enriched").select("*").eq("id", id).single(),
      supabase.from("gemstones").select("*").eq("id", id).single(),
      supabase.from("gemstone_images").select("*").eq("gemstone_id", id),
      supabase.from("gemstone_videos").select("*").eq("gemstone_id", id),
      supabase.from("certifications").select("*").eq("gemstone_id", id),
      supabase.from("gemstone_individual_stones").select("*").eq("gemstone_id", id).order("stone_number"),
    ]);

    if (enrichedError && enrichedError.code !== "PGRST116") {
      return NextResponse.json({ error: enrichedError.message }, { status: 400 });
    }

    if (baseError) {
      return NextResponse.json({ error: baseError.message }, { status: 404 });
    }

    if (!baseGemstone) {
      return NextResponse.json({ error: "Gemstone not found" }, { status: 404 });
    }

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
      console.warn(
        "⚠️ [AdminGemstoneAPI] Failed to fetch images:",
        imagesResult.error
      );
    }
    if (videosResult.error) {
      console.warn(
        "⚠️ [AdminGemstoneAPI] Failed to fetch videos:",
        videosResult.error
      );
    }
    if (certificationsResult.error) {
      console.warn(
        "⚠️ [AdminGemstoneAPI] Failed to fetch certifications:",
        certificationsResult.error
      );
    }
    if (individualStonesResult.error) {
      console.warn(
        "⚠️ [AdminGemstoneAPI] Failed to fetch individual stones:",
        individualStonesResult.error
      );
    }

    const mergedGemstone = mergeAdminGemstoneRecords(baseGemstone, enriched ?? null);

    const result = {
      ...mergedGemstone,
      images,
      videos,
      certifications,
      individual_stones,
      ai_v6: enriched?.technical_description_en
        ? {
            technical_description_en: enriched.technical_description_en,
            technical_description_ru: enriched.technical_description_ru,
            emotional_description_en: enriched.emotional_description_en,
            emotional_description_ru: enriched.emotional_description_ru,
            narrative_story_en: enriched.narrative_story_en,
            narrative_story_ru: enriched.narrative_story_ru,
            historical_context_en: enriched.historical_context_en,
            historical_context_ru: enriched.historical_context_ru,
            care_instructions_en: enriched.care_instructions_en,
            care_instructions_ru: enriched.care_instructions_ru,
            promotional_text: enriched.promotional_text_en,
            promotional_text_ru: enriched.promotional_text_ru,
            marketing_highlights: enriched.marketing_highlights_en,
            marketing_highlights_ru: enriched.marketing_highlights_ru,
            recommended_primary_image_index:
              enriched.recommended_primary_image_index,
            selected_image_uuid: enriched.selected_image_uuid,
            detected_cut: enriched.detected_cut,
            detected_color: enriched.detected_color,
            detected_color_description: enriched.detected_color_description,
            model_version: enriched.model_version,
            confidence_score: enriched.confidence_score,
            needs_review: enriched.needs_review,
          }
        : null,
    };

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("❌ [AdminGemstoneAPI] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/gemstones/[id] - Update gemstone
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Filter out AI-specific fields (these are empty in gemstones table)
    // All AI content is stored in gemstones_ai_v6 table
    const {
      ai_v6,
      description_technical_en,
      description_emotional_en,
      narrative_story_en,
      promotional_text_en,
      marketing_highlights_en,
      description_technical_ru,
      description_emotional_ru,
      narrative_story_ru,
      promotional_text_ru,
      marketing_highlights_ru,
      individual_stones,
      ...gemstoneFields
    } = body;

    // Auto-generate codes if not provided
    const updates = {
      ...gemstoneFields,
      updated_at: new Date().toISOString(),
    } as any;

    if (
      typeof gemstoneFields.name !== "undefined" &&
      typeof gemstoneFields.type_code === "undefined"
    ) {
      updates.type_code = gemstoneFields.name;
    }

    if (
      typeof gemstoneFields.color !== "undefined" &&
      typeof gemstoneFields.color_code === "undefined"
    ) {
      updates.color_code = gemstoneFields.color;
    }

    if (
      typeof gemstoneFields.cut !== "undefined" &&
      typeof gemstoneFields.cut_code === "undefined"
    ) {
      updates.cut_code = gemstoneFields.cut;
    }

    if (
      typeof gemstoneFields.clarity !== "undefined" &&
      typeof gemstoneFields.clarity_code === "undefined"
    ) {
      updates.clarity_code = gemstoneFields.clarity;
    }

    // Update gemstone
    const { data, error } = await getAdminClient()
      .from("gemstones")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Handle AI v6 fields if present
    if (ai_v6) {
      const { data: existingAiV6 } = await getAdminClient()
        .from("gemstones_ai_v6")
        .select("gemstone_id")
        .eq("gemstone_id", id)
        .single();

      if (existingAiV6) {
        // Update existing AI v6 record
        const { error: aiV6Error } = await getAdminClient()
          .from("gemstones_ai_v6")
          .update({
            ...ai_v6,
            updated_at: new Date().toISOString(),
          })
          .eq("gemstone_id", id);

        if (aiV6Error) {
          console.error("Failed to update AI v6 data", aiV6Error);
        }
      } else {
        // Create new AI v6 record
        const { error: aiV6Error } = await getAdminClient()
          .from("gemstones_ai_v6")
          .insert({
            gemstone_id: id,
            ...ai_v6,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (aiV6Error) {
          console.error("Failed to create AI v6 data", aiV6Error);
        }
      }
    }

    // Handle individual stones if provided
    if (individual_stones && Array.isArray(individual_stones)) {
      const adminClient = getAdminClient();
      
      // Use RPC function to bypass RLS
      if (individual_stones.length > 0) {
        const stonesPayload = individual_stones.map((stone: any) => ({
          stone_number: stone.stone_number,
          length_mm: Number(stone.dimensions?.length_mm || 0),
          width_mm: Number(stone.dimensions?.width_mm || 0),
          depth_mm: Number(stone.dimensions?.depth_mm || 0),
        }));

        const { error: rpcError } = await adminClient.rpc(
          "upsert_gemstone_individual_stones",
          {
            p_gemstone_id: id,
            p_stones: stonesPayload,
          }
        );

        if (rpcError) {
          console.error("❌ [AdminGemstonesAPI] Failed to upsert individual stones:", rpcError);
          console.error("❌ [AdminGemstonesAPI] Payload:", JSON.stringify(stonesPayload, null, 2));
          // Note: We don't fail the entire request since the main gemstone was updated
        } else {
          console.log("✅ [AdminGemstonesAPI] Successfully upserted individual stones:", stonesPayload.length);
        }
      } else {
        // If empty array, delete all stones for this gemstone
        const { error: deleteError } = await adminClient.rpc(
          "upsert_gemstone_individual_stones",
          {
            p_gemstone_id: id,
            p_stones: [],
          }
        );

        if (deleteError) {
          console.error("❌ [AdminGemstonesAPI] Failed to delete individual stones:", deleteError);
        }
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/gemstones/[id] - Delete gemstone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await getAdminClient()
      .from("gemstones")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
