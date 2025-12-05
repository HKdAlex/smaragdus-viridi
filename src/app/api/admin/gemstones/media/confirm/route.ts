import { AdminAuthError, requireAdmin } from "../../../_utils/require-admin";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const GEMSTONE_MEDIA_BUCKET = "gemstone-media";

type MediaType = "image" | "video";

function ensureAdminClient() {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured");
  }
  return supabaseAdmin;
}

async function getNextImageOrder(gemstoneId: string): Promise<number> {
  const adminClient = ensureAdminClient();
  const { data, error } = await adminClient
    .from("gemstone_images")
    .select("image_order")
    .eq("gemstone_id", gemstoneId)
    .order("image_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return 1;
  }

  return (data.image_order ?? 0) + 1;
}

async function getNextVideoOrder(gemstoneId: string): Promise<number> {
  const adminClient = ensureAdminClient();
  const { data, error } = await adminClient
    .from("gemstone_videos")
    .select("video_order")
    .eq("gemstone_id", gemstoneId)
    .order("video_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return 1;
  }

  return (data.video_order ?? 0) + 1;
}

/**
 * POST /api/admin/gemstones/media/confirm
 *
 * Confirms a direct upload to Supabase Storage and creates the database record.
 * Call this after successfully uploading a file using a signed URL.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      gemstoneId,
      mediaType,
      storagePath,
      fileName,
      fileSize,
      serialNumber,
    } = body;

    console.log("[admin/gemstones/media/confirm] Request received:", {
      gemstoneId,
      mediaType,
      storagePath,
      fileName,
      fileSize,
    });

    // Validate required fields
    if (
      typeof gemstoneId !== "string" ||
      gemstoneId.length === 0 ||
      (mediaType !== "image" && mediaType !== "video")
    ) {
      return NextResponse.json(
        { error: "Invalid gemstoneId or mediaType" },
        { status: 400 }
      );
    }

    if (typeof storagePath !== "string" || storagePath.length === 0) {
      return NextResponse.json(
        { error: "Missing storagePath" },
        { status: 400 }
      );
    }

    const adminClient = ensureAdminClient();

    // Verify the file exists in storage
    const { data: fileData, error: fileError } = await adminClient.storage
      .from(GEMSTONE_MEDIA_BUCKET)
      .list(storagePath.split("/").slice(0, -1).join("/"), {
        search: storagePath.split("/").pop(),
      });

    if (fileError) {
      console.error("[admin/gemstones/media/confirm] Failed to verify file:", {
        error: fileError.message,
        storagePath,
      });
      return NextResponse.json(
        { error: `Failed to verify upload: ${fileError.message}` },
        { status: 400 }
      );
    }

    const uploadedFileName = storagePath.split("/").pop();
    const fileExists = fileData?.some((f) => f.name === uploadedFileName);

    if (!fileExists) {
      console.error(
        "[admin/gemstones/media/confirm] File not found in storage:",
        {
          storagePath,
          searchedFor: uploadedFileName,
          found: fileData?.map((f) => f.name),
        }
      );
      return NextResponse.json(
        {
          error: "Uploaded file not found in storage. Upload may have failed.",
        },
        { status: 400 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = adminClient.storage
      .from(GEMSTONE_MEDIA_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    // Create database record
    if (mediaType === "image") {
      const nextOrder = await getNextImageOrder(gemstoneId);

      const { data, error } = await adminClient
        .from("gemstone_images")
        .insert({
          gemstone_id: gemstoneId,
          image_url: publicUrl,
          image_order: nextOrder,
          is_primary: nextOrder === 1,
          has_watermark: false,
          original_filename: fileName || storagePath.split("/").pop(),
          original_path: storagePath,
          alt_text:
            typeof serialNumber === "string" && serialNumber.length > 0
              ? `Gemstone ${serialNumber}`
              : null,
        })
        .select()
        .single();

      if (error) {
        console.error(
          "[admin/gemstones/media/confirm] Failed to save image record:",
          {
            error: error.message,
            gemstoneId,
            storagePath,
          }
        );
        // Clean up uploaded file on failure
        await adminClient.storage
          .from(GEMSTONE_MEDIA_BUCKET)
          .remove([storagePath]);
        return NextResponse.json(
          { error: `Failed to save image record: ${error.message}` },
          { status: 400 }
        );
      }

      console.log("[admin/gemstones/media/confirm] Image record created:", {
        id: data.id,
        gemstoneId,
      });

      return NextResponse.json({
        success: true,
        data: {
          id: data.id,
          url: publicUrl,
          type: "image" as const,
          originalName: fileName,
          size: fileSize,
          record: data,
        },
      });
    }

    // Video
    const nextOrder = await getNextVideoOrder(gemstoneId);

    const { data, error } = await adminClient
      .from("gemstone_videos")
      .insert({
        gemstone_id: gemstoneId,
        video_url: publicUrl,
        video_order: nextOrder,
        duration_seconds: null,
        thumbnail_url: null,
        original_path: storagePath,
        original_filename: fileName || storagePath.split("/").pop(),
        processing_status: "pending",
        original_size_bytes: fileSize,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "[admin/gemstones/media/confirm] Failed to save video record:",
        {
          error: error.message,
          gemstoneId,
          storagePath,
        }
      );
      // Clean up uploaded file on failure
      await adminClient.storage
        .from(GEMSTONE_MEDIA_BUCKET)
        .remove([storagePath]);
      return NextResponse.json(
        { error: `Failed to save video record: ${error.message}` },
        { status: 400 }
      );
    }

    console.log("[admin/gemstones/media/confirm] Video record created:", {
      id: data.id,
      gemstoneId,
    });

    // Trigger video optimization Edge Function asynchronously (non-blocking)
    // This happens after the video is confirmed and database record is created
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/optimize-video`;
      
      // Fire and forget - don't wait for response
      fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          type: "INSERT",
          table: "objects",
          record: {
            id: data.id,
            name: storagePath,
            bucket_id: GEMSTONE_MEDIA_BUCKET,
            path: storagePath,
            metadata: {
              size: fileSize,
              mimetype: "video/mp4",
            },
            created_at: new Date().toISOString(),
          },
        }),
      }).catch((error) => {
        // Log error but don't fail the upload
        console.error(
          "[admin/gemstones/media/confirm] Failed to trigger optimization:",
          error
        );
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        url: publicUrl,
        type: "video" as const,
        originalName: fileName,
        size: fileSize,
        record: data,
      },
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("[admin/gemstones/media/confirm] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
