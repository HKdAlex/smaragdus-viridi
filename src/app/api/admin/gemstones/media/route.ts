import { Buffer } from "node:buffer";

import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";

import { AdminAuthError, requireAdmin } from "../../_utils/require-admin";

const GEMSTONE_MEDIA_BUCKET = "gemstone-media";
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"] as const;

type MediaType = "image" | "video";

function ensureAdminClient() {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured");
  }
  return supabaseAdmin;
}

function validateFile(type: MediaType, file: File) {
  if (type === "image") {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      throw new AdminAuthError(`Unsupported image type: ${file.type}`, 400);
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new AdminAuthError("Image exceeds maximum size of 50MB", 400);
    }
  } else {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type as (typeof ALLOWED_VIDEO_TYPES)[number])) {
      throw new AdminAuthError(`Unsupported video type: ${file.type}`, 400);
    }
    if (file.size > MAX_VIDEO_SIZE) {
      throw new AdminAuthError("Video exceeds maximum size of 500MB", 400);
    }
  }
}

async function getNextOrder(
  gemstoneId: string,
  table: "gemstone_images" | "gemstone_videos",
  orderColumn: "image_order" | "video_order"
): Promise<number> {
  const adminClient = ensureAdminClient();
  const { data, error } = await adminClient
    .from(table)
    .select(orderColumn)
    .eq("gemstone_id", gemstoneId)
    .order(orderColumn, { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return 1;
  }

  const currentOrder = (data as any)[orderColumn] as number | null;
  return (currentOrder ?? 0) + 1;
}

function buildStoragePath(
  gemstoneId: string,
  type: MediaType,
  fileName: string
): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).slice(2);
  const safeName = fileName.replace(/\s+/g, "_").toLowerCase();
  const folder = type === "image" ? "images" : "videos";
  return `gemstones/${gemstoneId}/${folder}/${timestamp}_${randomPart}_${safeName}`;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const gemstoneId = formData.get("gemstoneId");
    const mediaType = (formData.get("mediaType") || "image") as MediaType;
    const serialNumber = formData.get("serialNumber");
    const file = formData.get("file");

    console.log("[admin/gemstones/media] Upload request received:", {
      gemstoneId: typeof gemstoneId === "string" ? gemstoneId : "invalid",
      mediaType,
      fileName: file instanceof File ? file.name : "invalid",
      fileSize: file instanceof File ? file.size : "invalid",
      fileType: file instanceof File ? file.type : "invalid",
    });

    if (
      typeof gemstoneId !== "string" ||
      gemstoneId.length === 0 ||
      (mediaType !== "image" && mediaType !== "video")
    ) {
      console.error("[admin/gemstones/media] Invalid request:", {
        gemstoneId,
        mediaType,
      });
      return NextResponse.json(
        { error: "Invalid gemstoneId or mediaType" },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      console.error("[admin/gemstones/media] File is not a File instance");
      return NextResponse.json(
        { error: "File upload is required" },
        { status: 400 }
      );
    }

    try {
      validateFile(mediaType, file);
    } catch (error) {
      console.error("[admin/gemstones/media] File validation failed:", {
        error: error instanceof Error ? error.message : String(error),
        mediaType,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      throw error;
    }

    const originalName = file.name || `${mediaType}-${Date.now()}`;
    const storagePath = buildStoragePath(gemstoneId, mediaType, originalName);
    const adminClient = ensureAdminClient();

    console.log("[admin/gemstones/media] Starting file upload:", {
      storagePath,
      fileSize: file.size,
      mediaType,
    });

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await adminClient.storage
      .from(GEMSTONE_MEDIA_BUCKET)
      .upload(storagePath, Buffer.from(arrayBuffer), {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("[admin/gemstones/media] Storage upload failed:", {
        error: uploadError.message,
        storagePath,
        fileSize: file.size,
        mediaType,
      });
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 400 }
      );
    }

    console.log("[admin/gemstones/media] File uploaded successfully:", {
      storagePath,
      mediaType,
    });

    const { data: publicUrlData } = adminClient.storage
      .from(GEMSTONE_MEDIA_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    if (mediaType === "image") {
      const nextOrder = await getNextOrder(
        gemstoneId,
        "gemstone_images",
        "image_order"
      );

      const { data, error } = await adminClient
        .from("gemstone_images")
        .insert({
          gemstone_id: gemstoneId,
          image_url: publicUrl,
          image_order: nextOrder,
          is_primary: nextOrder === 1,
          has_watermark: false,
          original_filename: originalName,
          original_path: storagePath,
          alt_text:
            typeof serialNumber === "string" && serialNumber.length > 0
              ? `Gemstone ${serialNumber}`
              : null,
        })
        .select()
        .single();

      if (error) {
        await adminClient.storage
          .from(GEMSTONE_MEDIA_BUCKET)
          .remove([storagePath]);
        return NextResponse.json(
          { error: `Failed to save image record: ${error.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: data.id,
          url: publicUrl,
          type: "image" as const,
          originalName,
          size: file.size,
          record: data,
        },
      });
    }

    const nextOrder = await getNextOrder(
      gemstoneId,
      "gemstone_videos",
      "video_order"
    );

    console.log("[admin/gemstones/media] Inserting video record:", {
      gemstoneId,
      videoOrder: nextOrder,
      storagePath,
    });

    const { data, error } = await adminClient
      .from("gemstone_videos")
      .insert({
        gemstone_id: gemstoneId,
        video_url: publicUrl,
        video_order: nextOrder,
        duration_seconds: null,
        thumbnail_url: null,
        original_path: storagePath,
        original_filename: originalName,
      })
      .select()
      .single();

    if (error) {
      console.error("[admin/gemstones/media] Failed to save video record:", {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        gemstoneId,
        storagePath,
      });
      // Clean up uploaded file
      await adminClient.storage
        .from(GEMSTONE_MEDIA_BUCKET)
        .remove([storagePath]);
      return NextResponse.json(
        { error: `Failed to save video record: ${error.message}` },
        { status: 400 }
      );
    }

    console.log("[admin/gemstones/media] Video record saved successfully:", {
      id: data.id,
      gemstoneId,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        url: publicUrl,
        type: "video" as const,
        originalName,
        size: file.size,
        record: data,
      },
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin/gemstones/media] Upload failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

