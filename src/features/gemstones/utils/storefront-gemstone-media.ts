import type {
    DatabaseGemstoneImage,
    DatabaseGemstoneVideo,
} from "@/shared/types";

/**
 * Storefront (catalog detail, public API) must show media whenever the admin
 * panel can: use `gemstone_images` / `gemstone_videos` when rows have usable
 * URLs, otherwise fall back to `gemstones.primary_image_url` /
 * `primary_video_url` (maintained by DB triggers when a primary is set).
 *
 * This closes the gap where list RPC already synthesizes from primary_image_url
 * but the detail page only attached raw join results (empty → "No media").
 */
export function normalizeStorefrontGemstoneImages(
  gemstoneId: string,
  rawImages: DatabaseGemstoneImage[] | null | undefined,
  primaryImageUrl: string | null | undefined
): DatabaseGemstoneImage[] {
  const withUrls = (rawImages ?? []).filter(
    (row) => typeof row.image_url === "string" && row.image_url.trim().length > 0
  );
  withUrls.sort((a, b) => a.image_order - b.image_order);

  if (withUrls.length > 0) {
    return withUrls;
  }

  const fallback =
    typeof primaryImageUrl === "string" ? primaryImageUrl.trim() : "";
  if (fallback.length > 0) {
    const synthetic: DatabaseGemstoneImage = {
      id: `__storefront_primary_image__${gemstoneId}`,
      gemstone_id: gemstoneId,
      image_url: fallback,
      image_order: 0,
      is_primary: true,
      alt_text: null,
      ai_analysis_date: null,
      ai_primary_reasoning: null,
      ai_primary_score: null,
      created_at: null,
      has_watermark: null,
      image_type: null,
      original_filename: null,
      original_path: null,
    };
    return [synthetic];
  }

  return [];
}

export function normalizeStorefrontGemstoneVideos(
  gemstoneId: string,
  rawVideos: DatabaseGemstoneVideo[] | null | undefined,
  primaryVideoUrl: string | null | undefined
): DatabaseGemstoneVideo[] {
  const withUrls = (rawVideos ?? []).filter(
    (row) => typeof row.video_url === "string" && row.video_url.trim().length > 0
  );
  withUrls.sort((a, b) => a.video_order - b.video_order);

  if (withUrls.length > 0) {
    return withUrls;
  }

  const fallback =
    typeof primaryVideoUrl === "string" ? primaryVideoUrl.trim() : "";
  if (fallback.length > 0) {
    const synthetic: DatabaseGemstoneVideo = {
      id: `__storefront_primary_video__${gemstoneId}`,
      gemstone_id: gemstoneId,
      video_url: fallback,
      video_order: 0,
      thumbnail_url: null,
      duration_seconds: null,
      original_path: null,
      original_filename: null,
      processing_status: null,
      original_size_bytes: null,
      ai_analysis_date: null,
      created_at: null,
      error_message: null,
      optimization_percentage: null,
      optimized_size_bytes: null,
      title: null,
    };
    return [synthetic];
  }

  return [];
}
