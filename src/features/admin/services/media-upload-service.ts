import type {
  DatabaseGemstoneImage,
  DatabaseGemstoneVideo,
} from "@/shared/types";

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

        const uploadResult = await this.uploadSingleFile({
          gemstoneId,
          mediaType: "image",
          file,
          serialNumber,
        });

        if (!uploadResult.success) {
          return uploadResult;
        }

        results.push({
          id: uploadResult.data.id,
          url: uploadResult.data.url,
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

        const uploadResult = await this.uploadSingleFile({
          gemstoneId,
          mediaType: "video",
          file,
          serialNumber,
        });

        if (!uploadResult.success) {
          return uploadResult;
        }

        results.push({
          id: uploadResult.data.id,
          url: uploadResult.data.url,
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
    gemstoneId: string,
    mediaId: string,
    type: "image" | "video"
  ): Promise<{ success: boolean; error?: string; warning?: string }> {
    try {
      console.log("[MediaUploadService] Deleting media:", {
        gemstoneId,
        mediaId,
        type,
      });

      const response = await fetch(`/api/admin/gemstones/${gemstoneId}/media`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaId,
          mediaType: type,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("[MediaUploadService] Delete failed:", {
          status: response.status,
          statusText: response.statusText,
          error: result.error,
          gemstoneId,
          mediaId,
          type,
        });
        return {
          success: false,
          error: result.error || "Failed to delete media",
        };
      }

      if (result.warning) {
        console.warn("[MediaUploadService] Delete completed with warning:", {
          warning: result.warning,
          gemstoneId,
          mediaId,
          type,
        });
      } else {
        console.log("[MediaUploadService] Delete successful:", {
          gemstoneId,
          mediaId,
          type,
        });
      }

      return { success: true, warning: result.warning };
    } catch (error) {
      console.error("[MediaUploadService] Unexpected error deleting media:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        gemstoneId,
        mediaId,
        type,
      });
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
      const response = await fetch(`/api/admin/gemstones/${gemstoneId}/media`);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Failed to fetch media",
        };
      }

      return { success: true, data: result.data };
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
      const response = await fetch(`/api/admin/gemstones/${gemstoneId}/media`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaId: imageId,
          mediaType: "image",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Failed to set primary image",
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
      const response = await fetch(`/api/admin/gemstones/${gemstoneId}/media`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaId: videoId,
          mediaType: "video",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || "Failed to set primary video",
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
   * Upload a single file via API route
   */
  private static async uploadSingleFile(params: {
    gemstoneId: string;
    mediaType: "image" | "video";
    file: File;
    serialNumber: string;
  }): Promise<
    | { success: true; data: { id: string; url: string } }
    | { success: false; error: string }
  > {
    const formData = new FormData();
    formData.append("gemstoneId", params.gemstoneId);
    formData.append("mediaType", params.mediaType);
    formData.append("serialNumber", params.serialNumber);
    formData.append("file", params.file);

    // Add timeout for large video files (10 minutes)
    const timeoutMs =
      params.mediaType === "video" ? 10 * 60 * 1000 : 2 * 60 * 1000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch("/api/admin/gemstones/media", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = `Upload failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response isn't JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error(`[MediaUploadService] Upload failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          mediaType: params.mediaType,
          fileName: params.file.name,
          fileSize: params.file.size,
        });
        return { success: false, error: errorMessage };
      }

      const result = await response.json();

      if (!result?.success) {
        const errorMessage = result?.error || "Upload failed";
        console.error(`[MediaUploadService] Upload failed:`, {
          error: errorMessage,
          mediaType: params.mediaType,
          fileName: params.file.name,
          result,
        });
        return { success: false, error: errorMessage };
      }

      const record = result.data;

      if (!record?.id || !record?.url) {
        const errorMessage =
          "Upload succeeded but response payload is incomplete";
        console.error(`[MediaUploadService] ${errorMessage}:`, {
          mediaType: params.mediaType,
          fileName: params.file.name,
          record,
        });
        return {
          success: false,
          error: errorMessage,
        };
      }

      console.log(`[MediaUploadService] Upload successful:`, {
        mediaType: params.mediaType,
        fileName: params.file.name,
        fileSize: params.file.size,
        id: record.id,
      });

      return {
        success: true,
        data: {
          id: record.id as string,
          url: record.url as string,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        const errorMessage = `Upload timeout after ${
          timeoutMs / 1000
        }s. File may be too large.`;
        console.error(`[MediaUploadService] ${errorMessage}:`, {
          mediaType: params.mediaType,
          fileName: params.file.name,
          fileSize: params.file.size,
        });
        return { success: false, error: errorMessage };
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Upload failed with unknown error";
      console.error(`[MediaUploadService] Upload error:`, {
        error: errorMessage,
        mediaType: params.mediaType,
        fileName: params.file.name,
        fileSize: params.file.size,
        originalError: error,
      });
      return { success: false, error: errorMessage };
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
