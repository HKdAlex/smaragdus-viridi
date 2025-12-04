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

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const adminClient = supabaseAdmin;
    if (!adminClient) {
      throw new Error("Supabase admin client is not configured");
    }

    console.log("[admin/media/stats] Fetching media statistics...");

    // Get all images and videos from database
    const [{ data: images, error: imagesError }, { data: videos, error: videosError }] =
      await Promise.all([
        adminClient
          .from("gemstone_images")
          .select("id, gemstone_id, original_path, image_url, original_filename"),
        adminClient
          .from("gemstone_videos")
          .select("id, gemstone_id, original_path, video_url, original_filename"),
      ]);

    if (imagesError) {
      console.error("[admin/media/stats] Failed to fetch images:", imagesError);
      throw imagesError;
    }

    if (videosError) {
      console.error("[admin/media/stats] Failed to fetch videos:", videosError);
      throw videosError;
    }

    const dbImages = images || [];
    const dbVideos = videos || [];

    console.log("[admin/media/stats] Database records:", {
      images: dbImages.length,
      videos: dbVideos.length,
    });

    // Recursively get all files from storage with parallel processing
    const getAllStorageFiles = async (path: string = ""): Promise<any[]> => {
      const allFiles: any[] = [];
      let offset = 0;
      const limit = 1000;
      let hasMore = true;

      // Handle pagination for current directory
      while (hasMore) {
        const { data: files, error } = await adminClient.storage
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

        // Separate files and folders
        const filesInDir: any[] = [];
        const folders: string[] = [];

        for (const item of files) {
          const itemPath = path ? `${path}/${item.name}` : item.name;
          
          if (item.id) {
            // It's a file
            filesInDir.push({
              ...item,
              path: itemPath,
            });
          } else {
            // It's a folder
            folders.push(itemPath);
          }
        }

        allFiles.push(...filesInDir);

        // Process folders in parallel
        if (folders.length > 0) {
          const folderResults = await Promise.all(
            folders.map((folderPath) => getAllStorageFiles(folderPath))
          );
          folderResults.forEach((subFiles) => {
            allFiles.push(...subFiles);
          });
        }

        // Check if we need to paginate
        if (files.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }

      return allFiles;
    };

    const allFiles = await getAllStorageFiles();
    console.log("[admin/media/stats] Total storage files (recursive):", allFiles.length);

    // Create sets of paths for quick O(1) lookup
    const storageFilePaths = new Set(allFiles.map((file) => file.path));
    const dbImagePaths = new Set(
      dbImages
        .map((img) => img.original_path)
        .filter((path): path is string => !!path)
    );
    const dbVideoPaths = new Set(
      dbVideos
        .map((vid) => vid.original_path)
        .filter((path): path is string => !!path)
    );
    const allDbPaths = new Set([...dbImagePaths, ...dbVideoPaths]);

    // Find orphaned database records (no storage file) - O(1) lookup
    const orphanedImages = dbImages.filter((img) => {
      if (!img.original_path) return true; // No path = orphaned
      return !storageFilePaths.has(img.original_path);
    });

    const orphanedVideos = dbVideos.filter((vid) => {
      if (!vid.original_path) return true; // No path = orphaned
      return !storageFilePaths.has(vid.original_path);
    });

    // Find orphaned storage files (no database record)
    const orphanedStorageFiles = allFiles.filter((file) => {
      // Check if this file path exists in any database record
      return !allDbPaths.has(file.path);
    });

    // Calculate storage sizes
    const imageFiles = allFiles.filter((file) =>
      file.path.includes("/images/")
    );
    const videoFiles = allFiles.filter((file) =>
      file.path.includes("/videos/")
    );

    const storageSize = {
      total: allFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0),
      images: imageFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0),
      videos: videoFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0),
    };

    const stats: MediaStats = {
      totalImages: dbImages.length,
      totalVideos: dbVideos.length,
      totalStorageFiles: allFiles.length,
      orphanedImages: orphanedImages.map((img) => ({
        id: img.id,
        gemstone_id: img.gemstone_id,
        original_path: img.original_path,
        image_url: img.image_url,
        original_filename: img.original_filename,
      })),
      orphanedVideos: orphanedVideos.map((vid) => ({
        id: vid.id,
        gemstone_id: vid.gemstone_id,
        original_path: vid.original_path,
        video_url: vid.video_url,
        original_filename: vid.original_filename,
      })),
      orphanedStorageFiles: orphanedStorageFiles.map((file) => ({
        name: file.name,
        path: file.path,
        size: file.metadata?.size || 0,
        lastModified: file.updated_at || file.created_at || new Date().toISOString(),
      })),
      storageSize,
    };

    console.log("[admin/media/stats] Statistics calculated:", {
      totalImages: stats.totalImages,
      totalVideos: stats.totalVideos,
      totalStorageFiles: stats.totalStorageFiles,
      orphanedImages: stats.orphanedImages.length,
      orphanedVideos: stats.orphanedVideos.length,
      orphanedStorageFiles: stats.orphanedStorageFiles.length,
      storageSizeTotal: stats.storageSize.total,
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });
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

