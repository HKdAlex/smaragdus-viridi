import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";

import { AdminAuthError, requireAdmin } from "../../../_utils/require-admin";

function ensureAdminClient() {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured");
  }
  return supabaseAdmin;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Gemstone id required" }, { status: 400 });
    }

    await requireAdmin();

    const adminClient = ensureAdminClient();

    const [{ data: images, error: imagesError }, { data: videos, error: videosError }] =
      await Promise.all([
        adminClient
          .from("gemstone_images")
          .select("*")
          .eq("gemstone_id", id)
          .order("image_order", { ascending: true }),
        adminClient
          .from("gemstone_videos")
          .select("*")
          .eq("gemstone_id", id)
          .order("video_order", { ascending: true }),
      ]);

    if (imagesError || videosError) {
      const firstError = imagesError ?? videosError;
      return NextResponse.json(
        { error: firstError?.message ?? "Failed to fetch media" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        images: images ?? [],
        videos: videos ?? [],
    },
  });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin/gemstones/[id]/media] GET failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/gemstones/[id]/media - Set primary image/video
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Gemstone id required" }, { status: 400 });
    }

    await requireAdmin();

    const { mediaId, mediaType } = await request.json();

    if (!mediaId || !mediaType) {
      return NextResponse.json(
        { error: "Missing mediaId or mediaType" },
        { status: 400 }
      );
    }

    const adminClient = ensureAdminClient();

    if (mediaType === "image") {
      // Unset all primary images for this gemstone
      const { error: unsetError } = await adminClient
        .from("gemstone_images")
        .update({ is_primary: false })
        .eq("gemstone_id", id);
      if (unsetError) {
        return NextResponse.json({ error: unsetError.message }, { status: 400 });
      }

      // Set the selected image as primary
      const { error } = await adminClient
        .from("gemstone_images")
        .update({ is_primary: true })
        .eq("id", mediaId)
        .eq("gemstone_id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else if (mediaType === "video") {
      // Set all videos to order 1
      await adminClient
        .from("gemstone_videos")
        .update({ video_order: 1 })
        .eq("gemstone_id", id);

      // Set the selected video to order 0 (primary)
      const { error } = await adminClient
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

    const adminClient = ensureAdminClient();

    const tableName =
      mediaType === "image" ? "gemstone_images" : "gemstone_videos";

    // Get media record to get storage path
    const { data: mediaRecord, error: fetchError } = await adminClient
      .from(tableName)
      .select("original_path")
      .eq("id", mediaId)
      .eq("gemstone_id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    // Delete from database
    const { error: dbError } = await adminClient
      .from(tableName)
      .delete()
      .eq("id", mediaId)
      .eq("gemstone_id", id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    // Delete from storage if path exists
    if (mediaRecord?.original_path) {
      const { error: storageError } = await adminClient
        .storage.from("gemstone-media")
        .remove([mediaRecord.original_path]);

      if (storageError) {
        console.error("Failed to delete from storage:", storageError);
        // Don't fail the request if storage deletion fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
