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

export type UploadProgressCallback = (progress: number) => void;

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
    serialNumber: string,
    onProgress?: UploadProgressCallback
  ): Promise<{ success: boolean; data?: MediaUploadResult[]; error?: string }> {
    try {
      const results: MediaUploadResult[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file
        const validation = this.validateImageFile(file);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        // Calculate progress offset for this file
        const fileProgressStart = (i / totalFiles) * 100;
        const fileProgressRange = 100 / totalFiles;

        const uploadResult = await this.uploadSingleFile({
          gemstoneId,
          mediaType: "image",
          file,
          serialNumber,
          onProgress: onProgress
            ? (fileProgress) => {
                const overallProgress = fileProgressStart + (fileProgress * fileProgressRange) / 100;
                onProgress(Math.round(overallProgress));
              }
            : undefined,
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
    serialNumber: string,
    onProgress?: UploadProgressCallback
  ): Promise<{ success: boolean; data?: MediaUploadResult[]; error?: string }> {
    try {
      const results: MediaUploadResult[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file
        const validation = this.validateVideoFile(file);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        // Calculate progress offset for this file
        const fileProgressStart = (i / totalFiles) * 100;
        const fileProgressRange = 100 / totalFiles;

        const uploadResult = await this.uploadSingleFile({
          gemstoneId,
          mediaType: "video",
          file,
          serialNumber,
          onProgress: onProgress
            ? (fileProgress) => {
                const overallProgress = fileProgressStart + (fileProgress * fileProgressRange) / 100;
                onProgress(Math.round(overallProgress));
              }
            : undefined,
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
  static async getGemstoneMedia(gemstoneId: string, forceRefresh = false): Promise<{
    success: boolean;
    data?: { images: DatabaseGemstoneImage[]; videos: DatabaseGemstoneVideo[] };
    error?: string;
  }> {
    try {
      // Add cache-busting parameter for production to ensure fresh data
      const url = `/api/admin/gemstones/${gemstoneId}/media${forceRefresh ? `?t=${Date.now()}` : ""}`;
      const response = await fetch(url, {
        cache: forceRefresh ? "no-store" : "default",
      });
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
   * Upload a single file directly to Supabase Storage via signed URL.
   * This bypasses Vercel's 4.5MB body size limit by uploading directly from browser.
   * Uses XMLHttpRequest for real upload progress tracking.
   *
   * Flow:
   * 1. Request signed URL from API (5% progress)
   * 2. Upload directly to Supabase Storage with real progress (5-90%)
   * 3. Confirm upload and create DB record (90-100%)
   */
  private static async uploadSingleFile(params: {
    gemstoneId: string;
    mediaType: "image" | "video";
    file: File;
    serialNumber: string;
    onProgress?: UploadProgressCallback;
  }): Promise<
    | { success: true; data: { id: string; url: string } }
    | { success: false; error: string }
  > {
    const timeoutMs =
      params.mediaType === "video" ? 10 * 60 * 1000 : 5 * 60 * 1000;

    try {
      // Step 1: Get signed upload URL (0-5%)
      params.onProgress?.(0);
      console.log(`[MediaUploadService] Requesting signed URL...`, {
        fileName: params.file.name,
        fileSize: params.file.size,
        mediaType: params.mediaType,
      });

      const signedUrlResponse = await fetch(
        "/api/admin/gemstones/media/signed-url",
        {
        method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gemstoneId: params.gemstoneId,
            mediaType: params.mediaType,
            fileName: params.file.name,
            fileSize: params.file.size,
            mimeType: params.file.type,
            serialNumber: params.serialNumber,
          }),
        }
      );

      if (!signedUrlResponse.ok) {
        const errorData = await signedUrlResponse.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `Failed to get upload URL (${signedUrlResponse.status})`;
        console.error(`[MediaUploadService] Failed to get signed URL:`, {
          status: signedUrlResponse.status,
          error: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      const signedUrlResult = await signedUrlResponse.json();
      if (!signedUrlResult.success || !signedUrlResult.data?.signedUrl) {
        const errorMessage =
          signedUrlResult.error || "Failed to get signed URL";
        console.error(
          `[MediaUploadService] Invalid signed URL response:`,
          signedUrlResult
        );
        return { success: false, error: errorMessage };
      }

      const { signedUrl, storagePath } = signedUrlResult.data;
      params.onProgress?.(5);
      console.log(
        `[MediaUploadService] Got signed URL, uploading directly to storage...`
      );

      // Step 2: Upload directly to Supabase Storage with real progress (5-90%)
      const uploadResult = await this.uploadWithProgress(
        signedUrl,
        params.file,
        timeoutMs,
        (uploadProgress) => {
          // Map 0-100% upload progress to 5-90% overall progress
          const mappedProgress = 5 + (uploadProgress * 85) / 100;
          params.onProgress?.(Math.round(mappedProgress));
        }
      );

      if (!uploadResult.success) {
        return uploadResult;
      }

      params.onProgress?.(90);
      console.log(
        `[MediaUploadService] Direct upload successful, confirming...`
      );

      // Step 3: Confirm upload and create DB record (90-100%)
      const confirmResponse = await fetch(
        "/api/admin/gemstones/media/confirm",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gemstoneId: params.gemstoneId,
            mediaType: params.mediaType,
            storagePath,
            fileName: params.file.name,
            fileSize: params.file.size,
            serialNumber: params.serialNumber,
          }),
        }
      );

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          `Failed to confirm upload (${confirmResponse.status})`;
        console.error(`[MediaUploadService] Failed to confirm upload:`, {
          status: confirmResponse.status,
          error: errorMessage,
        });
        return { success: false, error: errorMessage };
      }

      const confirmResult = await confirmResponse.json();
      if (!confirmResult.success || !confirmResult.data?.id) {
        const errorMessage = confirmResult.error || "Failed to confirm upload";
        console.error(
          `[MediaUploadService] Invalid confirm response:`,
          confirmResult
        );
        return { success: false, error: errorMessage };
      }

      params.onProgress?.(100);
      console.log(`[MediaUploadService] Upload successful:`, {
        mediaType: params.mediaType,
        fileName: params.file.name,
        fileSize: params.file.size,
        id: confirmResult.data.id,
      });

      return {
        success: true,
        data: {
          id: confirmResult.data.id,
          url: confirmResult.data.url,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        const errorMessage = `Upload timeout after ${
          timeoutMs / 1000
        }s. File may be too large or connection too slow.`;
        console.error(`[MediaUploadService] ${errorMessage}`);
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
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Upload file using XMLHttpRequest for real progress tracking
   */
  private static uploadWithProgress(
    url: string,
    file: File,
    timeoutMs: number,
    onProgress?: UploadProgressCallback
  ): Promise<{ success: true } | { success: false; error: string }> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      // Set up timeout
      xhr.timeout = timeoutMs;

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      // Handle completion
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true });
        } else {
          console.error(`[MediaUploadService] XHR upload failed:`, {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText,
          });
          resolve({
            success: false,
            error: `Upload failed: ${xhr.statusText || xhr.status}`,
          });
        }
      };

      // Handle errors
      xhr.onerror = () => {
        console.error(`[MediaUploadService] XHR network error`);
        resolve({
          success: false,
          error: "Network error during upload",
        });
      };

      xhr.ontimeout = () => {
        console.error(`[MediaUploadService] XHR timeout after ${timeoutMs}ms`);
        resolve({
          success: false,
          error: `Upload timeout after ${timeoutMs / 1000}s`,
        });
      };

      xhr.onabort = () => {
        console.error(`[MediaUploadService] XHR aborted`);
        resolve({
          success: false,
          error: "Upload was aborted",
        });
      };

      // Start the upload
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
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
