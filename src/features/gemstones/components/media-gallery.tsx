"use client";

import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type {
  DatabaseGemstoneImage,
  DatabaseGemstoneVideo,
} from "@/shared/types";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface MediaGalleryProps {
  images: DatabaseGemstoneImage[];
  videos: DatabaseGemstoneVideo[];
  recommendedPrimaryIndex?: number | null; // AI-recommended primary image index (deprecated, use selectedImageUuid)
  selectedImageUuid?: string | null; // AI-selected primary image UUID
}

type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  order: number;
  isPrimary?: boolean;
  thumbnailUrl?: string;
  duration?: number;
};

export function MediaGallery({
  images,
  videos,
  recommendedPrimaryIndex,
  selectedImageUuid,
}: MediaGalleryProps) {
  const t = useTranslations("gemstones.media");
  const tErrors = useTranslations("errors.media");

  // Combine and sort media items
  const mediaItems: MediaItem[] = [
    ...images.map((img) => ({
      id: img.id,
      type: "image" as const,
      url: img.image_url,
      order: img.image_order,
      isPrimary: img.is_primary ?? undefined,
    })),
    ...videos.map((vid) => ({
      id: vid.id,
      type: "video" as const,
      url: vid.video_url,
      order: vid.video_order,
      thumbnailUrl: vid.thumbnail_url ?? undefined,
      duration: vid.duration_seconds ?? undefined,
    })),
  ].sort((a, b) => a.order - b.order);

  // Find the primary image index to start with
  // Priority: AI-selected UUID > AI-recommended index > is_primary from DB > first image
  let initialIndex = 0;

  if (selectedImageUuid) {
    // First priority: Find by UUID (most reliable)
    const uuidIndex = mediaItems.findIndex(
      (item) => item.id === selectedImageUuid
    );
    if (uuidIndex !== -1) {
      initialIndex = uuidIndex;
    }
  } else if (
    recommendedPrimaryIndex !== null &&
    recommendedPrimaryIndex !== undefined &&
    recommendedPrimaryIndex >= 0 &&
    recommendedPrimaryIndex < mediaItems.length
  ) {
    // Fallback to index-based selection (deprecated)
    initialIndex = recommendedPrimaryIndex;
  } else {
    // Final fallback to is_primary from database
    const primaryImageIndex = mediaItems.findIndex((item) => item.isPrimary);
    initialIndex = primaryImageIndex !== -1 ? primaryImageIndex : 0;
  }

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [imageError, setImageError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentMedia = mediaItems[currentIndex];

  // Video controls
  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleVideoSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = parseFloat(e.target.value);
      videoRef.current.currentTime = time;
      setVideoCurrentTime(time);
    }
  };

  // Navigation
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
    setIsVideoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
    setIsVideoPlaying(false);
  };

  const goToMedia = (index: number) => {
    setCurrentIndex(index);
    setIsVideoPlaying(false);
  };

  // Download functionality
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(t("downloadFailed"), error);
    }
  };

  // Format time for video display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Reset video state when switching media
  useEffect(() => {
    if (currentMedia?.type === "video") {
      setIsVideoPlaying(false);
      setVideoCurrentTime(0);
    }
    // Reset image error when media changes
    setImageError(false);
  }, [currentIndex, currentMedia?.type]);

  if (mediaItems.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">{t("noMediaAvailable")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Media Display - Optimized for square gemstone images */}
      <div className="relative aspect-square bg-gradient-to-br from-muted/20 to-muted/40 rounded-xl overflow-hidden shadow-2xl group">
        {currentMedia.type === "image" ? (
          imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-muted/50">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">💎</div>
                <p className="text-sm">{tErrors("media.image")}</p>
                {currentMedia.isPrimary && (
                  <p className="text-xs mt-1">{tErrors("media.primary")}</p>
                )}
              </div>
            </div>
          ) : (
            <Image
              src={currentMedia.url}
              alt={t("gemstone")}
              fill
              className="object-contain transition-all duration-500 group-hover:scale-[1.02] p-2"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 50vw"
              priority
              onError={() => setImageError(true)}
            />
          )
        ) : (
          <div className="relative w-full h-full p-2">
            <video
              ref={videoRef}
              src={currentMedia.url}
              poster={currentMedia.thumbnailUrl}
              className="w-full h-full object-contain rounded-lg"
              muted={isVideoMuted}
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />

            {/* Video Controls Overlay */}
            <div className="absolute inset-2 bg-black/20 dark:bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleVideoPlay}
                  className="w-16 h-16 rounded-full bg-background/95 hover:bg-background shadow-xl backdrop-blur-sm"
                >
                  {isVideoPlaying ? (
                    <Pause className="w-8 h-8 text-foreground" />
                  ) : (
                    <Play className="w-8 h-8 text-foreground ml-1" />
                  )}
                </Button>
              </div>

              {/* Video Progress and Controls */}
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                {videoDuration > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-white dark:text-foreground text-sm">
                      {formatTime(videoCurrentTime)}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max={videoDuration}
                      value={videoCurrentTime}
                      onChange={handleVideoSeek}
                      className="flex-1 h-1 bg-white/30 dark:bg-white/20 rounded-lg appearance-none slider"
                    />
                    <span className="text-white dark:text-foreground text-sm">
                      {formatTime(videoDuration)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleVideoMute}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20"
                  >
                    {isVideoMuted ? (
                      <VolumeX className="w-4 h-4 text-white dark:text-foreground" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white dark:text-foreground" />
                    )}
                  </Button>

                  {currentMedia.duration && (
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-white dark:bg-white/10 dark:text-foreground"
                    >
                      {formatTime(currentMedia.duration)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Type Badge */}
        {/* <div className="absolute top-4 left-4">
          <Badge
            variant={currentMedia.type === "video" ? "destructive" : "default"}
          >
            {currentMedia.type === "video" ? t("video") : t("image")}
            {currentMedia.isPrimary && ` • ${t("primary")}`}
          </Badge>
        </div> */}

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsLightboxOpen(true)}
            className="bg-background/95 hover:bg-background shadow-lg hover:shadow-xl backdrop-blur-sm border border-border h-9 w-9 transition-all duration-200"
          >
            <Expand className="w-4 h-4 text-foreground" />
          </Button>
          {/* <Button
            variant="secondary"
            size="icon"
            onClick={() =>
              handleDownload(
                currentMedia.url,
                `gemstone-${currentMedia.type}-${currentMedia.id}`
              )
            }
            className="bg-background/95 hover:bg-background shadow-lg hover:shadow-xl backdrop-blur-sm border border-border h-9 w-9 transition-all duration-200"
          >
            <Download className="w-4 h-4 text-foreground" />
          </Button> */}
        </div>

        {/* Navigation Arrows */}
        {mediaItems.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-background/95 hover:bg-background shadow-lg hover:shadow-xl backdrop-blur-sm border border-border h-10 w-10"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={goToNext}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-background/95 hover:bg-background shadow-lg hover:shadow-xl backdrop-blur-sm border border-border h-10 w-10"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </Button>
          </>
        )}

        {/* Media Counter */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <Badge
              variant="secondary"
              className="bg-black/50 text-white dark:bg-black/70 dark:text-foreground backdrop-blur-sm"
            >
              {currentIndex + 1} / {mediaItems.length}
            </Badge>
          </div>
        )}
      </div>

      {/* Thumbnail Navigation - Optimized for square images */}
      {mediaItems.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {mediaItems.map((media, index) => (
            <button
              key={media.id}
              onClick={() => goToMedia(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 bg-gradient-to-br from-muted/20 to-muted/40 ${
                index === currentIndex
                  ? "border-primary ring-2 ring-primary/30 shadow-lg scale-105"
                  : "border-border hover:border-primary/50 hover:shadow-md hover:scale-102"
              }`}
            >
              {media.type === "image" ? (
                <Image
                  src={media.url}
                  alt={t("thumbnail")}
                  fill
                  className="object-contain p-1"
                  sizes="80px"
                />
              ) : (
                <div className="relative w-full h-full bg-muted">
                  {media.thumbnailUrl ? (
                    <Image
                      src={media.thumbnailUrl}
                      alt={t("videoThumbnail")}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Play className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 dark:bg-black/30 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white dark:text-foreground" />
                  </div>
                </div>
              )}

              {media.isPrimary && (
                <div className="absolute top-1 left-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 dark:bg-black/98">
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 z-10 text-white dark:text-foreground hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200 backdrop-blur-sm bg-black/20 dark:bg-black/30 border border-white/10 dark:border-white/20 h-10 w-10 rounded-full hover:scale-110"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Lightbox Content */}
            {currentMedia.type === "image" ? (
              <div className="relative w-full h-full">
                <Image
                  src={currentMedia.url}
                  alt={t("gemstone")}
                  fill
                  className="object-contain"
                  sizes="95vw"
                  priority
                />
              </div>
            ) : (
              <video
                src={currentMedia.url}
                controls
                className="max-w-full max-h-full object-contain"
                autoPlay
              />
            )}

            {/* Lightbox Navigation */}
            {mediaItems.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPrevious}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white dark:text-foreground hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200 backdrop-blur-sm bg-black/20 dark:bg-black/30 border border-white/10 dark:border-white/20 h-12 w-12 rounded-full hover:scale-110 min-h-[48px] min-w-[48px]"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNext}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white dark:text-foreground hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200 backdrop-blur-sm bg-black/20 dark:bg-black/30 border border-white/10 dark:border-white/20 h-12 w-12 rounded-full hover:scale-110 min-h-[48px] min-w-[48px]"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}

            {/* Lightbox Counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Badge
                variant="secondary"
                className="bg-black/50 text-white dark:bg-black/70 dark:text-foreground"
              >
                {currentIndex + 1} / {mediaItems.length}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
