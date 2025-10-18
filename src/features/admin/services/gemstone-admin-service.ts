import type {
  DatabaseCertification,
  DatabaseGemstone,
  DatabaseGemstoneImage,
  DatabaseGemstoneVideo,
  DatabaseOrigin,
} from "@/shared/types";
import type { TablesInsert, TablesUpdate } from "@/shared/types/database";

import { DatabaseEnums } from "@/shared/services/database-enums";
import { supabase } from "@/lib/supabase";

// Simple logger for now
const logger = {
  info: (message: string, data?: any) =>
    console.log(`[ADMIN-GEMSTONE] ${message}`, data),
  error: (message: string, error?: any) =>
    console.error(`[ADMIN-GEMSTONE ERROR] ${message}`, error),
  warn: (message: string, data?: any) =>
    console.warn(`[ADMIN-GEMSTONE WARN] ${message}`, data),
};

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

export interface GemstoneWithRelations extends DatabaseGemstone {
  origin?: DatabaseOrigin;
  images?: DatabaseGemstoneImage[];
  videos?: DatabaseGemstoneVideo[];
  certifications?: DatabaseCertification[];
  ai_v6?: {
    technical_description_en?: string | null;
    emotional_description_en?: string | null;
    narrative_story_en?: string | null;
    promotional_text?: string | null;
    marketing_highlights?: string[] | null;
    // Russian fields
    technical_description_ru?: string | null;
    emotional_description_ru?: string | null;
    narrative_story_ru?: string | null;
    promotional_text_ru?: string | null;
    marketing_highlights_ru?: string[] | null;
  } | null;
}

export interface BulkImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  duplicates: Array<{ serialNumber: string; reason: string }>;
  warnings: Array<{ row: number; warning: string }>;
}

export interface BulkImportData {
  serialNumber: string;
  name: DatabaseGemstone["name"];
  color: DatabaseGemstone["color"];
  cut: DatabaseGemstone["cut"];
  clarity: DatabaseGemstone["clarity"];
  type_code?: string;
  color_code?: string;
  cut_code?: string;
  clarity_code?: string;
  weight_carats: number;
  length_mm?: number;
  width_mm?: number;
  depth_mm?: number;
  origin_id?: string;
  price_amount: number;
  price_currency: DatabaseGemstone["price_currency"];
  premium_price_amount?: number;
  premium_price_currency?: DatabaseGemstone["price_currency"];
  in_stock: boolean;
  delivery_days?: number;
  internal_code?: string;
  description?: string;
  promotional_text?: string;
  marketing_highlights?: string[];
}

export interface GemstoneCRUDResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export class GemstoneAdminService {
  /**
   * Create a new gemstone
   */
  static async createGemstone(
    formData: GemstoneFormData
  ): Promise<GemstoneCRUDResult<DatabaseGemstone>> {
    try {
      logger.info("Creating new gemstone", {
        serialNumber: formData.serial_number,
        name: formData.name,
        weight: formData.weight_carats,
      });

      const payload: TablesInsert<"gemstones"> = {
        name: formData.name,
        type_code: formData.type_code ?? formData.name,
        color: formData.color,
        color_code: formData.color_code ?? formData.color,
        cut: formData.cut,
        cut_code: formData.cut_code ?? formData.cut,
        clarity: formData.clarity,
        clarity_code: formData.clarity_code ?? formData.clarity,
        weight_carats: formData.weight_carats,
        length_mm: formData.length_mm,
        width_mm: formData.width_mm,
        depth_mm: formData.depth_mm,
        origin_id: formData.origin_id ?? null,
        price_amount: formData.price_amount,
        price_currency: formData.price_currency,
        premium_price_amount: formData.premium_price_amount ?? null,
        premium_price_currency: formData.premium_price_currency ?? null,
        in_stock: formData.in_stock,
        delivery_days: formData.delivery_days ?? null,
        internal_code: formData.internal_code ?? null,
        serial_number: formData.serial_number,
        description: formData.description ?? null,
        promotional_text: formData.promotional_text ?? null,
        marketing_highlights: formData.marketing_highlights ?? null,
      };

      const { data, error } = await supabase
        .from("gemstones")
        .insert(payload)
        .select()
        .single();

      if (error) {
        logger.error("Failed to create gemstone", error);
        return { success: false, error: error.message };
      }

      logger.info("Gemstone created successfully", {
        id: data.id,
        serialNumber: data.serial_number,
      });

      return { success: true, data };
    } catch (error) {
      logger.error("Unexpected error creating gemstone", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Update an existing gemstone
   */
  static async updateGemstone(
    id: string,
    formData: Partial<GemstoneFormData>
  ): Promise<GemstoneCRUDResult<DatabaseGemstone>> {
    try {
      logger.info("Updating gemstone", { id, updates: Object.keys(formData) });

      // Filter out AI-specific fields that don't belong in the gemstones table
      const {
        ai_v6,
        description_technical_en,
        description_emotional_en,
        narrative_story_en,
        promotional_text_en,
        marketing_highlights_en,
        description_technical_ru,
        description_emotional_ru,
        narrative_story_ru,
        promotional_text_ru,
        marketing_highlights_ru,
        ...gemstoneFields
      } = formData;

      const updates = {
        ...gemstoneFields,
        updated_at: new Date().toISOString(),
      } as TablesUpdate<"gemstones">;

      if (
        typeof formData.name !== "undefined" &&
        typeof formData.type_code === "undefined"
      ) {
        updates.type_code = formData.name;
      }

      if (
        typeof formData.color !== "undefined" &&
        typeof formData.color_code === "undefined"
      ) {
        updates.color_code = formData.color;
      }

      if (
        typeof formData.cut !== "undefined" &&
        typeof formData.cut_code === "undefined"
      ) {
        updates.cut_code = formData.cut;
      }

      if (
        typeof formData.clarity !== "undefined" &&
        typeof formData.clarity_code === "undefined"
      ) {
        updates.clarity_code = formData.clarity;
      }

      const { data, error } = await supabase
        .from("gemstones")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error("Failed to update gemstone", error);
        return { success: false, error: error.message };
      }

      // Handle AI v6 fields if present
      if (ai_v6) {
        const aiV6Data = ai_v6;

        // Check if AI v6 record exists
        const { data: existingAiV6 } = await supabase
          .from("gemstones_ai_v6")
          .select("gemstone_id")
          .eq("gemstone_id", id)
          .single();

        if (existingAiV6) {
          // Update existing AI v6 record
          const { error: aiV6Error } = await supabase
            .from("gemstones_ai_v6")
            .update({
              ...aiV6Data,
              updated_at: new Date().toISOString(),
            })
            .eq("gemstone_id", id);

          if (aiV6Error) {
            logger.error("Failed to update AI v6 data", aiV6Error);
            // Don't fail the entire operation, just log the error
          }
        } else {
          // Create new AI v6 record
          const { error: aiV6Error } = await supabase
            .from("gemstones_ai_v6")
            .insert({
              gemstone_id: id,
              ...aiV6Data,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (aiV6Error) {
            logger.error("Failed to create AI v6 data", aiV6Error);
            // Don't fail the entire operation, just log the error
          }
        }
      }

      logger.info("Gemstone updated successfully", {
        id: data.id,
        serialNumber: data.serial_number,
      });

      return { success: true, data };
    } catch (error) {
      logger.error("Unexpected error updating gemstone", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Delete a gemstone
   */
  static async deleteGemstone(id: string): Promise<GemstoneCRUDResult> {
    try {
      logger.info("Deleting gemstone", { id });

      // First, get the gemstone details for logging
      const { data: gemstone } = await supabase
        .from("gemstones")
        .select("serial_number")
        .eq("id", id)
        .single();

      const { error } = await supabase.from("gemstones").delete().eq("id", id);

      if (error) {
        logger.error("Failed to delete gemstone", error);
        return { success: false, error: error.message };
      }

      logger.info("Gemstone deleted successfully", {
        id,
        serialNumber: gemstone?.serial_number,
      });

      return { success: true };
    } catch (error) {
      logger.error("Unexpected error deleting gemstone", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Get all gemstones for admin management
   */
  static async getAllGemstones(): Promise<
    GemstoneCRUDResult<GemstoneWithRelations[]>
  > {
    try {
      logger.info("Fetching all gemstones for admin");

      const { data, error } = await supabase
        .from("gemstones")
        .select(
          `
          *,
          origin:origins(*),
          images:gemstone_images(*),
          videos:gemstone_videos(*),
          certifications:certifications(*)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Failed to fetch gemstones", error);
        return { success: false, error: error.message };
      }

      logger.info("Gemstones fetched successfully", {
        count: data?.length || 0,
      });

      // Transform data to handle null vs undefined for origin
      const transformedData = (data || []).map((gemstone) => ({
        ...gemstone,
        origin: gemstone.origin || undefined,
      }));

      // Sort to prioritize gemstones with images first
      const sortedData = transformedData.sort((a, b) => {
        const aHasImages = a.images && a.images.length > 0;
        const bHasImages = b.images && b.images.length > 0;

        if (aHasImages && !bHasImages) return -1;
        if (!aHasImages && bHasImages) return 1;

        // If both have images or both don't have images, sort by created_at
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      });

      return { success: true, data: sortedData };
    } catch (error) {
      logger.error("Unexpected error fetching gemstones", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Get a single gemstone by ID
   */
  static async getGemstoneById(
    id: string
  ): Promise<GemstoneCRUDResult<GemstoneWithRelations>> {
    try {
      logger.info("Fetching gemstone by ID", { id });

      const { data, error } = await supabase
        .from("gemstones")
        .select(
          `
          *,
          origin:origins(*),
          images:gemstone_images(*),
          videos:gemstone_videos(*),
          certifications:certifications(*),
          ai_v6:gemstones_ai_v6(*)
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        logger.error("Failed to fetch gemstone", error);
        return { success: false, error: error.message };
      }

      logger.info("Gemstone fetched successfully", {
        id: data.id,
        serialNumber: data.serial_number,
      });

      // Transform data to handle null vs undefined for origin
      const transformedData = {
        ...data,
        origin: data.origin || undefined,
      };

      return { success: true, data: transformedData };
    } catch (error) {
      logger.error("Unexpected error fetching gemstone", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Bulk update gemstones
   */
  static async bulkUpdateGemstones(
    updates: Array<{ id: string; data: Partial<GemstoneFormData> }>
  ): Promise<GemstoneCRUDResult<{ success: number; failed: number }>> {
    try {
      logger.info("Starting bulk update", { count: updates.length });

      let successCount = 0;
      let failedCount = 0;

      for (const update of updates) {
        const result = await this.updateGemstone(update.id, update.data);
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          logger.error("Bulk update failed for gemstone", {
            id: update.id,
            error: result.error,
          });
        }
      }

      logger.info("Bulk update completed", {
        total: updates.length,
        success: successCount,
        failed: failedCount,
      });

      return {
        success: true,
        data: { success: successCount, failed: failedCount },
      };
    } catch (error) {
      logger.error("Unexpected error in bulk update", error as Error);
      return { success: false, error: "An unexpected error occurred" };
    }
  }

  /**
   * Validate gemstone form data
   */
  static validateGemstoneData(formData: Partial<GemstoneFormData>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!formData.serial_number?.trim()) {
      errors.push("Serial number is required");
    }

    if (!formData.name) {
      errors.push("Gemstone type is required");
    } else if (!DatabaseEnums.isValidGemstoneType(formData.name)) {
      errors.push("Invalid gemstone type");
    }

    if (!formData.color) {
      errors.push("Color is required");
    } else if (!DatabaseEnums.isValidGemColor(formData.color)) {
      errors.push("Invalid gem color");
    }

    if (!formData.cut) {
      errors.push("Cut is required");
    } else if (!DatabaseEnums.isValidGemCut(formData.cut)) {
      errors.push("Invalid gem cut");
    }

    if (!formData.clarity) {
      errors.push("Clarity is required");
    } else if (!DatabaseEnums.isValidGemClarity(formData.clarity)) {
      errors.push("Invalid gem clarity");
    }

    if (!formData.weight_carats || formData.weight_carats <= 0) {
      errors.push("Weight must be greater than 0");
    }

    if (!formData.price_amount || formData.price_amount <= 0) {
      errors.push("Price must be greater than 0");
    }

    if (!formData.price_currency) {
      errors.push("Price currency is required");
    } else if (!DatabaseEnums.isValidCurrencyCode(formData.price_currency)) {
      errors.push("Invalid currency code");
    }

    // Check for duplicate serial number (would need to be async)
    // This is a placeholder for client-side validation

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if serial number already exists
   */
  static async checkSerialNumberExists(
    serialNumber: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from("gemstones")
        .select("id")
        .eq("serial_number", serialNumber)
        .limit(1);

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("Failed to check serial number", error);
        return false; // Assume it doesn't exist on error
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      logger.error("Unexpected error checking serial number", error as Error);
      return false;
    }
  }

  /**
   * Bulk import gemstones from CSV/Excel data
   */
  static async bulkImportGemstones(
    importData: BulkImportData[]
  ): Promise<BulkImportResult> {
    logger.info("Starting bulk import", { count: importData.length });

    const result: BulkImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      errors: [],
      duplicates: [],
      warnings: [],
    };

    try {
      // Process in batches to avoid overwhelming the database
      const batchSize = 10;
      const batches = [];

      for (let i = 0; i < importData.length; i += batchSize) {
        batches.push(importData.slice(i, i + batchSize));
      }

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchStartRow = batchIndex * batchSize + 1;

        logger.info(`Processing batch ${batchIndex + 1}/${batches.length}`, {
          batchSize: batch.length,
          startRow: batchStartRow,
        });

        // Process each gemstone in the batch
        for (let i = 0; i < batch.length; i++) {
          const rowNumber = batchStartRow + i;
          const gemstoneData = batch[i];

          try {
            // Validate required fields
            const validation = this.validateBulkImportData(gemstoneData);
            if (!validation.success) {
              result.errors.push({
                row: rowNumber,
                error: validation.error || "Validation failed",
                data: gemstoneData,
              });
              result.failed++;
              continue;
            }

            // Check for duplicates
            const duplicateCheck = await this.checkSerialNumberExists(
              gemstoneData.serialNumber
            );
            if (duplicateCheck) {
              result.duplicates.push({
                serialNumber: gemstoneData.serialNumber,
                reason: "Serial number already exists",
              });
              result.failed++;
              continue;
            }

            // Convert to database format
            const dbData: TablesInsert<"gemstones"> = {
              serial_number: gemstoneData.serialNumber,
              name: gemstoneData.name,
              type_code: gemstoneData.type_code ?? gemstoneData.name,
              color: gemstoneData.color,
              color_code: gemstoneData.color_code ?? gemstoneData.color,
              cut: gemstoneData.cut,
              cut_code: gemstoneData.cut_code ?? gemstoneData.cut,
              clarity: gemstoneData.clarity,
              clarity_code: gemstoneData.clarity_code ?? gemstoneData.clarity,
              weight_carats: gemstoneData.weight_carats,
              length_mm: gemstoneData.length_mm ?? 0,
              width_mm: gemstoneData.width_mm ?? 0,
              depth_mm: gemstoneData.depth_mm ?? 0,
              origin_id: gemstoneData.origin_id ?? null,
              price_amount: gemstoneData.price_amount,
              price_currency: gemstoneData.price_currency,
              premium_price_amount: gemstoneData.premium_price_amount ?? null,
              premium_price_currency:
                gemstoneData.premium_price_currency ?? null,
              in_stock: gemstoneData.in_stock,
              delivery_days: gemstoneData.delivery_days ?? null,
              internal_code: gemstoneData.internal_code ?? null,
              description: gemstoneData.description ?? null,
              promotional_text: gemstoneData.promotional_text ?? null,
            };

            // Insert into database
            const { data, error } = await supabase
              .from("gemstones")
              .insert(dbData)
              .select()
              .single();

            if (error) {
              result.errors.push({
                row: rowNumber,
                error: `Database error: ${error.message}`,
                data: gemstoneData,
              });
              result.failed++;
              logger.error("Database insert failed", {
                rowNumber,
                error: error.message,
              });
            } else {
              result.imported++;
              logger.info("Gemstone imported successfully", {
                rowNumber,
                serialNumber: gemstoneData.serialNumber,
              });
            }
          } catch (error) {
            result.errors.push({
              row: rowNumber,
              error: `Processing error: ${(error as Error).message}`,
              data: gemstoneData,
            });
            result.failed++;
            logger.error("Processing error", {
              rowNumber,
              error: (error as Error).message,
            });
          }
        }
      }

      result.success = result.failed === 0;
      logger.info("Bulk import completed", {
        imported: result.imported,
        failed: result.failed,
        totalProcessed: importData.length,
        success: result.success,
      });

      return result;
    } catch (error) {
      logger.error("Unexpected error in bulk import", error as Error);
      return {
        success: false,
        imported: result.imported,
        failed:
          result.failed + (importData.length - result.imported - result.failed),
        errors: [
          ...result.errors,
          {
            row: 0,
            error: `System error: ${(error as Error).message}`,
          },
        ],
        duplicates: result.duplicates,
        warnings: result.warnings,
      };
    }
  }

  /**
   * Validate bulk import data
   */
  private static validateBulkImportData(data: BulkImportData): {
    success: boolean;
    error?: string;
  } {
    // Required field validation
    if (!data.serialNumber?.trim()) {
      return { success: false, error: "Serial number is required" };
    }

    if (!data.name) {
      return { success: false, error: "Gemstone type is required" };
    } else if (!DatabaseEnums.isValidGemstoneType(data.name)) {
      return { success: false, error: "Invalid gemstone type" };
    }

    if (!data.color) {
      return { success: false, error: "Color is required" };
    } else if (!DatabaseEnums.isValidGemColor(data.color)) {
      return { success: false, error: "Invalid gem color" };
    }

    if (!data.cut) {
      return { success: false, error: "Cut is required" };
    } else if (!DatabaseEnums.isValidGemCut(data.cut)) {
      return { success: false, error: "Invalid gem cut" };
    }

    if (!data.clarity) {
      return { success: false, error: "Clarity is required" };
    } else if (!DatabaseEnums.isValidGemClarity(data.clarity)) {
      return { success: false, error: "Invalid gem clarity" };
    }

    if (!data.weight_carats || data.weight_carats <= 0) {
      return { success: false, error: "Weight must be a positive number" };
    }

    if (!data.price_amount || data.price_amount <= 0) {
      return { success: false, error: "Price must be a positive number" };
    }

    if (!data.price_currency) {
      return { success: false, error: "Price currency is required" };
    } else if (!DatabaseEnums.isValidCurrencyCode(data.price_currency)) {
      return { success: false, error: "Invalid currency code" };
    }

    // Data type validation
    if (data.premium_price_amount && data.premium_price_amount <= 0) {
      return {
        success: false,
        error: "Premium price must be a positive number",
      };
    }

    if (
      data.delivery_days &&
      (data.delivery_days < 0 || data.delivery_days > 365)
    ) {
      return {
        success: false,
        error: "Delivery days must be between 0 and 365",
      };
    }

    // Dimension validation
    if (data.length_mm && data.length_mm <= 0) {
      return { success: false, error: "Length must be a positive number" };
    }

    if (data.width_mm && data.width_mm <= 0) {
      return { success: false, error: "Width must be a positive number" };
    }

    if (data.depth_mm && data.depth_mm <= 0) {
      return { success: false, error: "Depth must be a positive number" };
    }

    return { success: true };
  }
}
