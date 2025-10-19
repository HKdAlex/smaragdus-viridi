-- Migration: Fix search function to filter by primary_image_url
-- Date: 2025-10-18
-- Purpose: Ensure search_gemstones_multilingual filters by primary_image_url like catalog API
-- Issue: Search results missing gemstones that have primary_image_url but are filtered out

BEGIN;

-- Drop existing function
DROP FUNCTION IF EXISTS search_gemstones_multilingual(text, text, jsonb, integer, integer);

-- Recreate function with primary_image_url filter
CREATE OR REPLACE FUNCTION search_gemstones_multilingual(
  search_query text,
  effective_locale text DEFAULT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 24,
  description_enabled boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  serial_number text,
  name text,
  color text,
  cut text,
  clarity text,
  weight_carats numeric,
  price_amount integer,
  price_currency text,
  description text,
  in_stock boolean,
  origin_id uuid,
  has_certification boolean,
  has_ai_analysis boolean,
  metadata_status text,
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
  offset_val integer;
  ts_query tsquery;
  base_vector tsvector;
  final_vector tsvector;
  min_price integer := (filters->>'priceMin')::integer;
  max_price integer := (filters->>'priceMax')::integer;
  min_weight numeric := (filters->>'weightMin')::numeric;
  max_weight numeric := (filters->>'weightMax')::numeric;
  gemstone_types text[] := (filters->>'gemstoneTypes')::text[];
  colors text[] := (filters->>'colors')::text[];
  cuts text[] := (filters->>'cuts')::text[];
  clarities text[] := (filters->>'clarities')::text[];
  origins text[] := (filters->>'origins')::text[];
  in_stock_only boolean := COALESCE((filters->>'inStockOnly')::boolean, false);
  has_images_filter boolean := COALESCE((filters->>'hasImages')::boolean, false);
  has_certification_filter boolean := COALESCE((filters->>'hasCertification')::boolean, false);
  has_ai_analysis_filter boolean := COALESCE((filters->>'hasAIAnalysis')::boolean, false);

BEGIN
  offset_val := (page_number - 1) * page_size;

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
      g.name::text AS name,
      g.color::text AS color,
      g.cut::text AS cut,
      g.clarity::text AS clarity,
      g.weight_carats,
      g.price_amount,
      g.price_currency::text AS price_currency,
      g.description,
      g.in_stock,
      g.origin_id,
      g.metadata_status::text AS metadata_status,
      g.created_at,
      g.updated_at,
      CASE
        WHEN ts_query IS NULL THEN 0.0
        WHEN effective_locale = 'ru' THEN
          ts_rank_cd(final_vector, ts_query)
        ELSE
          ts_rank_cd(final_vector, ts_query)
      END AS rank,
      EXISTS(SELECT 1 FROM certifications c WHERE c.gemstone_id = g.id) AS has_certification,
      EXISTS(SELECT 1 FROM gemstones_ai_v6 v6 WHERE v6.gemstone_id = g.id) AS has_ai_analysis
    FROM gemstones g
    WHERE
      -- Always filter out gems with price <= 0 (matches catalog behavior)
      g.price_amount > 0
      -- Filter by primary_image_url (matches catalog behavior)
      AND g.primary_image_url IS NOT NULL
      -- Search query filter
      AND (search_query IS NULL OR ts_query @@ final_vector)
      -- Advanced filters (matching catalog API logic)
      AND (min_price IS NULL OR g.price_amount >= min_price)
      AND (max_price IS NULL OR g.price_amount <= max_price)
      AND (min_weight IS NULL OR g.weight_carats >= min_weight)
      AND (max_weight IS NULL OR g.weight_carats <= max_weight)
      AND (gemstone_types IS NULL OR array_length(gemstone_types, 1) IS NULL OR g.name::text = ANY(gemstone_types))
      AND (colors IS NULL OR array_length(colors, 1) IS NULL OR g.color::text = ANY(colors))
      AND (cuts IS NULL OR array_length(cuts, 1) IS NULL OR g.cut::text = ANY(cuts))
      AND (clarities IS NULL OR array_length(clarities, 1) IS NULL OR g.clarity::text = ANY(clarities))
      AND (origins IS NULL OR array_length(origins, 1) IS NULL OR g.origin_id::text = ANY(origins))
      AND (NOT in_stock_only OR g.in_stock = true)
      AND (NOT has_images_filter OR EXISTS (SELECT 1 FROM gemstone_images gi WHERE gi.gemstone_id = g.id))
      AND (NOT has_certification_filter OR EXISTS (SELECT 1 FROM certifications c WHERE c.gemstone_id = g.id))
      AND (NOT has_ai_analysis_filter OR EXISTS (SELECT 1 FROM gemstones_ai_v6 v6 WHERE v6.gemstone_id = g.id))
  ),
  ranked AS (
    SELECT *,
      ROW_NUMBER() OVER (ORDER BY rank DESC, created_at DESC) as row_num,
      COUNT(*) OVER() as total_count
    FROM filtered
  )
  SELECT
    r.id,
    r.serial_number,
    r.name,
    r.color,
    r.cut,
    r.clarity,
    r.weight_carats,
    r.price_amount,
    r.price_currency,
    r.description,
    r.in_stock,
    r.origin_id,
    r.has_certification,
    r.has_ai_analysis,
    r.metadata_status,
    r.created_at,
    r.updated_at,
    r.rank,
    r.total_count
  FROM ranked r
  WHERE r.row_num > offset_val AND r.row_num <= offset_val + page_size
  ORDER BY r.rank DESC, r.created_at DESC;
END;
$$;

COMMENT ON FUNCTION search_gemstones_multilingual IS 'Multilingual search function with primary_image_url filter to match catalog API behavior';

COMMIT;
