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

    console.log("[admin/gemstones/[id]/media] DELETE request received:", {
      gemstoneId: id,
      mediaId,
      mediaType,
    });

    if (!mediaId || !mediaType) {
      console.error("[admin/gemstones/[id]/media] Missing required fields:", {
        mediaId: !!mediaId,
        mediaType: !!mediaType,
      });
      return NextResponse.json(
        { error: "Missing mediaId or mediaType" },
        { status: 400 }
      );
    }

    const adminClient = ensureAdminClient();

    const tableName =
      mediaType === "image" ? "gemstone_images" : "gemstone_videos";

    console.log("[admin/gemstones/[id]/media] Fetching media record:", {
      tableName,
      mediaId,
      gemstoneId: id,
    });

    // Get media record to get storage path and other info
    // Use separate queries for proper TypeScript inference
    let mediaRecord: { original_path: string | null; original_filename: string | null; image_url?: string; video_url?: string } | null = null;
    let fetchError: any = null;

    if (mediaType === "image") {
      const result = await adminClient
        .from("gemstone_images")
        .select("original_path, original_filename, image_url")
        .eq("id", mediaId)
        .eq("gemstone_id", id)
        .single();
      mediaRecord = result.data;
      fetchError = result.error;
    } else {
      const result = await adminClient
        .from("gemstone_videos")
        .select("original_path, original_filename, video_url")
        .eq("id", mediaId)
        .eq("gemstone_id", id)
        .single();
      mediaRecord = result.data;
      fetchError = result.error;
    }

    if (fetchError) {
      console.error("[admin/gemstones/[id]/media] Failed to fetch media record:", {
        error: fetchError.message,
        code: fetchError.code,
        details: fetchError.details,
        mediaId,
        gemstoneId: id,
      });
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    if (!mediaRecord) {
      console.error("[admin/gemstones/[id]/media] Media record not found:", {
        mediaId,
        gemstoneId: id,
        tableName,
      });
      return NextResponse.json(
        { error: "Media record not found" },
        { status: 404 }
      );
    }

    console.log("[admin/gemstones/[id]/media] Media record found:", {
      mediaId,
      originalPath: mediaRecord.original_path,
      originalFilename: mediaRecord.original_filename,
      ...(mediaType === "video"
        ? { videoUrl: mediaRecord.video_url }
        : { imageUrl: mediaRecord.image_url }),
    });

    // Delete from database first
    console.log("[admin/gemstones/[id]/media] Deleting from database:", {
      tableName,
      mediaId,
      gemstoneId: id,
    });

    const { error: dbError, data: deleteResult } = await adminClient
      .from(tableName)
      .delete()
      .eq("id", mediaId)
      .eq("gemstone_id", id)
      .select();

    if (dbError) {
      console.error("[admin/gemstones/[id]/media] Database deletion failed:", {
        error: dbError.message,
        code: dbError.code,
        details: dbError.details,
        mediaId,
        gemstoneId: id,
      });
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    console.log("[admin/gemstones/[id]/media] Database deletion successful:", {
      deletedRecords: deleteResult?.length || 0,
      mediaId,
    });

    // Delete from storage if path exists
    if (mediaRecord?.original_path) {
      console.log("[admin/gemstones/[id]/media] Deleting from storage:", {
        storagePath: mediaRecord.original_path,
        bucket: "gemstone-media",
      });

      const { error: storageError, data: storageDeleteResult } =
        await adminClient.storage
          .from("gemstone-media")
          .remove([mediaRecord.original_path]);

      if (storageError) {
        console.error(
          "[admin/gemstones/[id]/media] Storage deletion failed:",
          {
            error: storageError.message,
            storagePath: mediaRecord.original_path,
            mediaId,
            gemstoneId: id,
          }
        );
        // Don't fail the request if storage deletion fails - DB record is already deleted
        // But log it as a warning
        return NextResponse.json({
          success: true,
          warning: `Database record deleted but storage deletion failed: ${storageError.message}`,
        });
      }

      console.log("[admin/gemstones/[id]/media] Storage deletion successful:", {
        storagePath: mediaRecord.original_path,
        deletedFiles: storageDeleteResult?.length || 0,
      });
    } else {
      console.warn(
        "[admin/gemstones/[id]/media] No original_path found, skipping storage deletion:",
        {
          mediaId,
          gemstoneId: id,
          mediaRecord,
        }
      );
    }

    console.log("[admin/gemstones/[id]/media] Delete operation completed successfully:", {
      mediaId,
      gemstoneId: id,
      mediaType,
      dbDeleted: true,
      storageDeleted: !!mediaRecord?.original_path,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin/gemstones/[id]/media] DELETE failed with unexpected error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
