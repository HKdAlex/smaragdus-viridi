import { NextRequest, NextResponse } from "next/server";

import { Database } from "@/shared/types/database";
import { createClient } from "@supabase/supabase-js";

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

    const { data, error } = await getAdminClient()
      .from("gemstones_enriched")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fetch additional related data separately (not in the view)
    const [imagesResult, videosResult, certificationsResult] =
      await Promise.all([
        getAdminClient()
          .from("gemstone_images")
          .select("*")
          .eq("gemstone_id", id),
        getAdminClient()
          .from("gemstone_videos")
          .select("*")
          .eq("gemstone_id", id),
        getAdminClient()
          .from("certifications")
          .select("*")
          .eq("gemstone_id", id),
      ]);

    const images = imagesResult.data || [];
    const videos = videosResult.data || [];
    const certifications = certificationsResult.data || [];

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

    const result = {
      ...data,
      images,
      videos,
      certifications,
      ai_v6: data.technical_description_en
        ? {
            technical_description_en: data.technical_description_en,
            technical_description_ru: data.technical_description_ru,
            emotional_description_en: data.emotional_description_en,
            emotional_description_ru: data.emotional_description_ru,
            narrative_story_en: data.narrative_story_en,
            narrative_story_ru: data.narrative_story_ru,
            historical_context_en: data.historical_context_en,
            historical_context_ru: data.historical_context_ru,
            care_instructions_en: data.care_instructions_en,
            care_instructions_ru: data.care_instructions_ru,
            promotional_text: data.promotional_text_en,
            promotional_text_ru: data.promotional_text_ru,
            marketing_highlights: data.marketing_highlights_en,
            marketing_highlights_ru: data.marketing_highlights_ru,
            recommended_primary_image_index:
              data.recommended_primary_image_index,
            selected_image_uuid: data.selected_image_uuid,
            detected_cut: data.detected_cut,
            detected_color: data.detected_color,
            detected_color_description: data.detected_color_description,
            model_version: data.model_version,
            confidence_score: data.confidence_score,
            needs_review: data.needs_review,
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
      ...gemstoneFields
    } = body;

    // Update gemstone
    const { data, error } = await getAdminClient()
      .from("gemstones")
      .update({
        ...gemstoneFields,
        updated_at: new Date().toISOString(),
      })
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
