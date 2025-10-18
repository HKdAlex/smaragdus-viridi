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
      .from("gemstones")
      .select(
        `
        *,
        origin:origins(*),
        images:gemstone_images(*),
        certifications:certifications(*),
        ai_v6:gemstones_ai_v6(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
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
