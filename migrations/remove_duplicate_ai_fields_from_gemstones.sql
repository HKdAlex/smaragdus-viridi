-- Remove duplicate AI fields from gemstones table
-- These fields are empty and duplicated in gemstones_ai_v6 table

-- 1. First, update the gemstones_with_best_data view to remove references to these columns
DROP VIEW IF EXISTS gemstones_with_best_data;

CREATE VIEW gemstones_with_best_data AS
SELECT 
  g.id,
  g.name,
  g.weight_carats,
  g.length_mm,
  g.width_mm,
  g.depth_mm,
  g.color,
  g.cut,
  g.clarity,
  g.origin_id,
  g.price_amount,
  g.price_currency,
  g.premium_price_amount,
  g.premium_price_currency,
  g.in_stock,
  g.delivery_days,
  g.internal_code,
  g.serial_number,
  g.created_at,
  g.updated_at,
  g.description,
  g.promotional_text,
  g.marketing_highlights,
  g.ai_confidence_score,
  g.ai_text_generated_v6 AS ai_analyzed,
  g.ai_analysis_date,
  g.import_folder_path,
  g.import_notes,
  g.import_batch_id,
  g.ai_data_completeness,
  g.price_per_carat,
  g.quantity,
  g.metadata_status,
  g.type_code,
  g.color_code,
  g.cut_code,
  g.clarity_code,
  g.search_vector_en,
  g.search_vector_ru,
  g.description_vector_en,
  g.description_vector_ru,
  -- Remove duplicate AI fields that are now only in gemstones_ai_v6
  g.ai_description_model,
  g.ai_description_date,
  g.ai_description_cost_usd,
  g.ai_weight_carats,
  g.ai_length_mm,
  g.ai_width_mm,
  g.ai_depth_mm,
  g.ai_color,
  g.ai_clarity,
  g.ai_cut,
  g.ai_origin,
  g.ai_treatment,
  g.ai_quality_grade,
  g.ai_extracted_date,
  g.ai_extraction_confidence,
  COALESCE(g.weight_carats, g.ai_weight_carats) AS best_weight_carats,
  COALESCE(g.length_mm, g.ai_length_mm) AS best_length_mm,
  COALESCE(g.width_mm, g.ai_width_mm) AS best_width_mm,
  COALESCE(g.depth_mm, g.ai_depth_mm) AS best_depth_mm,
  COALESCE((g.color)::text, g.ai_color) AS best_color,
  COALESCE((g.clarity)::text, g.ai_clarity) AS best_clarity,
  COALESCE((g.cut)::text, g.ai_cut) AS best_cut,
  CASE
    WHEN (g.weight_carats IS NOT NULL) THEN 'manual'::text
    WHEN (g.ai_weight_carats IS NOT NULL) THEN 'ai'::text
    ELSE NULL::text
  END AS weight_source
FROM gemstones g;

-- 2. Drop the duplicate columns from gemstones table
ALTER TABLE gemstones 
  DROP COLUMN IF EXISTS description_technical_en,
  DROP COLUMN IF EXISTS description_technical_ru,
  DROP COLUMN IF EXISTS description_emotional_en,
  DROP COLUMN IF EXISTS description_emotional_ru,
  DROP COLUMN IF EXISTS narrative_story_en,
  DROP COLUMN IF EXISTS narrative_story_ru;

-- Note: We keep promotional_text and marketing_highlights in gemstones table
-- as they might be used for non-AI content as well
