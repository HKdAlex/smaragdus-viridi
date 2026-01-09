-- Drop gem_cut enum column and type
-- Contract: CUT-C3.1

-- First, drop dependent views
DROP VIEW IF EXISTS gemstones_enriched CASCADE;
DROP VIEW IF EXISTS orders_with_details CASCADE;
DROP VIEW IF EXISTS gemstones_with_best_data CASCADE;

-- Drop the trigger that depends on the cut column
DROP TRIGGER IF EXISTS trigger_update_gemstone_search_vectors ON gemstones;

-- Now drop the cut column from gemstones table
-- This is safe because all data is now in cut_id (which references cuts table)
ALTER TABLE gemstones DROP COLUMN IF EXISTS cut;

-- Drop indexes that reference the cut column
DROP INDEX IF EXISTS idx_gemstones_cut;
DROP INDEX IF EXISTS idx_gemstones_in_stock_cut_color;
DROP INDEX IF EXISTS idx_gemstones_filters_basic;
DROP INDEX IF EXISTS idx_gemstones_search_filters;

-- Recreate the composite indexes without the cut column
CREATE INDEX IF NOT EXISTS idx_gemstones_in_stock_color ON gemstones(in_stock, color);
CREATE INDEX IF NOT EXISTS idx_gemstones_filters_basic_v2 ON gemstones(in_stock, price_amount, weight_carats);

-- Update views to remove cut column references
-- gemstones_enriched
DROP VIEW IF EXISTS gemstones_enriched CASCADE;
CREATE VIEW gemstones_enriched AS
SELECT 
    g.id,
    g.serial_number,
    g.internal_code,
    (g.name)::text AS name,
    g.type_code,
    (g.color)::text AS color,
    g.color_code,
    -- Cut from cuts table only (CUT-C3.1)
    g.cut_id,
    g.cut_code,
    c.code AS cut,
    c.name_en AS cut_name_en,
    c.name_ru AS cut_name_ru,
    (g.clarity)::text AS clarity,
    g.clarity_code,
    g.weight_carats,
    g.length_mm,
    g.width_mm,
    g.depth_mm,
    g.price_amount,
    (g.price_currency)::text AS price_currency,
    g.premium_price_amount,
    (g.premium_price_currency)::text AS premium_price_currency,
    g.price_per_carat,
    g.quantity,
    g.delivery_days,
    g.description,
    g.in_stock,
    g.origin_id,
    (g.metadata_status)::text AS metadata_status,
    g.created_at,
    g.updated_at,
    g.ai_text_generated_v6 AS ai_analyzed,
    g.ai_color,
    g.primary_image_url,
    g.primary_video_url,
    v6.selected_image_uuid,
    v6.recommended_primary_image_index,
    v6.detected_cut,
    v6.cut_detection_confidence,
    v6.detected_color,
    v6.color_detection_confidence,
    v6.detected_color_description,
    v6.technical_description_en,
    v6.emotional_description_en,
    v6.narrative_story_en,
    v6.historical_context_en,
    v6.care_instructions_en,
    v6.promotional_text AS promotional_text_en,
    v6.marketing_highlights AS marketing_highlights_en,
    v6.technical_description_ru,
    v6.emotional_description_ru,
    v6.narrative_story_ru,
    v6.historical_context_ru,
    v6.care_instructions_ru,
    v6.promotional_text_ru,
    v6.marketing_highlights_ru,
    v6.model_version,
    v6.confidence_score,
    v6.needs_review,
    COALESCE(img_counts.image_count, 0) AS image_count,
    COALESCE(vid_counts.video_count, 0) AS video_count
FROM gemstones g
LEFT JOIN cuts c ON c.id = g.cut_id
LEFT JOIN gemstones_ai_v6 v6 ON v6.gemstone_id = g.id
LEFT JOIN LATERAL (
    SELECT (count(*))::integer AS image_count
    FROM gemstone_images gi
    WHERE gi.gemstone_id = g.id
) img_counts ON true
LEFT JOIN LATERAL (
    SELECT (count(*))::integer AS video_count
    FROM gemstone_videos gv
    WHERE gv.gemstone_id = g.id
) vid_counts ON true;

-- orders_with_details
DROP VIEW IF EXISTS orders_with_details CASCADE;
CREATE VIEW orders_with_details AS
SELECT 
    o.id AS order_id,
    o.status,
    o.total_amount,
    o.currency_code,
    o.notes,
    o.order_number,
    o.created_at,
    o.updated_at,
    o.user_id,
    up.name AS user_name,
    up.phone AS user_phone,
    up.role AS user_role,
    oi.id AS order_item_id,
    oi.quantity,
    oi.unit_price,
    oi.line_total,
    g.id AS gemstone_id,
    g.name AS gemstone_name,
    g.color AS gemstone_color,
    -- Cut from cuts table only (CUT-C3.1)
    c.code AS gemstone_cut,
    g.cut_id AS gemstone_cut_id,
    c.name_en AS gemstone_cut_name_en,
    c.name_ru AS gemstone_cut_name_ru,
    g.weight_carats,
    g.serial_number,
    g.in_stock
FROM orders o
LEFT JOIN user_profiles up ON o.user_id = up.user_id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN gemstones g ON oi.gemstone_id = g.id
LEFT JOIN cuts c ON c.id = g.cut_id
ORDER BY o.created_at DESC;

-- gemstones_with_best_data
DROP VIEW IF EXISTS gemstones_with_best_data CASCADE;
CREATE VIEW gemstones_with_best_data AS
SELECT 
    g.id,
    g.name,
    g.weight_carats,
    g.length_mm,
    g.width_mm,
    g.depth_mm,
    g.color,
    -- Cut from cuts table only (CUT-C3.1)
    c.code AS cut,
    g.cut_id,
    c.name_en AS cut_name_en,
    c.name_ru AS cut_name_ru,
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
    COALESCE(c.code, g.ai_cut) AS best_cut,
    CASE
        WHEN g.weight_carats IS NOT NULL THEN 'manual'::text
        WHEN g.ai_weight_carats IS NOT NULL THEN 'ai'::text
        ELSE NULL::text
    END AS weight_source
FROM gemstones g
LEFT JOIN cuts c ON c.id = g.cut_id;

-- Now drop the gem_cut enum type
DROP TYPE IF EXISTS gem_cut CASCADE;

-- Update the search vectors trigger function to not reference cut column
CREATE OR REPLACE FUNCTION update_gemstone_search_vectors()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ai_record RECORD;
  origin_name_en text;
  origin_name_ru text;
  cut_name_en text;
  cut_name_ru text;
  clarity_name_ru text;
BEGIN
  SELECT
    technical_description_en,
    technical_description_ru,
    narrative_story_en,
    narrative_story_ru,
    promotional_text,
    promotional_text_ru,
    marketing_highlights,
    marketing_highlights_ru
  INTO ai_record
  FROM gemstones_ai_v6
  WHERE gemstone_id = NEW.id;

  SELECT name, name
  INTO origin_name_en, origin_name_ru
  FROM origins
  WHERE id = NEW.origin_id;

  -- Get cut translations from cuts table (CUT-C3.1)
  SELECT name_en, name_ru
  INTO cut_name_en, cut_name_ru
  FROM cuts
  WHERE id = NEW.cut_id;

  SELECT name
  INTO clarity_name_ru
  FROM gem_clarity_translations
  WHERE clarity_code = NEW.clarity::text AND locale = 'ru';

  NEW.search_vector_en :=
    setweight(to_tsvector('english', coalesce(NEW.serial_number, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.name::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(cut_name_en, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.clarity::text, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(origin_name_en, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(ai_record.technical_description_en, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(ai_record.narrative_story_en, '')), 'D');

  NEW.description_vector_en :=
    to_tsvector('english',
      coalesce(NEW.description, '') || ' ' ||
      coalesce(ai_record.technical_description_en, '') || ' ' ||
      coalesce(ai_record.promotional_text, '') || ' ' ||
      array_to_string(COALESCE(ai_record.marketing_highlights, ARRAY[]::text[]), ' ')
    );

  NEW.search_vector_ru :=
    setweight(to_tsvector('russian', coalesce(NEW.serial_number, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce((SELECT name FROM gemstone_type_translations WHERE type_code = NEW.type_code AND locale = 'ru'), NEW.name::text, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce((SELECT name FROM gem_color_translations WHERE color_code = NEW.color_code AND locale = 'ru'), NEW.color::text, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(cut_name_ru, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(clarity_name_ru, NEW.clarity::text, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(origin_name_ru, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('russian', coalesce(ai_record.technical_description_ru, '')), 'C') ||
    setweight(to_tsvector('russian', coalesce(ai_record.narrative_story_ru, '')), 'D');

  NEW.description_vector_ru :=
    to_tsvector('russian',
      coalesce(NEW.description, '') || ' ' ||
      coalesce(ai_record.technical_description_ru, '') || ' ' ||
      coalesce(ai_record.promotional_text_ru, '') || ' ' ||
      array_to_string(COALESCE(ai_record.marketing_highlights_ru, ARRAY[]::text[]), ' ')
    );

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_update_gemstone_search_vectors
  BEFORE INSERT OR UPDATE ON gemstones
  FOR EACH ROW
  EXECUTE FUNCTION update_gemstone_search_vectors();

COMMENT ON VIEW gemstones_enriched IS 'Enriched gemstones view using cuts table (CUT-C3.1)';
COMMENT ON VIEW orders_with_details IS 'Orders with details using cuts table (CUT-C3.1)';
COMMENT ON VIEW gemstones_with_best_data IS 'Gemstones with best data using cuts table (CUT-C3.1)';
COMMENT ON FUNCTION update_gemstone_search_vectors IS 'Update search vectors using cuts table (CUT-C3.1)';
