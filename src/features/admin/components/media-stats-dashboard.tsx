"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  AlertTriangle,
  Database,
  FileVideo,
  Image as ImageIcon,
  RefreshCw,
  HardDrive,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useMediaStats } from "../hooks/use-media-stats-query";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Constructs a public Supabase storage URL from a storage path
 */
function getStorageUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.warn("NEXT_PUBLIC_SUPABASE_URL is not set");
    return "";
  }
  return `${supabaseUrl}/storage/v1/object/public/gemstone-media/${path}`;
}

/**
 * Checks if a file path is an image based on extension
 */
function isImageFile(path: string): boolean {
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"];
  const lowerPath = path.toLowerCase();
  return imageExtensions.some((ext) => lowerPath.endsWith(ext));
}

/**
 * Checks if a file path is a video based on extension
 */
function isVideoFile(path: string): boolean {
  const videoExtensions = [".mp4", ".mov", ".avi", ".webm", ".mkv"];
  const lowerPath = path.toLowerCase();
  return videoExtensions.some((ext) => lowerPath.endsWith(ext));
}

export function MediaStatsDashboard() {
  const t = useTranslations("admin.mediaStats");

  // Use React Query for data fetching with caching
  const { data: stats, isLoading, isFetching, error, refetch } = useMediaStats();

  const handleRefresh = () => {
    refetch();
  };

  // Progress tracking for loading state
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setElapsedTime(0);
      const startTime = Date.now();

      // Simulate progress based on typical operation time (20 seconds average)
      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setElapsedTime(Math.floor(elapsed));

        // Estimate progress: starts fast (DB queries), slows down (storage scan), finishes (analysis)
        // 0-30% in first 5s (DB queries)
        // 30-80% in next 15s (storage scanning)
        // 80-100% in final 5s (analysis)
        let estimatedProgress = 0;
        if (elapsed < 5) {
          estimatedProgress = (elapsed / 5) * 30;
        } else if (elapsed < 20) {
          estimatedProgress = 30 + ((elapsed - 5) / 15) * 50;
        } else {
          estimatedProgress = 80 + Math.min((elapsed - 20) / 5, 1) * 20;
        }
        setProgress(Math.min(estimatedProgress, 95)); // Cap at 95% until actually done
      }, 100);

      return () => clearInterval(progressInterval);
    } else {
      setProgress(100);
    }
  }, [isLoading]);

  if (isLoading) {
    const currentPhase =
      progress < 30
        ? "fetchingDatabase"
        : progress < 80
        ? "scanningStorage"
        : "analyzingData";

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t("title")}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t("description")}</p>
          </div>
        </div>

        {/* Loading State with Progress Indication */}
        <Card>
          <CardContent className="py-12">
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t("analyzing")}</span>
                  <span className="text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Phase Indicator */}
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  {currentPhase === "fetchingDatabase" &&
                    t("loadingPhases.fetchingDatabase")}
                  {currentPhase === "scanningStorage" &&
                    t("loadingPhases.scanningStorage")}
                  {currentPhase === "analyzingData" &&
                    t("loadingPhases.analyzingData")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("loadingPhases.elapsedTime", { seconds: elapsedTime })}
                </p>
              </div>

              {/* Spinner */}
              <div className="flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted rounded"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded mb-2"></div>
                <div className="h-3 w-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t("title")}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t("description")}</p>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                {t("failedToLoad")}
              </h3>
              <p className="text-red-700 dark:text-red-300 text-sm mb-4">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={isFetching}
                className="border-red-300 dark:border-red-700"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
                {t("retry")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Use actual counts from API response
  const totalOrphans =
    stats.orphanedImageCount +
    stats.orphanedVideoCount +
    stats.orphanedStorageFileCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t("description")}</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isFetching}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          {isFetching ? t("refreshing") : t("refresh")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("cards.totalImages")}
            </CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalImages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(stats.storageSize.images)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("cards.totalVideos")}
            </CardTitle>
            <FileVideo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalVideos.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(stats.storageSize.videos)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("cards.storageFiles")}
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalStorageFiles.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(stats.storageSize.total)}
            </p>
          </CardContent>
        </Card>

        <Card className={totalOrphans > 0 ? "border-yellow-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("cards.orphanedItems")}
            </CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${
                totalOrphans > 0 ? "text-yellow-600" : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalOrphans.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.orphanedImageCount.toLocaleString()} {t("orphaned.images")},{" "}
              {stats.orphanedVideoCount.toLocaleString()} {t("orphaned.videos")},{" "}
              {stats.orphanedStorageFileCount.toLocaleString()} {t("orphaned.files")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orphaned Items */}
      {totalOrphans > 0 && (
        <div className="space-y-4">
          {/* Orphaned Images */}
          {stats.orphanedImageCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-yellow-600" />
                  {t("orphaned.imageRecords")} ({stats.orphanedImageCount.toLocaleString()})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("orphaned.dbRecordsNoStorage")}
                  {stats.orphanedImages.length < stats.orphanedImageCount && (
                    <span className="ml-1 text-yellow-600">
                      ({t("orphaned.showingFirst", { count: stats.orphanedImages.length })})
                    </span>
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stats.orphanedImages.map((img) => (
                    <div
                      key={img.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      {/* Thumbnail */}
                      {img.image_url && (
                        <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                          <Image
                            src={img.image_url}
                            alt={img.original_filename || img.id}
                            fill
                            className="object-cover"
                            sizes="64px"
                            onError={(e) => {
                              // Hide image on error (file doesn't exist)
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {img.original_filename || img.id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("orphaned.gemstone")}: {img.gemstone_id.slice(0, 8)}...
                        </p>
                        {img.original_path && (
                          <p className="text-xs text-muted-foreground truncate">
                            {t("orphaned.path")}: {img.original_path}
                          </p>
                        )}
                      </div>
                      <Badge variant="destructive" className="ml-2 flex-shrink-0">
                        {t("orphaned.missingFile")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orphaned Videos */}
          {stats.orphanedVideoCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-yellow-600" />
                  {t("orphaned.videoRecords")} ({stats.orphanedVideoCount.toLocaleString()})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("orphaned.dbRecordsNoStorage")}
                  {stats.orphanedVideos.length < stats.orphanedVideoCount && (
                    <span className="ml-1 text-yellow-600">
                      ({t("orphaned.showingFirst", { count: stats.orphanedVideos.length })})
                    </span>
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stats.orphanedVideos.map((vid) => (
                    <div
                      key={vid.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      {/* Thumbnail */}
                      {vid.thumbnail_url ? (
                        <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                          <Image
                            src={vid.thumbnail_url}
                            alt={vid.original_filename || vid.id}
                            fill
                            className="object-cover"
                            sizes="64px"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 flex-shrink-0 rounded bg-muted flex items-center justify-center">
                          <FileVideo className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {vid.original_filename || vid.id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("orphaned.gemstone")}: {vid.gemstone_id.slice(0, 8)}...
                        </p>
                        {vid.original_path && (
                          <p className="text-xs text-muted-foreground truncate">
                            {t("orphaned.path")}: {vid.original_path}
                          </p>
                        )}
                      </div>
                      <Badge variant="destructive" className="ml-2 flex-shrink-0">
                        {t("orphaned.missingFile")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orphaned Storage Files */}
          {stats.orphanedStorageFileCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-yellow-600" />
                  {t("orphaned.storageFiles")} ({stats.orphanedStorageFileCount.toLocaleString()})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("orphaned.storageNoDb")}
                  {stats.orphanedStorageFiles.length < stats.orphanedStorageFileCount && (
                    <span className="ml-1 text-yellow-600">
                      ({t("orphaned.showingFirst", { count: stats.orphanedStorageFiles.length })})
                    </span>
                  )}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stats.orphanedStorageFiles.map((file, idx) => {
                    const storageUrl = getStorageUrl(file.path);
                    const isImage = isImageFile(file.path);
                    const isVideo = isVideoFile(file.path);
                    
                    return (
                      <div
                        key={`${file.path}-${idx}`}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        {/* Thumbnail */}
                        {isImage && storageUrl ? (
                          <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                            <Image
                              src={storageUrl}
                              alt={file.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        ) : isVideo ? (
                          <div className="h-16 w-16 flex-shrink-0 rounded bg-muted flex items-center justify-center">
                            <FileVideo className="h-6 w-6 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="h-16 w-16 flex-shrink-0 rounded bg-muted flex items-center justify-center">
                            <HardDrive className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {file.path}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(file.size)} •{" "}
                            {new Date(file.lastModified).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="destructive" className="ml-2 flex-shrink-0">
                          {t("orphaned.noDbRecord")}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No Orphans Message */}
      {totalOrphans === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <Database className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{t("noOrphans.title")}</h3>
            <p className="text-muted-foreground">{t("noOrphans.description")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
