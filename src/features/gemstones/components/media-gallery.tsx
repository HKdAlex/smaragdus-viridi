"use client";

import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import type {
  DatabaseGemstoneImage,
  DatabaseGemstoneVideo,
} from "@/shared/types";
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
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { useTranslations } from "next-intl";
import Image from "next/image";

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
  } else {
    // Final fallback to is_primary from database
    const primaryImageIndex = mediaItems.findIndex((item) => item.isPrimary);
    if (primaryImageIndex !== -1) {
      initialIndex = primaryImageIndex;
    } else if (
      recommendedPrimaryIndex !== null &&
      recommendedPrimaryIndex !== undefined &&
      recommendedPrimaryIndex >= 0 &&
      recommendedPrimaryIndex < mediaItems.length
    ) {
      // Fallback to index-based selection (deprecated)
      initialIndex = recommendedPrimaryIndex;
    } else {
      // Ultimate fallback to first image
      initialIndex = 0;
    }
  }

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true); // Start as true since videos autoplay
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

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
    // Videos will autoplay via useEffect
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
    // Videos will autoplay via useEffect
  };

  const goToMedia = (index: number) => {
    setCurrentIndex(index);
    // Videos will autoplay via useEffect
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

  // Reset video state when switching media and ensure autoplay
  useEffect(() => {
    if (currentMedia?.type === "video" && videoRef.current) {
      setIsVideoPlaying(true); // Videos autoplay
      setVideoCurrentTime(0);
      setVideoError(false);
      
      const video = videoRef.current;
      let retryCount = 0;
      let isRetrying = false; // Prevent multiple simultaneous retries
      const maxRetries = 5; // Increased retries for files that may need time after upload
      const retryDelay = 2000; // 2 seconds - files may need time to be fully available
      
      // Check if browser supports MP4 codec
      const checkCodecSupport = () => {
        // Check for common MP4 codecs
        const codecs = [
          'video/mp4; codecs="avc1.42E01E"', // H.264 Baseline
          'video/mp4; codecs="avc1.4D401E"', // H.264 Main
          'video/mp4; codecs="avc1.64001E"', // H.264 High
          'video/mp4', // Generic MP4
        ];
        
        for (const codec of codecs) {
          if (video.canPlayType(codec) !== '') {
            console.log(`[MediaGallery] Browser supports codec: ${codec}`);
            return true;
          }
        }
        
        console.warn("[MediaGallery] Browser may not support MP4 codec");
        return false;
      };
      
      // Verify video URL is accessible (optional check)
      const verifyUrl = async () => {
        try {
          const response = await fetch(currentMedia.url, { 
            method: "HEAD",
            mode: "cors",
          });
          if (!response.ok) {
            console.error("[MediaGallery] Video URL not accessible:", {
              status: response.status,
              statusText: response.statusText,
              url: currentMedia.url,
              headers: Object.fromEntries(response.headers.entries()),
            });
            // If 404, the file doesn't exist
            if (response.status === 404) {
              setVideoError(true);
              setIsVideoPlaying(false);
            }
          } else {
            const contentType = response.headers.get("content-type");
            const contentLength = response.headers.get("content-length");
            console.log("[MediaGallery] Video URL verified:", {
              status: response.status,
              contentType,
              contentLength,
              url: currentMedia.url,
            });
            
            // Check if content-type matches expected video type
            if (contentType && !contentType.startsWith("video/")) {
              console.warn("[MediaGallery] Unexpected content-type:", contentType);
            }
          }
        } catch (error) {
          console.warn("[MediaGallery] Could not verify video URL (CORS may be blocking):", error);
          // CORS issue - this is OK, video element will try anyway
          // Don't set error - let the video element handle it
        }
      };
      
      // Wait for video to be ready before attempting to play
      const attemptPlay = () => {
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsVideoPlaying(true);
                setVideoError(false);
                console.log("[MediaGallery] Video playing successfully");
              })
              .catch((error) => {
                // NotSupportedError usually means codec/format issue
                // Other errors might be autoplay policy (which is OK, user can click play)
                if (error.name === "NotSupportedError") {
                  console.error("[MediaGallery] Video format not supported:", {
                    error,
                    url: currentMedia.url,
                    videoElement: video,
                    readyState: video.readyState,
                    networkState: video.networkState,
                  });
                  setVideoError(true);
                  setIsVideoPlaying(false);
                } else {
                  // Autoplay was prevented (common and OK)
                  console.log("[MediaGallery] Video autoplay prevented (user interaction may be required):", error.name);
                  setIsVideoPlaying(false);
                  // Don't set error state for autoplay prevention
                }
              });
          }
        } else {
          // Video not ready yet, wait for loadeddata event
          video.addEventListener("loadeddata", attemptPlay, { once: true });
        }
      };
      
      // Try loading video as blob URL (fallback for codec/CORS issues)
      const tryBlobUrlFallback = async (): Promise<boolean> => {
        try {
          console.log("[MediaGallery] Attempting blob URL fallback...");
          const response = await fetch(currentMedia.url, {
            mode: "cors",
            cache: "no-cache",
          });
          
          if (!response.ok) {
            console.error("[MediaGallery] Blob fetch failed:", response.status);
            return false;
          }
          
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          // Try loading with blob URL
          video.src = blobUrl;
          video.load();
          
          // Wait for video to load
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Timeout"));
            }, 5000);
            
            const onLoadedData = () => {
              clearTimeout(timeout);
              video.removeEventListener("error", onError);
              video.removeEventListener("loadeddata", onLoadedData);
              resolve();
            };
            
            const onError = () => {
              clearTimeout(timeout);
              video.removeEventListener("error", onError);
              video.removeEventListener("loadeddata", onLoadedData);
              URL.revokeObjectURL(blobUrl);
              reject(new Error("Video error"));
            };
            
            video.addEventListener("loadeddata", onLoadedData, { once: true });
            video.addEventListener("error", onError, { once: true });
          });
          
          console.log("[MediaGallery] Blob URL fallback successful!");
          // Clean up blob URL after video starts playing
          video.addEventListener("playing", () => {
            URL.revokeObjectURL(blobUrl);
          }, { once: true });
          
          return true;
        } catch (error) {
          console.warn("[MediaGallery] Blob URL fallback failed:", error);
          return false;
        }
      };
      
      // Retry mechanism for video loading
      const retryLoad = async () => {
        if (isRetrying || retryCount >= maxRetries) {
          if (retryCount >= maxRetries && !isRetrying) {
            // Last resort: try blob URL fallback
            console.log("[MediaGallery] All retries exhausted, trying blob URL fallback...");
            const blobSuccess = await tryBlobUrlFallback();
            if (!blobSuccess) {
              console.error("[MediaGallery] All methods failed, showing error");
              setVideoError(true);
              setIsVideoPlaying(false);
            }
          }
          return;
        }
        
        isRetrying = true;
        retryCount++;
        const delay = retryDelay * retryCount; // Exponential backoff
        console.log(`[MediaGallery] Retrying video load (attempt ${retryCount}/${maxRetries}) after ${delay}ms...`);
        
        setTimeout(async () => {
          // First verify the URL is still accessible
          try {
            const response = await fetch(currentMedia.url, { 
              method: "HEAD",
              cache: "no-cache",
            });
            if (!response.ok) {
              console.error(`[MediaGallery] Retry ${retryCount}: URL still not accessible (${response.status})`);
              isRetrying = false;
              if (retryCount >= maxRetries) {
                const blobSuccess = await tryBlobUrlFallback();
                if (!blobSuccess) {
                  setVideoError(true);
                }
              }
              return;
            }
          } catch (error) {
            console.warn(`[MediaGallery] Retry ${retryCount}: Could not verify URL:`, error);
          }
          
          // Reset video source to trigger reload (with cache-busting)
          const url = new URL(currentMedia.url);
          url.searchParams.set("_t", Date.now().toString()); // Cache-busting
          const currentSrc = video.src;
          video.src = '';
          video.load(); // Reset the video element
          
          setTimeout(() => {
            video.src = url.toString();
            video.load(); // Reload with the source
            
            // Try to play after reload
            setTimeout(() => {
              isRetrying = false;
              if (video.readyState >= 2) {
                video.play().catch((error) => {
                  console.warn(`[MediaGallery] Retry ${retryCount}: Play failed:`, error.name);
                });
              }
            }, 500);
          }, 200);
        }, delay);
      };
      
      // Check codec support
      checkCodecSupport();
      
      // Verify URL accessibility (non-blocking)
      verifyUrl();
      
      // Set up error handler with retry BEFORE attempting to play
      const errorHandler = () => {
        const error = video.error;
        if (error && error.code === 4) {
          console.warn("[MediaGallery] Video error code 4 detected:", {
            code: error.code,
            message: error.message,
            retryCount,
            maxRetries,
            isRetrying,
            url: currentMedia.url,
          });
          
          // Only trigger retry if not already retrying
          if (!isRetrying && retryCount < maxRetries) {
            retryLoad();
          } else if (!isRetrying && retryCount >= maxRetries) {
            // Try blob URL fallback as last resort
            tryBlobUrlFallback().then((success) => {
              if (!success) {
                console.error("[MediaGallery] All methods failed, showing error");
                setVideoError(true);
                setIsVideoPlaying(false);
              }
            });
          }
        } else if (error) {
          // Other error codes - don't retry, just show error
          console.error("[MediaGallery] Video error (non-retryable):", {
            code: error.code,
            message: error.message,
          });
          setVideoError(true);
          setIsVideoPlaying(false);
        }
      };
      
      video.addEventListener("error", errorHandler);
      
      // Add a small delay before first play attempt
      // This helps with files that were just uploaded and may need a moment to be fully available
      // Even though the file exists (HEAD request succeeds), playback might need a brief delay
      setTimeout(() => {
        // Try to play immediately if ready, otherwise wait
        attemptPlay();
      }, 500); // 500ms delay for newly uploaded files
      
      // Cleanup listeners if component unmounts
      return () => {
        video.removeEventListener("loadeddata", attemptPlay);
        video.removeEventListener("error", errorHandler);
      };
    }
    // Reset image error when media changes
    setImageError(false);
  }, [currentIndex, currentMedia?.type, currentMedia?.url]);

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
        ) : videoError ? (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <div className="text-center text-muted-foreground px-4">
              <div className="text-4xl mb-2">🎥</div>
              <p className="text-sm font-medium mb-1">
                {tErrors("media.gemstone") || "Video failed to load"}
              </p>
              <p className="text-xs opacity-75 mb-2">
                The video format may not be supported or the file may not be accessible.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Try to open video in new tab as fallback
                  window.open(currentMedia.url, "_blank");
                }}
                className="mt-2"
              >
                Open Video Directly
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full p-2">
            <video
              ref={videoRef}
              src={currentMedia.url}
              poster={currentMedia.thumbnailUrl}
              className="w-full h-full object-contain rounded-lg"
              muted={isVideoMuted}
              autoPlay
              loop
              playsInline
              preload="metadata"
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onError={(e) => {
                const video = e.currentTarget as HTMLVideoElement;
                const error = video.error;
                
                // Error codes:
                // 1 = MEDIA_ERR_ABORTED - fetching aborted
                // 2 = MEDIA_ERR_NETWORK - network error
                // 3 = MEDIA_ERR_DECODE - decoding error
                // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED - format not supported or source not accessible
                const errorDetails = {
                  code: error?.code,
                  message: error?.message,
                  url: currentMedia.url,
                  networkState: video.networkState,
                  readyState: video.readyState,
                  errorNames: {
                    1: "MEDIA_ERR_ABORTED",
                    2: "MEDIA_ERR_NETWORK", 
                    3: "MEDIA_ERR_DECODE",
                    4: "MEDIA_ERR_SRC_NOT_SUPPORTED",
                  },
                };
                
                const errorName = errorDetails.errorNames[error?.code as keyof typeof errorDetails.errorNames] || "UNKNOWN";
                console.error(`[MediaGallery] Video error (${errorName}):`, errorDetails);
                
                // Show error for all actual errors (code 1-4)
                // Code 0 means no error
                if (error && error.code !== 0 && error.code !== undefined) {
                  setVideoError(true);
                  setIsVideoPlaying(false);
                  
                  // For code 4 (not supported), try to verify if URL is accessible
                  if (error.code === 4) {
                    console.warn("[MediaGallery] Video format may not be supported or file may not be accessible:", currentMedia.url);
                    // Could add a fetch check here to verify URL accessibility
                  }
                }
              }}
              onLoadStart={() => {
                console.log("[MediaGallery] Video loading:", currentMedia.url);
                setVideoError(false);
              }}
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

        {/* Swipe Indicator */}
        {isSwiping && mediaItems.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/30 dark:bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
              <p className="text-white dark:text-foreground text-sm font-medium">
                {touchStart && touchEnd && touchStart - touchEnd > 0
                  ? "← Swipe left for next"
                  : "→ Swipe right for previous"}
              </p>
            </div>
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
                      alt={t("thumbnail")}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <video
                      src={media.url}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 dark:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

            {/* Lightbox Swipe Indicator */}
            {isSwiping && mediaItems.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 dark:bg-black/70 backdrop-blur-sm rounded-full px-6 py-3">
                  <p className="text-white dark:text-foreground text-base font-medium">
                    {touchStart && touchEnd && touchStart - touchEnd > 0
                      ? "← Swipe left for next"
                      : "→ Swipe right for previous"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
