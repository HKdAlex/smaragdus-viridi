import { describe, expect, it } from "vitest";

import type { Database } from "@/shared/types/database";
import {
  mergeAdminGemstoneRecords,
  type MergedAdminGemstoneRecord,
} from "@/features/admin/utils/gemstone-record-merge";

type GemstoneRow = Database["public"]["Tables"]["gemstones"]["Row"];
type EnrichedRow = Database["public"]["Views"]["gemstones_enriched"]["Row"];

const buildBaseGemstone = (overrides: Partial<GemstoneRow> = {}): GemstoneRow => ({
  ai_analysis_date: null,
  ai_analysis_v5: false,
  ai_analysis_v5_date: null,
  ai_clarity: null,
  ai_color: null,
  ai_color_code: null,
  ai_color_description: null,
  ai_confidence_score: null,
  ai_cut: null,
  ai_data_completeness: null,
  ai_depth_mm: null,
  ai_description_cost_usd: null,
  ai_description_date: null,
  ai_description_model: null,
  ai_extracted_date: null,
  ai_extraction_confidence: null,
  ai_length_mm: null,
  ai_origin: null,
  ai_quality_grade: null,
  ai_text_generated_v6: false,
  ai_text_generated_v6_date: null,
  ai_treatment: null,
  ai_weight_carats: null,
  ai_width_mm: null,
  clarity: "vs1",
  clarity_code: "vs1",
  color: "green",
  color_code: "green",
  created_at: null,
  cut: "round",
  cut_code: "round",
  delivery_days: null,
  depth_mm: 5.5,
  description: null,
  description_vector_en: null,
  description_vector_ru: null,
  id: "gemstone-id",
  import_batch_id: null,
  import_folder_path: null,
  import_notes: null,
  in_stock: true,
  internal_code: "INT-001",
  length_mm: 10.2,
  marketing_highlights: null,
  metadata_status: "needs_review",
  name: "emerald",
  origin_id: null,
  premium_price_amount: null,
  premium_price_currency: null,
  price_amount: 150000,
  price_currency: "usd",
  price_per_carat: null,
  primary_image_url: null,
  primary_video_url: null,
  promotional_text: null,
  quantity: 1,
  search_vector_en: null,
  search_vector_ru: null,
  serial_number: "SER-001",
  type_code: "emerald",
  updated_at: null,
  weight_carats: 2.5,
  width_mm: 7.1,
  ...overrides,
});

const buildEnrichedGemstone = (
  overrides: Partial<EnrichedRow> = {}
): EnrichedRow => ({
  ai_analyzed: true,
  ai_color: "vivid green",
  care_instructions_en: "Handle with care",
  care_instructions_ru: "Обращайтесь осторожно",
  clarity: "vs1",
  clarity_code: "vs1",
  color: "green",
  color_code: "green",
  color_detection_confidence: 0.9,
  confidence_score: 0.88,
  created_at: "2024-01-01T00:00:00.000Z",
  cut: "round",
  cut_code: "round",
  cut_detection_confidence: 0.95,
  description: "Beautiful emerald",
  detected_color: "green",
  detected_color_description: "Rich green hue",
  detected_cut: "round brilliant",
  emotional_description_en: "Captivating sparkle",
  emotional_description_ru: "Завораживающее сияние",
  historical_context_en: null,
  historical_context_ru: null,
  id: "gemstone-id",
  in_stock: true,
  internal_code: "INT-001",
  marketing_highlights_en: ["Bright"],
  marketing_highlights_ru: ["Яркий"],
  metadata_status: "needs_review",
  model_version: "v6",
  name: "emerald",
  narrative_story_en: null,
  narrative_story_ru: null,
  needs_review: false,
  origin_id: null,
  price_amount: 150000,
  price_currency: "usd",
  primary_image_url: null,
  primary_video_url: null,
  promotional_text_en: null,
  promotional_text_ru: null,
  recommended_primary_image_index: null,
  selected_image_uuid: null,
  serial_number: "SER-001",
  technical_description_en: "Technical details",
  technical_description_ru: "Технические детали",
  type_code: "emerald",
  updated_at: "2024-01-01T00:00:00.000Z",
  weight_carats: 2.5,
  ...overrides,
});

describe("mergeAdminGemstoneRecords", () => {
  it("prefers base gemstone dimensions when enriched values are null", () => {
    const base = buildBaseGemstone();
    const enriched = buildEnrichedGemstone({
      length_mm: null,
      width_mm: null,
      depth_mm: null,
      quantity: null,
    });

    const merged = mergeAdminGemstoneRecords(base, enriched);

    expect(merged.length_mm).toBe(base.length_mm);
    expect(merged.width_mm).toBe(base.width_mm);
    expect(merged.depth_mm).toBe(base.depth_mm);
    expect(merged.quantity).toBe(base.quantity);
  });

  it("keeps enriched-only AI fields", () => {
    const base = buildBaseGemstone();
    const enriched = buildEnrichedGemstone();

    const merged = mergeAdminGemstoneRecords(base, enriched);

    expect(merged.care_instructions_en).toBe(enriched.care_instructions_en);
    expect(merged.care_instructions_ru).toBe(enriched.care_instructions_ru);
    expect(merged.confidence_score).toBe(enriched.confidence_score);
  });

  it("returns base gemstone when enriched record is missing", () => {
    const base = buildBaseGemstone();
    const merged = mergeAdminGemstoneRecords(base, null);

    expect(merged).toStrictEqual(base as MergedAdminGemstoneRecord);
  });
});

