"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import type {
  DatabaseGemstoneImage,
  DatabaseGemstoneVideo,
} from "@/shared/types";
import {
  Edit2,
  GripVertical,
  Image as ImageIcon,
  Play,
  Star,
  StarOff,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  MediaUploadService,
  type MediaUploadResult,
  type UploadProgressCallback,
} from "../services/media-upload-service";
import { useVideoOptimizationStatus } from "../hooks/use-video-optimization-status";

interface EnhancedMediaUploadProps {
  gemstoneId?: string;
  serialNumber?: string;
  onUploadComplete?: (results: MediaUploadResult[]) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}

interface ExistingMedia {
  images: DatabaseGemstoneImage[];
  videos: DatabaseGemstoneVideo[];
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Helper to format duration in seconds to MM:SS format
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface UploadInfo {
  currentFileName: string;
  currentFileSize: number;
  currentFileIndex: number;
  totalFiles: number;
  totalSize: number;
  uploadedBytes: number;
  startTime: number;
}

export function EnhancedMediaUpload({
  gemstoneId,
  serialNumber,
  onUploadComplete,
  onUploadError,
  disabled = false,
}: EnhancedMediaUploadProps) {
  const t = useTranslations("admin.gemstoneForm");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadInfo, setUploadInfo] = useState<UploadInfo | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResult[]>([]);
  const [existingMedia, setExistingMedia] = useState<ExistingMedia>({
    images: [],
    videos: [],
  });
  const [loading, setLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{
    id: string;
    type: "image" | "video";
    index: number;
  } | null>(null);
  const [editingMedia, setEditingMedia] = useState<{
    id: string;
    type: "image" | "video";
    alt_text: string;
    has_watermark: boolean;
  } | null>(null);
  const [optimizationStatuses, setOptimizationStatuses] = useState<
    Map<string, { status: string; originalSize?: number; optimizedSize?: number; percentage?: number }>
  >(new Map());
  const [uploadedVideoIds, setUploadedVideoIds] = useState<string[]>([]);

  // Track video optimization status in real-time
  useVideoOptimizationStatus({
    videoIds: uploadedVideoIds,
    onStatusChange: (videoId, status) => {
      setOptimizationStatuses((prev) => {
        const newMap = new Map(prev);
        newMap.set(videoId, {
          status: status.status,
          originalSize: status.originalSize,
          optimizedSize: status.optimizedSize,
          percentage: status.optimizationPercentage,
        });
        return newMap;
      });
    },
    onComplete: (videoId, status) => {
      const originalSize = status.originalSize || 0;
      const optimizedSize = status.optimizedSize || 0;
      const percentage = status.optimizationPercentage || 0;
      
      console.log(
        `[EnhancedMediaUpload] Video ${videoId} optimized: ${formatFileSize(originalSize)} → ${formatFileSize(optimizedSize)} (${percentage.toFixed(1)}% reduction)`
      );
      
      // Show success notification
      if (percentage > 0) {
        alert(
          `Video optimized successfully!\n` +
          `Original: ${formatFileSize(originalSize)}\n` +
          `Optimized: ${formatFileSize(optimizedSize)}\n` +
          `Reduction: ${percentage.toFixed(1)}%\n` +
          `Status: Web-optimized ✓`
        );
      }
    },
    onError: (videoId, error) => {
      console.error(`[EnhancedMediaUpload] Video ${videoId} optimization failed:`, error);
      alert(`Video optimization failed: ${error}`);
    },
  });

  const loadExistingMedia = useCallback(async () => {
    if (!gemstoneId) return;

    setLoading(true);
    try {
      const result = await MediaUploadService.getGemstoneMedia(gemstoneId);
      if (result.success && result.data) {
        setExistingMedia(result.data);
      } else {
        console.error("Failed to load existing media:", result.error);
      }
    } catch (error) {
      console.error("Error loading existing media:", error);
    } finally {
      setLoading(false);
    }
  }, [gemstoneId]);

  // Load existing media when gemstoneId changes
  useEffect(() => {
    if (gemstoneId) {
      loadExistingMedia();
    }
  }, [gemstoneId, loadExistingMedia]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!gemstoneId || !serialNumber) {
        const errorMsg =
          "Gemstone ID and serial number are required for upload";
        console.error("[EnhancedMediaUpload]", errorMsg);
        onUploadError?.(errorMsg);
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Separate images and videos
        const imageFiles = acceptedFiles.filter((file) =>
          file.type.startsWith("image/")
        );
        const videoFiles = acceptedFiles.filter((file) =>
          file.type.startsWith("video/")
        );

        // Combine all files for tracking
        const allFiles = [...imageFiles, ...videoFiles];
        const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);
        const startTime = Date.now();

        console.log("[EnhancedMediaUpload] Starting upload:", {
          imageCount: imageFiles.length,
          videoCount: videoFiles.length,
          totalSize: formatFileSize(totalSize),
          gemstoneId,
        });

        // Initialize upload info
        setUploadInfo({
          currentFileName: allFiles[0]?.name || "",
          currentFileSize: allFiles[0]?.size || 0,
          currentFileIndex: 1,
          totalFiles: allFiles.length,
          totalSize,
          uploadedBytes: 0,
          startTime,
        });

        let allResults: MediaUploadResult[] = [];

        // Calculate progress distribution based on file sizes
        const totalImageSize = imageFiles.reduce((sum, f) => sum + f.size, 0);
        const totalVideoSize = videoFiles.reduce((sum, f) => sum + f.size, 0);

        // Allocate progress percentage based on file size ratio
        const imageProgressShare =
          totalSize > 0 ? (totalImageSize / totalSize) * 95 : 0;
        const videoProgressShare =
          totalSize > 0 ? (totalVideoSize / totalSize) * 95 : 0;

        // Upload images with real progress
        if (imageFiles.length > 0) {
          console.log("[EnhancedMediaUpload] Uploading images...");

          let currentImageIndex = 0;
          const handleImageProgress: UploadProgressCallback = (progress) => {
            // Map image progress (0-100) to allocated share (0 to imageProgressShare)
            const mappedProgress = (progress * imageProgressShare) / 100;
            setUploadProgress(Math.round(mappedProgress));

            // Update upload info with estimated bytes
            const estimatedBytes = (progress / 100) * totalImageSize;
            setUploadInfo((prev) =>
              prev
                ? {
                    ...prev,
                    currentFileName:
                      imageFiles[currentImageIndex]?.name ||
                      prev.currentFileName,
                    currentFileSize:
                      imageFiles[currentImageIndex]?.size ||
                      prev.currentFileSize,
                    currentFileIndex: currentImageIndex + 1,
                    uploadedBytes: estimatedBytes,
                  }
                : null
            );
          };

          const imageResult = await MediaUploadService.uploadGemstoneImages(
            gemstoneId,
            imageFiles,
            serialNumber,
            handleImageProgress
          );

          if (imageResult.success && imageResult.data) {
            allResults = [...allResults, ...imageResult.data];
            setUploadProgress(Math.round(imageProgressShare));
            console.log(
              "[EnhancedMediaUpload] Images uploaded successfully:",
              imageResult.data.length
            );
          } else {
            const errorMsg = imageResult.error || "Failed to upload images";
            console.error(
              "[EnhancedMediaUpload] Image upload failed:",
              errorMsg
            );
            throw new Error(errorMsg);
          }
        }

        // Upload videos with real progress
        if (videoFiles.length > 0) {
          console.log("[EnhancedMediaUpload] Uploading videos...", {
            count: videoFiles.length,
            files: videoFiles.map((f) => ({
              name: f.name,
              size: f.size,
              type: f.type,
            })),
          });

          let currentVideoIndex = 0;
          const handleVideoProgress: UploadProgressCallback = (progress) => {
            // Map video progress (0-100) to allocated share (imageProgressShare to 95)
            const mappedProgress =
              imageProgressShare + (progress * videoProgressShare) / 100;
            setUploadProgress(Math.round(mappedProgress));

            // Update upload info with estimated bytes
            const estimatedBytes =
              totalImageSize + (progress / 100) * totalVideoSize;
            setUploadInfo((prev) =>
              prev
                ? {
                    ...prev,
                    currentFileName:
                      videoFiles[currentVideoIndex]?.name ||
                      prev.currentFileName,
                    currentFileSize:
                      videoFiles[currentVideoIndex]?.size ||
                      prev.currentFileSize,
                    currentFileIndex: imageFiles.length + currentVideoIndex + 1,
                    uploadedBytes: estimatedBytes,
                  }
                : null
            );
          };

          const videoResult = await MediaUploadService.uploadGemstoneVideos(
            gemstoneId,
            videoFiles,
            serialNumber,
            handleVideoProgress
          );

          if (videoResult.success && videoResult.data) {
            allResults = [...allResults, ...videoResult.data];
            
            // Track video IDs for optimization status monitoring
            const videoIds = videoResult.data
              .filter((r) => r.type === "video")
              .map((r) => r.id);
            setUploadedVideoIds((prev) => [...prev, ...videoIds]);
            
            // Initialize optimization statuses
            videoIds.forEach((id) => {
              setOptimizationStatuses((prev) => {
                const newMap = new Map(prev);
                newMap.set(id, { status: "pending" });
                return newMap;
              });
            });
            
            setUploadProgress(95);
            console.log(
              "[EnhancedMediaUpload] Videos uploaded successfully:",
              videoResult.data.length
            );
          } else {
            const errorMsg = videoResult.error || "Failed to upload videos";
            console.error(
              "[EnhancedMediaUpload] Video upload failed:",
              errorMsg,
              {
                result: videoResult,
              }
            );
            throw new Error(errorMsg);
          }
        }

        setUploadProgress(95);
        onUploadComplete?.(allResults);

        // Reload existing media to show new uploads
        await loadExistingMedia();

        // Clear uploadedMedia since items are now in existingMedia
        setUploadedMedia([]);

        setUploadProgress(100);
        console.log("[EnhancedMediaUpload] Upload completed successfully");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown upload error";
        console.error("[EnhancedMediaUpload] Upload error:", {
          error: errorMessage,
          originalError: error,
          gemstoneId,
          serialNumber,
        });
        onUploadError?.(errorMessage);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadInfo(null);
        console.log("[EnhancedMediaUpload] Upload finished, resetting state");
      }
    },
    [
      gemstoneId,
      serialNumber,
      onUploadComplete,
      onUploadError,
      loadExistingMedia,
    ]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
      "video/*": [".mp4", ".webm"],
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    disabled: isUploading || disabled,
  });

  const handleDeleteMedia = async (
    mediaId: string,
    type: "image" | "video"
  ) => {
    try {
      if (!gemstoneId) {
        const errorMsg = "Gemstone ID is required to delete media";
        console.error("[EnhancedMediaUpload] Delete failed:", errorMsg);
        onUploadError?.(errorMsg);
        return;
      }

      console.log("[EnhancedMediaUpload] Starting delete:", {
        gemstoneId,
        mediaId,
        type,
      });

      const result = await MediaUploadService.deleteMedia(
        gemstoneId,
        mediaId,
        type
      );

      if (result.success) {
        console.log("[EnhancedMediaUpload] Delete successful, updating UI:", {
          mediaId,
          type,
        });

        // Remove from existing media
        if (type === "image") {
          setExistingMedia((prev) => ({
            ...prev,
            images: prev.images.filter((img) => img.id !== mediaId),
          }));
        } else {
          setExistingMedia((prev) => ({
            ...prev,
            videos: prev.videos.filter((vid) => vid.id !== mediaId),
          }));
        }

        // Also remove from uploaded media if it exists there
        setUploadedMedia((prev) =>
          prev.filter((media) => media.id !== mediaId)
        );

        // Show warning if storage deletion failed
        if (result.warning) {
          console.warn("[EnhancedMediaUpload] Delete completed with warning:", {
            warning: result.warning,
            mediaId,
            type,
          });
          // Optionally show warning to user, but don't treat as error
          // since DB record was deleted successfully
        }
      } else {
        const errorMsg = result.error || "Failed to delete media";
        console.error("[EnhancedMediaUpload] Delete failed:", {
          error: errorMsg,
          mediaId,
          type,
        });
        onUploadError?.(errorMsg);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("[EnhancedMediaUpload] Delete error:", {
        error: errorMessage,
        originalError: error,
        mediaId,
        type,
      });
      onUploadError?.(errorMessage);
    }
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!gemstoneId) return;

    try {
      const result = await MediaUploadService.setPrimaryImage(
        gemstoneId,
        imageId
      );
      if (result.success) {
        // Update existing media to reflect the change
        setExistingMedia((prev) => ({
          ...prev,
          images: prev.images.map((img) => ({
            ...img,
            is_primary: img.id === imageId,
          })),
        }));
      } else {
        onUploadError?.(result.error || "Failed to set primary image");
      }
    } catch (error) {
      onUploadError?.((error as Error).message);
    }
  };

  const handleSetPrimaryVideo = async (videoId: string) => {
    if (!gemstoneId) return;

    try {
      const result = await MediaUploadService.setPrimaryVideo(
        gemstoneId,
        videoId
      );
      if (result.success) {
        // Update existing media to reflect the change
        setExistingMedia((prev) => ({
          ...prev,
          videos: prev.videos.map((vid) => ({
            ...vid,
            video_order: vid.id === videoId ? 0 : 1,
          })),
        }));
      } else {
        onUploadError?.(result.error || "Failed to set primary video");
      }
    } catch (error) {
      onUploadError?.((error as Error).message);
    }
  };

  const handleDragStart = (
    e: React.DragEvent,
    id: string,
    type: "image" | "video",
    index: number
  ) => {
    setDraggedItem({ id, type, index });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetIndex: number,
    type: "image" | "video"
  ) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.type !== type) {
      setDraggedItem(null);
      return;
    }

    const sourceIndex = draggedItem.index;
    if (sourceIndex === targetIndex) {
      setDraggedItem(null);
      return;
    }

    // Reorder the media items
    setExistingMedia((prev) => {
      if (type === "image") {
        const items = [...prev.images];
        const [removed] = items.splice(sourceIndex, 1);
        items.splice(targetIndex, 0, removed);

        // Update order values
        const updatedItems = items.map((item, idx) => ({
          ...item,
          image_order: idx,
        }));

        return { ...prev, images: updatedItems };
      } else {
        const items = [...prev.videos];
        const [removed] = items.splice(sourceIndex, 1);
        items.splice(targetIndex, 0, removed);

        // Update order values
        const updatedItems = items.map((item, idx) => ({
          ...item,
          video_order: idx,
        }));

        return { ...prev, videos: updatedItems };
      }
    });

    setDraggedItem(null);

    // TODO: Call API to persist the new order
    // This would require a new API endpoint to update media order
  };

  const handleEditMedia = (
    media: DatabaseGemstoneImage | DatabaseGemstoneVideo,
    type: "image" | "video"
  ) => {
    setEditingMedia({
      id: media.id,
      type,
      alt_text: (media as DatabaseGemstoneImage).alt_text || "",
      has_watermark: (media as DatabaseGemstoneImage).has_watermark ?? true,
    });
  };

  const handleSaveMediaEdit = async () => {
    if (!editingMedia || !gemstoneId) return;

    try {
      // Call API to update media metadata
      const response = await fetch(
        `/api/admin/gemstones/${gemstoneId}/media/${editingMedia.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            alt_text: editingMedia.alt_text,
            has_watermark: editingMedia.has_watermark,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update media metadata");
      }

      // Update local state
      setExistingMedia((prev) => {
        if (editingMedia.type === "image") {
          return {
            ...prev,
            images: prev.images.map((img) =>
              img.id === editingMedia.id
                ? {
                    ...img,
                    alt_text: editingMedia.alt_text,
                    has_watermark: editingMedia.has_watermark,
                  }
                : img
            ),
          };
        } else {
          return prev; // Videos don't have these fields yet
        }
      });

      setEditingMedia(null);
    } catch (error) {
      onUploadError?.((error as Error).message);
    }
  };

  const renderMediaItem = (
    media: DatabaseGemstoneImage | DatabaseGemstoneVideo,
    type: "image" | "video",
    index: number
  ) => {
    const isPrimary =
      type === "image"
        ? (media as DatabaseGemstoneImage).is_primary
        : (media as DatabaseGemstoneVideo).video_order === 0;

    const isDragging = draggedItem?.id === media.id;

    return (
      <div
        key={media.id}
        className={`relative group cursor-move ${
          isDragging ? "opacity-50" : ""
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, media.id, type, index)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index, type)}
      >
        {/* Drag handle */}
        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/90 rounded p-1">
            <GripVertical className="w-4 h-4 text-gray-600" />
          </div>
        </div>

        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border relative">
          {type === "image" ? (
            <img
              src={(media as DatabaseGemstoneImage).image_url}
              alt={media.original_filename || "Gemstone image"}
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              {(media as DatabaseGemstoneVideo).thumbnail_url ? (
                <img
                  src={(media as DatabaseGemstoneVideo).thumbnail_url!}
                  alt={media.original_filename || "Video thumbnail"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-8 h-8 text-gray-400" />
                </div>
              )}
              {/* Video play icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 dark:bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-3 shadow-lg">
                  <Play className="w-6 h-6 text-gray-900 dark:text-gray-100 fill-gray-900 dark:fill-gray-100" />
                </div>
              </div>
              {/* Video badge indicator - show only if not primary to avoid overlap */}
              {!isPrimary && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge variant="secondary" className="bg-blue-600 text-white text-xs font-semibold">
                    <Video className="w-3 h-3 mr-1" />
                    Video
                  </Badge>
                </div>
              )}
              {/* Duration indicator */}
              {(media as DatabaseGemstoneVideo).duration_seconds && (
                <div className="absolute bottom-2 right-2 z-10">
                  <Badge variant="secondary" className="bg-black/70 text-white text-xs font-mono">
                    {formatDuration((media as DatabaseGemstoneVideo).duration_seconds!)}
                  </Badge>
                </div>
              )}
            </>
          )}
        </div>

        {/* Primary indicator */}
        {isPrimary && (
          <div className="absolute top-2 left-2">
            <Badge variant="default" className="bg-yellow-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              Primary
            </Badge>
          </div>
        )}

        {/* Optimization status indicator for videos */}
        {type === "video" && (() => {
          const optStatus = optimizationStatuses.get(media.id);
          if (optStatus?.status === "processing") {
            return (
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" className="bg-blue-500 text-white">
                  Processing...
                </Badge>
              </div>
            );
          } else if (optStatus?.status === "completed" && optStatus.percentage) {
            return (
              <div className="absolute bottom-2 left-2">
                <Badge variant="default" className="bg-green-500 text-white">
                  ✓ Optimized ({optStatus.percentage.toFixed(0)}%)
                </Badge>
              </div>
            );
          } else if (optStatus?.status === "failed") {
            return (
              <div className="absolute bottom-2 left-2">
                <Badge variant="destructive">
                  Optimization Failed
                </Badge>
              </div>
            );
          } else if (optStatus?.status === "pending") {
            return (
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" className="bg-gray-500 text-white">
                  Pending...
                </Badge>
              </div>
            );
          }
          return null;
        })()}

        {/* Action buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {type === "image" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleEditMedia(media, type)}
              className="h-6 w-6 p-0"
              title="Edit metadata"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
          {!isPrimary && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                type === "image"
                  ? handleSetPrimaryImage(media.id)
                  : handleSetPrimaryVideo(media.id)
              }
              className="h-6 w-6 p-0"
              title={`Set as primary ${type}`}
            >
              <StarOff className="w-3 h-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDeleteMedia(media.id, type)}
            className="h-6 w-6 p-0"
            title={`Delete ${type}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        <div className="mt-1 text-xs text-gray-500 truncate">
          {media.original_filename || `${type} ${media.id.slice(0, 8)}`}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Upload className="w-5 h-5 text-gray-900 dark:text-gray-100" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {t("labels.mediaUpload")}
        </h3>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30"
                : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
            } ${
              isUploading || disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <input {...getInputProps()} />

            {isUploading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400 mx-auto" />

                {/* File info */}
                {uploadInfo && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs mx-auto">
                      {uploadInfo.currentFileName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      {uploadInfo.totalFiles > 1
                        ? `File ${uploadInfo.currentFileIndex} of ${uploadInfo.totalFiles}`
                        : formatFileSize(uploadInfo.currentFileSize)}
                    </p>
                  </div>
                )}

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>

                  {/* Progress details */}
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-300">
                    <span>{uploadProgress}%</span>
                    {uploadInfo && (
                      <span>
                        {formatFileSize(uploadInfo.uploadedBytes)} /{" "}
                        {formatFileSize(uploadInfo.totalSize)}
                      </span>
                    )}
                  </div>

                  {/* Upload speed estimation */}
                  {uploadInfo && uploadInfo.uploadedBytes > 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-400">
                      {(() => {
                        const elapsedSeconds =
                          (Date.now() - uploadInfo.startTime) / 1000;
                        const bytesPerSecond =
                          uploadInfo.uploadedBytes / elapsedSeconds;
                        const remainingBytes =
                          uploadInfo.totalSize - uploadInfo.uploadedBytes;
                        const remainingSeconds =
                          remainingBytes / bytesPerSecond;

                        if (remainingSeconds < 60) {
                          return `~${Math.ceil(remainingSeconds)}s remaining`;
                        } else if (remainingSeconds < 3600) {
                          return `~${Math.ceil(
                            remainingSeconds / 60
                          )}m remaining`;
                        }
                        return `~${Math.ceil(
                          remainingSeconds / 3600
                        )}h remaining`;
                      })()}
                      {" • "}
                      {(() => {
                        const elapsedSeconds =
                          (Date.now() - uploadInfo.startTime) / 1000;
                        const bytesPerSecond =
                          uploadInfo.uploadedBytes / elapsedSeconds;
                        return `${formatFileSize(bytesPerSecond)}/s`;
                      })()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl text-gray-400 dark:text-gray-500">
                  📷
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {isDragActive ? t("dropFiles") : t("uploadMedia")}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("dragDropDescription")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {t("supportedFormats")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Existing Media */}
      {(existingMedia.images.length > 0 || existingMedia.videos.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Existing Media
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                <p className="text-sm text-gray-600 mt-2">Loading media...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Images */}
                {existingMedia.images.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Images
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {existingMedia.images.map((image, index) =>
                        renderMediaItem(image, "image", index)
                      )}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {existingMedia.videos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Videos
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {existingMedia.videos.map((video, index) =>
                        renderMediaItem(video, "video", index)
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Uploaded Media Preview */}
      {uploadedMedia.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("uploadedMedia")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedMedia.map((media) => (
                <div key={media.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                    {media.type === "image" ? (
                      <img
                        src={media.url}
                        alt={media.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteMedia(media.id, media.type)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 truncate">
                    {media.originalName}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Media Dialog */}
      {editingMedia && (
        <Dialog
          open={!!editingMedia}
          onOpenChange={() => setEditingMedia(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Media Metadata</DialogTitle>
              <DialogDescription>
                Update the alt text and watermark status for this image
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Alt Text</label>
                <Input
                  value={editingMedia.alt_text}
                  onChange={(e) =>
                    setEditingMedia((prev) =>
                      prev ? { ...prev, alt_text: e.target.value } : null
                    )
                  }
                  placeholder="Describe the image..."
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_watermark"
                  checked={editingMedia.has_watermark}
                  onCheckedChange={(checked) =>
                    setEditingMedia((prev) =>
                      prev
                        ? { ...prev, has_watermark: checked as boolean }
                        : null
                    )
                  }
                />
                <label
                  htmlFor="has_watermark"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Has watermark
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMedia(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveMediaEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
