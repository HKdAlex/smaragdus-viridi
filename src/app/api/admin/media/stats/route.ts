import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";

import { AdminAuthError, requireAdmin } from "../../_utils/require-admin";

const GEMSTONE_MEDIA_BUCKET = "gemstone-media";

interface MediaStats {
  totalImages: number;
  totalVideos: number;
  totalStorageFiles: number;
  orphanedImages: Array<{
    id: string;
    gemstone_id: string;
    original_path: string | null;
    image_url: string;
    original_filename: string | null;
  }>;
  orphanedVideos: Array<{
    id: string;
    gemstone_id: string;
    original_path: string | null;
    video_url: string;
    thumbnail_url: string | null;
    original_filename: string | null;
  }>;
  orphanedStorageFiles: Array<{
    name: string;
    path: string;
    size: number;
    lastModified: string;
  }>;
  storageSize: {
    total: number;
    images: number;
    videos: number;
  };
}

/**
 * Fetch all images from database with pagination to bypass the 1000 row limit
 */
async function fetchAllImages(
  client: NonNullable<typeof supabaseAdmin>
): Promise<
  Array<{
    id: string;
    gemstone_id: string;
    original_path: string | null;
    image_url: string;
    original_filename: string | null;
  }>
> {
  const allRows: Array<{
    id: string;
    gemstone_id: string;
    original_path: string | null;
    image_url: string;
    original_filename: string | null;
  }> = [];
  const pageSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await client
      .from("gemstone_images")
      .select("id, gemstone_id, original_path, image_url, original_filename")
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allRows.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        offset += pageSize;
      }
    }
  }

  return allRows;
}

/**
 * Fetch all videos from database with pagination to bypass the 1000 row limit
 */
async function fetchAllVideos(
  client: NonNullable<typeof supabaseAdmin>
): Promise<
  Array<{
    id: string;
    gemstone_id: string;
    original_path: string | null;
    video_url: string;
    thumbnail_url: string | null;
    original_filename: string | null;
  }>
> {
  const allRows: Array<{
    id: string;
    gemstone_id: string;
    original_path: string | null;
    video_url: string;
    thumbnail_url: string | null;
    original_filename: string | null;
  }> = [];
  const pageSize = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await client
      .from("gemstone_videos")
      .select("id, gemstone_id, original_path, video_url, thumbnail_url, original_filename")
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allRows.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        offset += pageSize;
      }
    }
  }

  return allRows;
}

/**
 * Get total count from gemstone_images table
 */
async function getImageCount(
  client: NonNullable<typeof supabaseAdmin>
): Promise<number> {
  const { count, error } = await client
    .from("gemstone_images")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count || 0;
}

/**
 * Get total count from gemstone_videos table
 */
async function getVideoCount(
  client: NonNullable<typeof supabaseAdmin>
): Promise<number> {
  const { count, error } = await client
    .from("gemstone_videos")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count || 0;
}

/**
 * Recursively get all files from storage with parallel processing
 * Optimized with batched folder processing
 */
async function getAllStorageFiles(
  client: NonNullable<typeof supabaseAdmin>,
  path: string = ""
): Promise<any[]> {
  const allFiles: any[] = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: files, error } = await client.storage
      .from(GEMSTONE_MEDIA_BUCKET)
      .list(path, {
        limit,
        offset,
      });

    if (error) {
      console.warn(`[admin/media/stats] Failed to list ${path}:`, error.message);
      break;
    }

    if (!files || files.length === 0) {
      hasMore = false;
      break;
    }

    const filesInDir: any[] = [];
    const folders: string[] = [];

    for (const item of files) {
      const itemPath = path ? `${path}/${item.name}` : item.name;

      if (item.id) {
        filesInDir.push({
          ...item,
          path: itemPath,
        });
      } else {
        folders.push(itemPath);
      }
    }

    allFiles.push(...filesInDir);

    // Process folders in batches of 10 to avoid overwhelming the API
    if (folders.length > 0) {
      const batchSize = 10;
      for (let i = 0; i < folders.length; i += batchSize) {
        const batch = folders.slice(i, i + batchSize);
        const folderResults = await Promise.all(
          batch.map((folderPath) => getAllStorageFiles(client, folderPath))
        );
        folderResults.forEach((subFiles) => {
          allFiles.push(...subFiles);
        });
      }
    }

    if (files.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  return allFiles;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const adminClient = supabaseAdmin;
    if (!adminClient) {
      throw new Error("Supabase admin client is not configured");
    }

    console.log("[admin/media/stats] Fetching media statistics...");

    // Step 1: Get counts first (fast) - these are always accurate
    const [imageCount, videoCount] = await Promise.all([
      getImageCount(adminClient),
      getVideoCount(adminClient),
    ]);

    console.log("[admin/media/stats] Database counts:", {
      images: imageCount,
      videos: videoCount,
    });

    // Step 2: Fetch all database records with pagination (bypasses 1000 limit)
    const [dbImages, dbVideos] = await Promise.all([
      fetchAllImages(adminClient),
      fetchAllVideos(adminClient),
    ]);

    console.log("[admin/media/stats] Fetched all database records:", {
      images: dbImages.length,
      videos: dbVideos.length,
    });

    // Step 3: Get all storage files (this is the slow part)
    const allFiles = await getAllStorageFiles(adminClient);
    console.log("[admin/media/stats] Total storage files (recursive):", allFiles.length);

    // Step 4: Extract storage paths from URLs
    // The image_url/video_url format is like:
    // https://xxx.supabase.co/storage/v1/object/public/gemstone-media/gemstones/{uuid}/images/{file}
    // We need to extract: gemstones/{uuid}/images/{file}
    const extractStoragePath = (url: string): string | null => {
      if (!url) return null;
      // Match everything after /gemstone-media/
      const match = url.match(/\/gemstone-media\/(.+)$/);
      return match ? match[1] : null;
    };

    // Create sets for O(1) lookup
    const storageFilePaths = new Set(allFiles.map((file) => file.path));
    
    // Extract actual storage paths from image_url and video_url
    const dbImageStoragePaths = new Set(
      dbImages
        .map((img) => extractStoragePath(img.image_url))
        .filter((path): path is string => !!path)
    );
    const dbVideoStoragePaths = new Set(
      dbVideos
        .map((vid) => extractStoragePath(vid.video_url))
        .filter((path): path is string => !!path)
    );
    const allDbStoragePaths = new Set([...dbImageStoragePaths, ...dbVideoStoragePaths]);

    // Debug: Log sample paths to understand the format
    const sampleStoragePaths = Array.from(storageFilePaths).slice(0, 3);
    const sampleDbImageStoragePaths = Array.from(dbImageStoragePaths).slice(0, 3);
    const sampleDbVideoStoragePaths = Array.from(dbVideoStoragePaths).slice(0, 3);
    
    console.log("[admin/media/stats] Sample storage paths:", sampleStoragePaths);
    console.log("[admin/media/stats] Sample DB image storage paths (from URL):", sampleDbImageStoragePaths);
    console.log("[admin/media/stats] Sample DB video storage paths (from URL):", sampleDbVideoStoragePaths);

    // Step 5: Find orphaned records
    // An image is orphaned if its storage path (from URL) doesn't exist in storage
    const orphanedImages = dbImages.filter((img) => {
      const storagePath = extractStoragePath(img.image_url);
      if (!storagePath) return true; // No valid URL = orphaned
      return !storageFilePaths.has(storagePath);
    });

    const orphanedVideos = dbVideos.filter((vid) => {
      const storagePath = extractStoragePath(vid.video_url);
      if (!storagePath) return true; // No valid URL = orphaned
      return !storageFilePaths.has(storagePath);
    });

    // A storage file is orphaned if no DB record references it
    const orphanedStorageFiles = allFiles.filter((file) => {
      return !allDbStoragePaths.has(file.path);
    });
    
    // Debug: Log orphan detection results
    console.log("[admin/media/stats] Orphan detection results:", {
      orphanedImages: orphanedImages.length,
      orphanedVideos: orphanedVideos.length,
      orphanedStorageFiles: orphanedStorageFiles.length,
    });
    
    if (orphanedImages.length > 0) {
      const sample = orphanedImages[0];
      const storagePath = extractStoragePath(sample.image_url);
      console.log("[admin/media/stats] Sample orphaned image:", {
        id: sample.id,
        image_url: sample.image_url,
        extractedPath: storagePath,
        inStorage: storagePath ? storageFilePaths.has(storagePath) : false,
      });
    }
    
    if (orphanedStorageFiles.length > 0) {
      const sample = orphanedStorageFiles[0];
      console.log("[admin/media/stats] Sample orphaned storage file:", {
        path: sample.path,
        inDbPaths: allDbStoragePaths.has(sample.path),
      });
    }

    // Step 6: Calculate storage sizes
    const imageFiles = allFiles.filter((file) => file.path.includes("/images/"));
    const videoFiles = allFiles.filter((file) => file.path.includes("/videos/"));

    const storageSize = {
      total: allFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0),
      images: imageFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0),
      videos: videoFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0),
    };

    // Limit orphaned items returned to prevent huge payloads
    // Show first 100 of each type
    const MAX_ORPHANED_ITEMS = 100;

    const stats: MediaStats = {
      totalImages: imageCount, // Use count query result
      totalVideos: videoCount, // Use count query result
      totalStorageFiles: allFiles.length,
      orphanedImages: orphanedImages.slice(0, MAX_ORPHANED_ITEMS).map((img) => ({
        id: img.id,
        gemstone_id: img.gemstone_id,
        original_path: img.original_path,
        image_url: img.image_url,
        original_filename: img.original_filename,
      })),
      orphanedVideos: orphanedVideos.slice(0, MAX_ORPHANED_ITEMS).map((vid) => ({
        id: vid.id,
        gemstone_id: vid.gemstone_id,
        original_path: vid.original_path,
        video_url: vid.video_url,
        thumbnail_url: vid.thumbnail_url,
        original_filename: vid.original_filename,
      })),
      orphanedStorageFiles: orphanedStorageFiles.slice(0, MAX_ORPHANED_ITEMS).map((file) => ({
        name: file.name,
        path: file.path,
        size: file.metadata?.size || 0,
        lastModified: file.updated_at || file.created_at || new Date().toISOString(),
      })),
      storageSize,
    };

    // Add actual orphan counts to response
    const response = {
      success: true,
      data: {
        ...stats,
        // Include actual counts so UI can show "showing X of Y"
        orphanedImageCount: orphanedImages.length,
        orphanedVideoCount: orphanedVideos.length,
        orphanedStorageFileCount: orphanedStorageFiles.length,
      },
    };

    console.log("[admin/media/stats] Statistics calculated:", {
      totalImages: stats.totalImages,
      totalVideos: stats.totalVideos,
      totalStorageFiles: stats.totalStorageFiles,
      orphanedImages: orphanedImages.length,
      orphanedVideos: orphanedVideos.length,
      orphanedStorageFiles: orphanedStorageFiles.length,
      storageSizeTotal: stats.storageSize.total,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("[admin/media/stats] Failed to fetch media statistics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch media statistics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
