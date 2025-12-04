"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";

/**
 * Media statistics data structure returned from the API
 */
export interface MediaStats {
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
    thumbnail_url: string | null;
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
  // Actual counts (may be more than displayed items due to pagination)
  orphanedImageCount: number;
  orphanedVideoCount: number;
  orphanedStorageFileCount: number;
}

/**
 * Fetches media statistics from the admin API
 */
async function fetchMediaStats(): Promise<MediaStats> {
  const response = await fetch("/api/admin/media/stats");

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to fetch media statistics");
  }

  const result = await response.json();
  if (result.success && result.data) {
    return result.data;
  }

  throw new Error("Invalid response format");
}

/**
 * React Query hook for fetching media statistics
 *
 * Features:
 * - Automatic caching with 5-minute stale time
 * - Built-in loading and error states
 * - Manual refetch capability
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading, error, refetch } = useMediaStats();
 * ```
 */
export function useMediaStats() {
  return useQuery({
    queryKey: queryKeys.admin.mediaStats.stats(),
    queryFn: fetchMediaStats,
    staleTime: 5 * 60 * 1000, // 5 minutes - media stats don't change frequently
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}
