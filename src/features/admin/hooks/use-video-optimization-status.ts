import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { DatabaseGemstoneVideo } from "@/shared/types";

interface VideoOptimizationStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  originalSize?: number;
  optimizedSize?: number;
  optimizationPercentage?: number;
}

interface UseVideoOptimizationStatusOptions {
  videoIds: string[];
  onStatusChange?: (videoId: string, status: VideoOptimizationStatus, videoData?: DatabaseGemstoneVideo) => void;
  onComplete?: (videoId: string, status: VideoOptimizationStatus, videoData?: DatabaseGemstoneVideo) => void;
  onError?: (videoId: string, error: string) => void;
}

/**
 * Hook to track video optimization status in real-time
 * Subscribes to gemstone_videos table changes via Supabase Realtime
 */
export function useVideoOptimizationStatus({
  videoIds,
  onStatusChange,
  onComplete,
  onError,
}: UseVideoOptimizationStatusOptions) {
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (videoIds.length === 0) {
      return;
    }

    // Set up real-time subscription
    // Subscribe to all updates on gemstone_videos, then filter in the callback
    const channel = supabase
      .channel("video-optimization-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "gemstone_videos",
        },
        (payload) => {
          // Filter to only process updates for videos we're tracking
          if (!videoIds.includes(payload.new.id)) {
            return;
          }
          const video = payload.new as DatabaseGemstoneVideo;
          const status: VideoOptimizationStatus = {
            id: video.id,
            status:
              (video.processing_status as "pending" | "processing" | "completed" | "failed") ||
              "pending",
            originalSize: video.original_size_bytes ?? undefined,
            optimizedSize: video.optimized_size_bytes ?? undefined,
            optimizationPercentage: video.optimization_percentage ?? undefined,
          };

          // Call status change callback with full video data
          onStatusChange?.(video.id, status, video);

          // Call completion callback if completed
          if (status.status === "completed") {
            onComplete?.(video.id, status, video);
          }

          // Call error callback if failed
          if (status.status === "failed") {
            // Get detailed error message from database
            const errorMessage = video.error_message || "Video optimization failed";
            onError?.(video.id, errorMessage);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[use-video-optimization-status] Subscribed to video optimization updates");
        }
      });

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [videoIds.join(","), onStatusChange, onComplete, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);
}

