-- Migration: Fix multilingual search to return correct column names
-- Date: 2025-10-15
-- Purpose: Ensure search_gemstones_multilingual returns id and name (not gemstone_id/gemstone_name)
-- Issue: Images not displaying in search results because column names don't match

BEGIN;

-- Drop and recreate the function with correct column names
DROP FUNCTION IF EXISTS search_gemstones_multilingual(text, text, jsonb, integer, integer);

-- Multilingual search function with correct column names
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
  offset_val integer;
  ts_query tsquery;
  base_vector tsvector;
  description_enabled boolean := COALESCE((filters->>'searchDescriptions')::boolean, false);
  final_vector tsvector;
  -- Advanced filter variables
  min_price numeric;
  max_price numeric;
  min_weight numeric;
  max_weight numeric;
  types text[];
  colors text[];
  cuts text[];
  clarities text[];
  origins_filter text[];
  in_stock_only boolean;
  has_images boolean;
  has_certification_filter boolean;
  has_ai_analysis_filter boolean;
BEGIN
  offset_val := (page_num - 1) * page_size;

  -- Parse advanced filters (matching catalog API logic)
  min_price := (filters->>'minPrice')::numeric;
  max_price := (filters->>'maxPrice')::numeric;
  min_weight := (filters->>'minWeight')::numeric;
  max_weight := (filters->>'maxWeight')::numeric;
  types := ARRAY(SELECT jsonb_array_elements_text(filters->'gemstoneTypes'));
  colors := ARRAY(SELECT jsonb_array_elements_text(filters->'colors'));
  cuts := ARRAY(SELECT jsonb_array_elements_text(filters->'cuts'));
  clarities := ARRAY(SELECT jsonb_array_elements_text(filters->'clarities'));
  origins_filter := ARRAY(SELECT jsonb_array_elements_text(filters->'origins'));
  in_stock_only := (filters->>'inStockOnly')::boolean;
  has_images := (filters->>'hasImages')::boolean;
  has_certification_filter := (filters->>'hasCertification')::boolean;
  has_ai_analysis_filter := (filters->>'hasAIAnalysis')::boolean;

  IF effective_locale = 'ru' THEN
    ts_query := websearch_to_tsquery('russian', unaccent(coalesce(search_query, '')));
    base_vector := search_vector_ru;
    final_vector := CASE WHEN description_enabled THEN base_vector || description_vector_ru ELSE base_vector END;
  ELSE
    ts_query := websearch_to_tsquery('english', unaccent(coalesce(search_query, '')));
    base_vector := search_vector_en;
    final_vector := CASE WHEN description_enabled THEN base_vector || description_vector_en ELSE base_vector END;
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT
      g.id,
      g.serial_number,
      g.name,
      g.color,
      g.cut,
      g.clarity,
      g.weight_carats,
      g.price_amount,
      g.price_currency,
      g.description,
      g.in_stock,
      g.origin_id,
      g.ai_analyzed,
      g.metadata_status,
      g.created_at,
      g.updated_at,
      CASE
        WHEN ts_query IS NULL THEN 0.0
        WHEN effective_locale = 'ru' THEN
          ts_rank_cd(final_vector, ts_query)
        ELSE
          ts_rank_cd(final_vector, ts_query)
      END AS rank
    FROM gemstones g
    WHERE
      -- Always filter out gems with price <= 0 (matches catalog behavior)
      g.price_amount > 0
      -- Ensure gem has at least one image (matches catalog behavior)
      AND EXISTS (SELECT 1 FROM gemstone_images gi WHERE gi.gemstone_id = g.id)
      -- Search query filter
      AND (search_query IS NULL OR ts_query @@ final_vector)
      -- Advanced filters (matching catalog API logic)
      AND (min_price IS NULL OR g.price_amount >= min_price)
      AND (max_price IS NULL OR g.price_amount <= max_price)
      AND (min_weight IS NULL OR g.weight_carats >= min_weight)
      AND (max_weight IS NULL OR g.weight_carats <= max_weight)
      AND (types IS NULL OR cardinality(types) = 0 OR g.name::text = ANY(types))
      AND (colors IS NULL OR cardinality(colors) = 0 OR g.color::text = ANY(colors))
      AND (cuts IS NULL OR cardinality(cuts) = 0 OR g.cut::text = ANY(cuts))
      AND (clarities IS NULL OR cardinality(clarities) = 0 OR g.clarity::text = ANY(clarities))
      AND (origins_filter IS NULL OR cardinality(origins_filter) = 0 OR g.origin_id IN (
        SELECT id FROM origins WHERE name = ANY(origins_filter)
      ))
      AND (in_stock_only IS NULL OR NOT in_stock_only OR g.in_stock = true)
      AND (has_ai_analysis_filter IS NULL OR NOT has_ai_analysis_filter OR g.ai_analyzed = true)
  )
  SELECT
    f.id,
    f.serial_number,
    f.name,
    f.color,
    f.cut,
    f.clarity,
    f.weight_carats,
    f.price_amount,
    f.price_currency,
    f.description,
    f.in_stock,
    f.origin_id,
    false AS has_certification,
    COALESCE(f.ai_analyzed, false) AS has_ai_analysis,
    f.metadata_status,
    f.created_at,
    f.updated_at,
    f.rank AS relevance_score,
    COUNT(*) OVER() AS total_count
  FROM filtered f
  ORDER BY f.rank DESC, f.created_at DESC
  OFFSET offset_val
  LIMIT page_size;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION search_gemstones_multilingual IS 
'Multilingual full-text search for gemstones with advanced filtering.
Returns columns: id, name (not gemstone_id, gemstone_name) to match client expectations.
Supports English and Russian search vectors with automatic locale detection.
Includes all advanced filters from the catalog API for consistency.';

COMMIT;

