-- Migration: Add quantity field to search_gemstones_multilingual function
-- Date: 2025-01-17
-- Purpose: Include quantity field in search results to match catalog behavior

BEGIN;

-- Drop and recreate the function with quantity field
DROP FUNCTION IF EXISTS search_gemstones_multilingual(text, text, jsonb, integer, integer);

-- Multilingual search function with quantity field
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
  quantity integer,
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
  has_images boolean := (filters->>'hasImages')::boolean;
  has_certification_filter boolean := (filters->>'hasCertification')::boolean;
  has_ai_analysis_filter boolean := (filters->>'hasAIAnalysis')::boolean;
BEGIN
  -- Parse search query
  IF search_query IS NOT NULL AND search_query != '' THEN
    ts_query := plainto_tsquery('english', search_query);
  END IF;

  -- Main query with relevance scoring
  RETURN QUERY
  WITH filtered_gemstones AS (
    SELECT 
      g.*,
      CASE 
        WHEN ts_query IS NULL THEN 0
        ELSE ts_rank_cd(
          CASE 
            WHEN effective_locale = 'ru' THEN g.search_vector_ru
            ELSE g.search_vector_en
          END,
          ts_query,
          32 -- normalization flag: divide by document length
        )
      END AS rel_score,
      COUNT(*) OVER() AS total
    FROM gemstones g
    WHERE
      -- Always filter out gems with price <= 0 (matches catalog behavior)
      g.price_amount > 0
      -- Ensure gem has at least one image (matches catalog behavior)
      AND EXISTS (SELECT 1 FROM gemstone_images WHERE gemstone_id = g.id)
      -- Full-text search condition
      AND (ts_query IS NULL OR 
        CASE 
          WHEN effective_locale = 'ru' THEN g.search_vector_ru @@ ts_query
          ELSE g.search_vector_en @@ ts_query
        END)
      -- Price range filter
      AND (min_price IS NULL OR g.price_amount >= min_price)
      AND (max_price IS NULL OR g.price_amount <= max_price)
      -- Weight range filter
      AND (min_weight IS NULL OR g.weight_carats >= min_weight)
      AND (max_weight IS NULL OR g.weight_carats <= max_weight)
      -- Gemstone type filter
      AND (types IS NULL OR cardinality(types) = 0 OR g.name::text = ANY(types))
      -- Color filter
      AND (colors IS NULL OR cardinality(colors) = 0 OR g.color::text = ANY(colors))
      -- Cut filter
      AND (cuts IS NULL OR cardinality(cuts) = 0 OR g.cut::text = ANY(cuts))
      -- Clarity filter
      AND (clarities IS NULL OR cardinality(clarities) = 0 OR g.clarity::text = ANY(clarities))
      -- Stock filter
      AND (in_stock_only IS NULL OR NOT in_stock_only OR g.in_stock = true)
      -- Images filter
      AND (has_images IS NULL OR NOT has_images OR EXISTS (
        SELECT 1 FROM gemstone_images gi WHERE gi.gemstone_id = g.id
      ))
      -- Certification filter
      AND (has_certification_filter IS NULL OR NOT has_certification_filter OR g.has_certification = true)
      -- AI Analysis filter
      AND (has_ai_analysis_filter IS NULL OR NOT has_ai_analysis_filter OR EXISTS (
        SELECT 1 FROM ai_analysis_results aar WHERE aar.gemstone_id = g.id
      ))
      -- Origin filter
      AND (origins_filter IS NULL OR cardinality(origins_filter) = 0 OR g.origin_id::text = ANY(origins_filter))
  )
  SELECT 
    fg.id,
    fg.serial_number,
    fg.name,
    fg.color,
    fg.cut,
    fg.clarity,
    fg.weight_carats,
    fg.price_amount,
    fg.price_currency,
    fg.description,
    fg.in_stock,
    fg.quantity,
    fg.origin_id,
    fg.has_certification,
    fg.has_ai_analysis,
    fg.metadata_status,
    fg.created_at,
    fg.updated_at,
    fg.rel_score,
    fg.total
  FROM filtered_gemstones fg
  ORDER BY fg.rel_score DESC, fg.created_at DESC
  LIMIT page_size OFFSET offset_val;
END;
$$;

COMMIT;
