import type { DatabaseGemstone } from "@/shared/types";

export interface GemstoneCRUDResult<T = DatabaseGemstone> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GemstoneFormData {
  name: DatabaseGemstone["name"];
  color: DatabaseGemstone["color"];
  cut: DatabaseGemstone["cut"];
  clarity: DatabaseGemstone["clarity"];
  type_code?: string;
  color_code?: string;
  cut_code?: string;
  clarity_code?: string;
  weight_carats: number;
  length_mm: number;
  width_mm: number;
  depth_mm: number;
  origin_id?: string;
  price_amount: number;
  price_currency: DatabaseGemstone["price_currency"];
  premium_price_amount?: number;
  premium_price_currency?: DatabaseGemstone["price_currency"];
  in_stock: boolean;
  delivery_days?: number;
  internal_code?: string;
  serial_number: string;
  description?: string;
  promotional_text?: string;
  marketing_highlights?: string[];
  // AI-generated fields (English)
  description_technical_en?: string;
  description_emotional_en?: string;
  narrative_story_en?: string;
  promotional_text_en?: string;
  marketing_highlights_en?: string[];
  // AI-generated fields (Russian)
  description_technical_ru?: string;
  description_emotional_ru?: string;
  narrative_story_ru?: string;
  promotional_text_ru?: string;
  marketing_highlights_ru?: string[];
  // AI v6 data object
  ai_v6?: any;
}

// Simple logger for now
const logger = {
  info: (message: string, data?: any) =>
    console.log(`[ADMIN-GEMSTONE-API] ${message}`, data),
  error: (message: string, error?: any) =>
    console.error(`[ADMIN-GEMSTONE-API ERROR] ${message}`, error),
  warn: (message: string, data?: any) =>
    console.warn(`[ADMIN-GEMSTONE-API WARN] ${message}`, data),
};

export class GemstoneAdminApiService {
  /**
   * Update an existing gemstone via API route
   */
  static async updateGemstone(
    id: string,
    formData: Partial<GemstoneFormData>
  ): Promise<GemstoneCRUDResult<DatabaseGemstone>> {
    try {
      logger.info("Updating gemstone via API", {
        id,
        updates: Object.keys(formData),
      });

      const response = await fetch(`/api/admin/gemstones/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error("Failed to update gemstone", result);
        return { success: false, error: result.error || "Update failed" };
      }

      logger.info("Gemstone updated successfully", {
        id: result.data.id,
        serialNumber: result.data.serial_number,
      });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Unexpected error updating gemstone", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Get a single gemstone by ID via API route
   */
  static async getGemstoneById(
    id: string
  ): Promise<GemstoneCRUDResult<DatabaseGemstone>> {
    try {
      logger.info("Fetching gemstone by ID via API", { id });

      const response = await fetch(`/api/admin/gemstones/${id}`);

      const result = await response.json();

      if (!response.ok) {
        logger.error("Failed to fetch gemstone", result);
        return { success: false, error: result.error || "Fetch failed" };
      }

      logger.info("Gemstone fetched successfully", {
        id: result.data.id,
        serialNumber: result.data.serial_number,
      });

      return { success: true, data: result.data };
    } catch (error) {
      logger.error("Unexpected error fetching gemstone", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Delete a gemstone via API route
   */
  static async deleteGemstone(id: string): Promise<GemstoneCRUDResult> {
    try {
      logger.info("Deleting gemstone via API", { id });

      const response = await fetch(`/api/admin/gemstones/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error("Failed to delete gemstone", result);
        return { success: false, error: result.error || "Delete failed" };
      }

      logger.info("Gemstone deleted successfully", { id });

      return { success: true };
    } catch (error) {
      logger.error("Unexpected error deleting gemstone", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Set primary image via API route
   */
  static async setPrimaryImage(
    gemstoneId: string,
    imageId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info("Setting primary image via API", { gemstoneId, imageId });

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
        logger.error("Failed to set primary image", result);
        return { success: false, error: result.error || "Set primary failed" };
      }

      logger.info("Primary image set successfully", { gemstoneId, imageId });
      return { success: true };
    } catch (error) {
      logger.error("Unexpected error setting primary image", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Set primary video via API route
   */
  static async setPrimaryVideo(
    gemstoneId: string,
    videoId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info("Setting primary video via API", { gemstoneId, videoId });

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
        logger.error("Failed to set primary video", result);
        return { success: false, error: result.error || "Set primary failed" };
      }

      logger.info("Primary video set successfully", { gemstoneId, videoId });
      return { success: true };
    } catch (error) {
      logger.error("Unexpected error setting primary video", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Delete media via API route
   */
  static async deleteMedia(
    gemstoneId: string,
    mediaId: string,
    mediaType: "image" | "video"
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info("Deleting media via API", { gemstoneId, mediaId, mediaType });

      const response = await fetch(`/api/admin/gemstones/${gemstoneId}/media`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mediaId,
          mediaType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error("Failed to delete media", result);
        return { success: false, error: result.error || "Delete failed" };
      }

      logger.info("Media deleted successfully", {
        gemstoneId,
        mediaId,
        mediaType,
      });
      return { success: true };
    } catch (error) {
      logger.error("Unexpected error deleting media", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }
}
