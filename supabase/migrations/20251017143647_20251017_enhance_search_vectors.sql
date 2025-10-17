-- Migration: Enhance multilingual search vectors and function
-- Date: 2025-10-17
-- Purpose: Include translated cut/clarity/origin terms and AI-generated descriptions in search

BEGIN;

-- Safety: drop triggers referencing old function definitions
DROP TRIGGER IF EXISTS trigger_update_gemstone_search_vectors ON gemstones;
DROP FUNCTION IF EXISTS update_gemstone_search_vectors();
DROP FUNCTION IF EXISTS search_gemstones_multilingual(text, text, jsonb, integer, integer);

-- Recreate trigger helper with expanded fields
CREATE OR REPLACE FUNCTION update_gemstone_search_vectors()
RETURNS TRIGGER AS $$
DECLARE
  ai_record RECORD;
  origin_name_en text;
  origin_name_ru text;
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

  SELECT name
  INTO cut_name_ru
  FROM gem_cut_translations
  WHERE cut_code = NEW.cut::text AND locale = 'ru';

  SELECT name
  INTO clarity_name_ru
  FROM gem_clarity_translations
  WHERE clarity_code = NEW.clarity::text AND locale = 'ru';

  NEW.search_vector_en :=
    setweight(to_tsvector('english', coalesce(NEW.serial_number, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.name::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.cut::text, '')), 'B') ||
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
    setweight(to_tsvector('russian', coalesce(cut_name_ru, NEW.cut::text, '')), 'B') ||
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
$$ LANGUAGE plpgsql;

-- Update triggers to use the rebuilt helper
CREATE TRIGGER trigger_update_gemstone_search_vectors
  BEFORE INSERT OR UPDATE OF serial_number, name, type_code, color, color_code, cut, clarity, origin_id, description
  ON gemstones
  FOR EACH ROW
  EXECUTE FUNCTION update_gemstone_search_vectors();

-- Refresh existing rows to include new AI content
UPDATE gemstones
SET search_vector_en = search_vector_en;

-- Recreate main search function
CREATE OR REPLACE FUNCTION search_gemstones_multilingual(
  search_query text,
  search_locale text DEFAULT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  page_num integer DEFAULT 1,
  page_size integer DEFAULT 24
)
RETURNS TABLE (
  id uuid,
  serial_number text,
  name gemstone_type,
  color gem_color,
  cut gem_cut,
  clarity gem_clarity,
  weight_carats numeric,
  price_amount integer,
  price_currency currency_code,
  description text,
  in_stock boolean,
  origin_id uuid,
  has_certification boolean,
  has_ai_analysis boolean,
  metadata_status metadata_status,
  created_at timestamptz,
  updated_at timestamptz,
  relevance_score real,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  effective_locale text := COALESCE(search_locale, detect_query_locale(search_query));
  offset_val integer := (page_num - 1) * page_size;
  ts_query tsquery;
  description_enabled boolean := COALESCE((filters->>'searchDescriptions')::boolean, false);
  min_price numeric := (filters->>'minPrice')::numeric;
  max_price numeric := (filters->>'maxPrice')::numeric;
  min_weight numeric := (filters->>'minWeight')::numeric;
  max_weight numeric := (filters->>'maxWeight')::numeric;
  types text[] := ARRAY(SELECT jsonb_array_elements_text(filters->'gemstoneTypes'));
  colors text[] := ARRAY(SELECT jsonb_array_elements_text(filters->'colors'));
  cuts text[] := ARRAY(SELECT jsonb_array_elements_text(filters->'cuts'));
  clarities text[] := ARRAY(SELECT jsonb_array_elements_text(filters->'clarities'));
  origins_filter text[] := ARRAY(SELECT jsonb_array_elements_text(filters->'origins'));
  in_stock_only boolean := (filters->>'inStockOnly')::boolean;
  has_certification_filter boolean := (filters->>'hasCertification')::boolean;
  has_ai_analysis_filter boolean := (filters->>'hasAIAnalysis')::boolean;
  use_ru boolean;
BEGIN
  use_ru := effective_locale = 'ru';

  IF search_query IS NULL OR btrim(search_query) = '' THEN
    ts_query := NULL;
  ELSIF use_ru THEN
    ts_query := websearch_to_tsquery('russian', unaccent(search_query));
  ELSE
    ts_query := websearch_to_tsquery('english', unaccent(search_query));
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT
      g.*,
      CASE
        WHEN use_ru AND description_enabled THEN g.search_vector_ru || g.description_vector_ru
        WHEN use_ru THEN g.search_vector_ru
        WHEN description_enabled THEN g.search_vector_en || g.description_vector_en
        ELSE g.search_vector_en
      END AS effective_vector
    FROM gemstones g
    WHERE g.price_amount > 0
      AND EXISTS (SELECT 1 FROM gemstone_images gi WHERE gi.gemstone_id = g.id)
      AND (min_price IS NULL OR g.price_amount >= min_price)
      AND (max_price IS NULL OR g.price_amount <= max_price)
      AND (min_weight IS NULL OR g.weight_carats >= min_weight)
      AND (max_weight IS NULL OR g.weight_carats <= max_weight)
      AND (types IS NULL OR cardinality(types) = 0 OR g.name::text = ANY(types))
      AND (colors IS NULL OR cardinality(colors) = 0 OR g.color::text = ANY(colors))
      AND (cuts IS NULL OR cardinality(cuts) = 0 OR g.cut::text = ANY(cuts))
      AND (clarities IS NULL OR cardinality(clarities) = 0 OR g.clarity::text = ANY(clarities))
      AND (origins_filter IS NULL OR cardinality(origins_filter) = 0 OR g.origin_id IN (
        SELECT o.id FROM origins o WHERE o.name = ANY(origins_filter)
      ))
      AND (in_stock_only IS NULL OR NOT in_stock_only OR g.in_stock = true)
      AND (has_certification_filter IS NULL OR NOT has_certification_filter)
      AND (has_ai_analysis_filter IS NULL OR NOT has_ai_analysis_filter OR g.ai_analyzed = true)
  ), ranked AS (
    SELECT
      c.*,
      CASE
        WHEN ts_query IS NULL THEN 0
        ELSE ts_rank_cd(c.effective_vector, ts_query)
      END AS rank
    FROM candidates c
    WHERE ts_query IS NULL OR ts_query @@ c.effective_vector
  )
  SELECT
    r.id,
    r.serial_number,
    r.name::text,
    r.type_code,
    r.color::text,
    r.color_code,
    r.cut::text,
    r.cut_code,
    r.clarity::text,
    r.clarity_code,
    r.weight_carats,
    r.price_amount,
    r.price_currency::text,
    r.description,
    r.in_stock,
    r.origin_id,
    FALSE AS has_certification,
    COALESCE(r.ai_analyzed, FALSE) AS has_ai_analysis,
    r.metadata_status::text,
    r.created_at,
    r.updated_at,
    r.rank AS relevance_score,
    COUNT(*) OVER() AS total_count
  FROM ranked r
  ORDER BY r.rank DESC, r.created_at DESC
  OFFSET offset_val
  LIMIT page_size;
END;
$$;

COMMIT;

