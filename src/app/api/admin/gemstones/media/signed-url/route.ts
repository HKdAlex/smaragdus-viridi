import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";

import { AdminAuthError, requireAdmin } from "../../../_utils/require-admin";

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

function validateFileMetadata(
  type: MediaType,
  fileSize: number,
  mimeType: string
) {
  if (type === "image") {
    if (
      !ALLOWED_IMAGE_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_TYPES)[number])
    ) {
      throw new AdminAuthError(`Unsupported image type: ${mimeType}`, 400);
    }
    if (fileSize > MAX_IMAGE_SIZE) {
      throw new AdminAuthError("Image exceeds maximum size of 50MB", 400);
    }
  } else {
    if (
      !ALLOWED_VIDEO_TYPES.includes(mimeType as (typeof ALLOWED_VIDEO_TYPES)[number])
    ) {
      throw new AdminAuthError(`Unsupported video type: ${mimeType}`, 400);
    }
    if (fileSize > MAX_VIDEO_SIZE) {
      throw new AdminAuthError("Video exceeds maximum size of 500MB", 400);
    }
  }
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

/**
 * POST /api/admin/gemstones/media/signed-url
 * 
 * Generates a signed URL for direct upload to Supabase Storage.
 * This bypasses Vercel's 4.5MB body size limit by uploading directly
 * from the browser to Supabase.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { gemstoneId, mediaType, fileName, fileSize, mimeType, serialNumber } = body;

    console.log("[admin/gemstones/media/signed-url] Request received:", {
      gemstoneId,
      mediaType,
      fileName,
      fileSize,
      mimeType,
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

    if (
      typeof fileName !== "string" ||
      typeof fileSize !== "number" ||
      typeof mimeType !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing file metadata (fileName, fileSize, mimeType)" },
        { status: 400 }
      );
    }

    // Validate file metadata
    try {
      validateFileMetadata(mediaType, fileSize, mimeType);
    } catch (error) {
      if (error instanceof AdminAuthError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }

    const adminClient = ensureAdminClient();
    const storagePath = buildStoragePath(gemstoneId, mediaType, fileName);

    // Create signed upload URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
      .from(GEMSTONE_MEDIA_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (signedUrlError || !signedUrlData) {
      console.error("[admin/gemstones/media/signed-url] Failed to create signed URL:", {
        error: signedUrlError?.message,
        storagePath,
      });
      return NextResponse.json(
        { error: `Failed to create upload URL: ${signedUrlError?.message || "Unknown error"}` },
        { status: 500 }
      );
    }

    console.log("[admin/gemstones/media/signed-url] Signed URL created:", {
      storagePath,
      token: signedUrlData.token ? "present" : "missing",
    });

    return NextResponse.json({
      success: true,
      data: {
        signedUrl: signedUrlData.signedUrl,
        token: signedUrlData.token,
        path: signedUrlData.path,
        storagePath,
        gemstoneId,
        mediaType,
        fileName,
        fileSize,
        mimeType,
        serialNumber: serialNumber || null,
      },
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin/gemstones/media/signed-url] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

