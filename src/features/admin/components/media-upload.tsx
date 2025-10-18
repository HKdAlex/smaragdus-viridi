"use client";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Upload, Video, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  MediaUploadService,
  type MediaUploadResult,
} from "../services/media-upload-service";

interface MediaUploadProps {
  gemstoneId?: string;
  serialNumber?: string;
  onUploadComplete?: (results: MediaUploadResult[]) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}

export function MediaUpload({
  gemstoneId,
  serialNumber,
  onUploadComplete,
  onUploadError,
  disabled = false,
}: MediaUploadProps) {
  const t = useTranslations("admin.gemstoneForm");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResult[]>([]);

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
