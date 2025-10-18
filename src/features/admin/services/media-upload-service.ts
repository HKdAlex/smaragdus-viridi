import type {
  DatabaseGemstoneImage,
  DatabaseGemstoneVideo,
} from "@/shared/types";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export interface MediaUploadResult {
  id: string;
  url: string;
  type: "image" | "video";
  originalName: string;
  size: number;
}

export interface MediaUploadError {
  message: string;
  file?: File;
}

export class MediaUploadService {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
  private static readonly ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  private static readonly ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

  /**
   * Upload images for a gemstone
   */
  static async uploadGemstoneImages(
    gemstoneId: string,
    files: File[],
    serialNumber: string
  ): Promise<{ success: boolean; data?: MediaUploadResult[]; error?: string }> {
    try {
      const results: MediaUploadResult[] = [];

      for (const file of files) {
        // Validate file
        const validation = this.validateImageFile(file);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        // Generate unique filename
        const fileExtension =
          file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(2)}.${fileExtension}`;
        const storagePath = `gemstones/${gemstoneId}/images/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await (
          supabaseAdmin || supabase
        ).storage
          .from("gemstone-media")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Failed to upload image:", uploadError);
          return {
            success: false,
            error: `Failed to upload ${file.name}: ${uploadError.message}`,
          };
        }

        // Get public URL
        const { data: urlData } = (supabaseAdmin || supabase).storage
          .from("gemstone-media")
          .getPublicUrl(storagePath);

        // Save to database
        const { data: imageRecord, error: dbError } = await (
          supabaseAdmin || supabase
        )
          .from("gemstone_images")
          .insert({
            gemstone_id: gemstoneId,
            image_url: urlData.publicUrl,
            image_order: results.length + 1,
            is_primary: results.length === 0, // First image is primary
            has_watermark: false, // TODO: Add watermarking later
            original_filename: file.name,
            original_path: storagePath,
            alt_text: `Gemstone ${serialNumber} - Image ${results.length + 1}`,
          })
          .select()
          .single();

        if (dbError) {
          console.error("Failed to save image record:", dbError);
          return {
            success: false,
            error: `Failed to save image record: ${dbError.message}`,
          };
        }

        results.push({
          id: imageRecord.id,
          url: urlData.publicUrl,
          type: "image",
          originalName: file.name,
          size: file.size,
        });
      }

      return { success: true, data: results };
    } catch (error) {
      console.error("Unexpected error uploading images:", error);
      return {
        success: false,
        error: "An unexpected error occurred while uploading images",
      };
    }
  }

  /**
   * Upload videos for a gemstone
   */
  static async uploadGemstoneVideos(
    gemstoneId: string,
    files: File[],
    serialNumber: string
  ): Promise<{ success: boolean; data?: MediaUploadResult[]; error?: string }> {
    try {
      const results: MediaUploadResult[] = [];

      for (const file of files) {
        // Validate file
        const validation = this.validateVideoFile(file);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        // Generate unique filename
        const fileExtension =
          file.name.split(".").pop()?.toLowerCase() || "mp4";
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(2)}.${fileExtension}`;
        const storagePath = `gemstones/${gemstoneId}/videos/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await (
          supabaseAdmin || supabase
        ).storage
          .from("gemstone-media")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Failed to upload video:", uploadError);
          return {
            success: false,
            error: `Failed to upload ${file.name}: ${uploadError.message}`,
          };
        }

        // Get public URL
        const { data: urlData } = (supabaseAdmin || supabase).storage
          .from("gemstone-media")
          .getPublicUrl(storagePath);

        // Save to database
        const { data: videoRecord, error: dbError } = await (
          supabaseAdmin || supabase
        )
          .from("gemstone_videos")
          .insert({
            gemstone_id: gemstoneId,
            video_url: urlData.publicUrl,
            video_order: results.length + 1,
            duration_seconds: null, // TODO: Extract duration from video
            thumbnail_url: null, // TODO: Generate thumbnail
          })
          .select()
          .single();

        if (dbError) {
          console.error("Failed to save video record:", dbError);
          return {
            success: false,
            error: `Failed to save video record: ${dbError.message}`,
          };
        }

        results.push({
          id: videoRecord.id,
          url: urlData.publicUrl,
          type: "video",
          originalName: file.name,
          size: file.size,
        });
      }

      return { success: true, data: results };
    } catch (error) {
      console.error("Unexpected error uploading videos:", error);
      return {
        success: false,
        error: "An unexpected error occurred while uploading videos",
      };
    }
  }

  /**
   * Delete media files
   */
  static async deleteMedia(
    mediaIds: string[],
    type: "image" | "video"
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const tableName =
        type === "image" ? "gemstone_images" : "gemstone_videos";

      // Get media records to get URLs for storage deletion
      const { data: mediaRecords, error: fetchError } = await (
        supabaseAdmin || supabase
      )
        .from(tableName)
        .select("id, image_url, video_url, original_path")
        .in("id", mediaIds);

      if (fetchError) {
        return {
          success: false,
          error: `Failed to fetch media records: ${fetchError.message}`,
        };
      }

      // Delete from database
      const { error: dbError } = await (supabaseAdmin || supabase)
        .from(tableName)
        .delete()
        .in("id", mediaIds);

      if (dbError) {
        return {
          success: false,
          error: `Failed to delete media records: ${dbError.message}`,
        };
      }

      // Delete from storage (optional - storage cleanup can be done separately)
      const storagePaths =
        mediaRecords
          ?.map((record) => {
            // Handle both image and video records safely
            if ("original_path" in record && record.original_path) {
              return record.original_path;
            }
            return null;
          })
          .filter((path): path is string => path !== null) || [];
      if (storagePaths.length > 0) {
        const { error: storageError } = await (
          supabaseAdmin || supabase
        ).storage
          .from("gemstone-media")
          .remove(storagePaths);

        if (storageError) {
          console.warn("Failed to delete files from storage:", storageError);
          // Don't fail the operation if storage cleanup fails
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Unexpected error deleting media:", error);
      return {
        success: false,
        error: "An unexpected error occurred while deleting media",
      };
    }
  }

  /**
   * Get media for a gemstone
   */
  static async getGemstoneMedia(gemstoneId: string): Promise<{
    success: boolean;
    data?: { images: DatabaseGemstoneImage[]; videos: DatabaseGemstoneVideo[] };
    error?: string;
  }> {
    try {
      // Use admin client if available (server-side), otherwise use regular client
      const client = supabaseAdmin || supabase;

      const [imagesResult, videosResult] = await Promise.all([
        client
          .from("gemstone_images")
          .select("*")
          .eq("gemstone_id", gemstoneId)
          .order("image_order"),
        client
          .from("gemstone_videos")
          .select("*")
          .eq("gemstone_id", gemstoneId)
          .order("video_order"),
      ]);

      if (imagesResult.error) {
        return {
          success: false,
          error: `Failed to fetch images: ${imagesResult.error.message}`,
        };
      }

      if (videosResult.error) {
        return {
          success: false,
          error: `Failed to fetch videos: ${videosResult.error.message}`,
        };
      }

      return {
        success: true,
        data: {
          images: imagesResult.data || [],
          videos: videosResult.data || [],
        },
      };
    } catch (error) {
      console.error("Unexpected error fetching media:", error);
      return {
        success: false,
        error: "An unexpected error occurred while fetching media",
      };
    }
  }

  /**
   * Set primary image for a gemstone
   */
  static async setPrimaryImage(
    gemstoneId: string,
    imageId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = supabaseAdmin || supabase;

      // First, unset all primary flags for this gemstone
      await client
        .from("gemstone_images")
        .update({ is_primary: false })
        .eq("gemstone_id", gemstoneId);

      // Then set the selected image as primary
      const { error } = await client
        .from("gemstone_images")
        .update({ is_primary: true })
        .eq("id", imageId)
        .eq("gemstone_id", gemstoneId);

      if (error) {
        return {
          success: false,
          error: `Failed to set primary image: ${error.message}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Unexpected error setting primary image:", error);
      return {
        success: false,
        error: "An unexpected error occurred while setting primary image",
      };
    }
  }

  /**
   * Set primary video for a gemstone
   */
  static async setPrimaryVideo(
    gemstoneId: string,
    videoId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = supabaseAdmin || supabase;

      // Note: Videos don't have is_primary field, but we can use video_order = 0 to indicate primary
      // First, set all videos to order > 0
      await client
        .from("gemstone_videos")
        .update({ video_order: 1 })
        .eq("gemstone_id", gemstoneId);

      // Then set the selected video as primary (order = 0)
      const { error } = await client
        .from("gemstone_videos")
        .update({ video_order: 0 })
        .eq("id", videoId)
        .eq("gemstone_id", gemstoneId);

      if (error) {
        return {
          success: false,
          error: `Failed to set primary video: ${error.message}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Unexpected error setting primary video:", error);
      return {
        success: false,
        error: "An unexpected error occurred while setting primary video",
      };
    }
  }

  /**
   * Validate image file
   */
  private static validateImageFile(file: File): {
    valid: boolean;
    error?: string;
  } {
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { valid: false, error: `Unsupported image type: ${file.type}` };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Image file too large. Maximum size is ${
          this.MAX_FILE_SIZE / 1024 / 1024
        }MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate video file
   */
  private static validateVideoFile(file: File): {
    valid: boolean;
    error?: string;
  } {
    if (!this.ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return { valid: false, error: `Unsupported video type: ${file.type}` };
    }

    if (file.size > this.MAX_VIDEO_SIZE) {
      return {
        valid: false,
        error: `Video file too large. Maximum size is ${
          this.MAX_VIDEO_SIZE / 1024 / 1024
        }MB`,
      };
    }

    return { valid: true };
  }
}
