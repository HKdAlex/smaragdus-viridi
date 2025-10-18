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

// PUT /api/admin/gemstones/[id]/media - Set primary image/video
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { mediaId, mediaType } = await request.json();

    if (!mediaId || !mediaType) {
      return NextResponse.json(
        { error: "Missing mediaId or mediaType" },
        { status: 400 }
      );
    }

    if (mediaType === "image") {
      // Unset all primary images for this gemstone
      await getAdminClient()
        .from("gemstone_images")
        .update({ is_primary: false })
        .eq("gemstone_id", id);

      // Set the selected image as primary
      const { error } = await getAdminClient()
        .from("gemstone_images")
        .update({ is_primary: true })
        .eq("id", mediaId)
        .eq("gemstone_id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else if (mediaType === "video") {
      // Set all videos to order 1
      await getAdminClient()
        .from("gemstone_videos")
        .update({ video_order: 1 })
        .eq("gemstone_id", id);

      // Set the selected video to order 0 (primary)
      const { error } = await getAdminClient()
        .from("gemstone_videos")
        .update({ video_order: 0 })
        .eq("id", mediaId)
        .eq("gemstone_id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/gemstones/[id]/media - Delete media
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { mediaId, mediaType } = await request.json();

    if (!mediaId || !mediaType) {
      return NextResponse.json(
        { error: "Missing mediaId or mediaType" },
        { status: 400 }
      );
    }

    const tableName =
      mediaType === "image" ? "gemstone_images" : "gemstone_videos";

    // Get media record to get storage path
    const { data: mediaRecord, error: fetchError } = await getAdminClient()
      .from(tableName)
      .select("original_path")
      .eq("id", mediaId)
      .eq("gemstone_id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    // Delete from database
    const { error: dbError } = await getAdminClient()
      .from(tableName)
      .delete()
      .eq("id", mediaId)
      .eq("gemstone_id", id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    // Delete from storage if path exists
    if (mediaRecord?.original_path) {
      const { error: storageError } = await getAdminClient()
        .storage.from("gemstone-media")
        .remove([mediaRecord.original_path]);

      if (storageError) {
        console.error("Failed to delete from storage:", storageError);
        // Don't fail the request if storage deletion fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
