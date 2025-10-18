"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import type {
  DatabaseGemstoneImage,
  DatabaseGemstoneVideo,
} from "@/shared/types";
import {
  Image as ImageIcon,
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
} from "../services/media-upload-service";

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
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResult[]>([]);
  const [existingMedia, setExistingMedia] = useState<ExistingMedia>({
    images: [],
    videos: [],
  });
  const [loading, setLoading] = useState(false);

  // Load existing media when gemstoneId changes
  useEffect(() => {
    if (gemstoneId) {
      loadExistingMedia();
    }
  }, [gemstoneId]);

  const loadExistingMedia = async () => {
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
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!gemstoneId || !serialNumber) {
        onUploadError?.(
          "Gemstone ID and serial number are required for upload"
        );
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

        let allResults: MediaUploadResult[] = [];

        // Upload images
        if (imageFiles.length > 0) {
          setUploadProgress(25);
          const imageResult = await MediaUploadService.uploadGemstoneImages(
            gemstoneId,
            imageFiles,
            serialNumber
          );

          if (imageResult.success && imageResult.data) {
            allResults = [...allResults, ...imageResult.data];
          } else {
            throw new Error(imageResult.error || "Failed to upload images");
          }
        }

        // Upload videos
        if (videoFiles.length > 0) {
          setUploadProgress(75);
          const videoResult = await MediaUploadService.uploadGemstoneVideos(
            gemstoneId,
            videoFiles,
            serialNumber
          );

          if (videoResult.success && videoResult.data) {
            allResults = [...allResults, ...videoResult.data];
          } else {
            throw new Error(videoResult.error || "Failed to upload videos");
          }
        }

        setUploadProgress(100);
        setUploadedMedia((prev) => [...prev, ...allResults]);
        onUploadComplete?.(allResults);

        // Reload existing media to show new uploads
        await loadExistingMedia();
      } catch (error) {
        console.error("Upload error:", error);
        onUploadError?.((error as Error).message);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [gemstoneId, serialNumber, onUploadComplete, onUploadError]
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
      const result = await MediaUploadService.deleteMedia([mediaId], type);
      if (result.success) {
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
      } else {
        onUploadError?.(result.error || "Failed to delete media");
      }
    } catch (error) {
      onUploadError?.((error as Error).message);
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

  const renderMediaItem = (
    media: DatabaseGemstoneImage | DatabaseGemstoneVideo,
    type: "image" | "video"
  ) => {
    const isPrimary =
      type === "image"
        ? (media as DatabaseGemstoneImage).is_primary
        : (media as DatabaseGemstoneVideo).video_order === 0;

    return (
      <div key={media.id} className="relative group">
        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
          {type === "image" ? (
            <img
              src={(media as DatabaseGemstoneImage).image_url}
              alt={media.original_filename || "Gemstone image"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-8 h-8 text-gray-400" />
            </div>
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

        {/* Action buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
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
        <Upload className="w-5 h-5" />
        <h3 className="text-lg font-medium">{t("labels.mediaUpload")}</h3>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            } ${
              isUploading || disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <input {...getInputProps()} />

            {isUploading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                <p className="text-sm text-gray-600">{t("uploading")}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl text-gray-400">📷</div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? t("dropFiles") : t("uploadMedia")}
                </p>
                <p className="text-sm text-gray-600">
                  {t("dragDropDescription")}
                </p>
                <p className="text-xs text-gray-500">{t("supportedFormats")}</p>
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
                      {existingMedia.images.map((image) =>
                        renderMediaItem(image, "image")
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
                      {existingMedia.videos.map((video) =>
                        renderMediaItem(video, "video")
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
    </div>
  );
}
