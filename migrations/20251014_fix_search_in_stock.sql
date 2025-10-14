-- Fix: Add in_stock and origin fields to search_gemstones_fulltext function
-- This fixes the "Out of Stock" badge showing incorrectly on all search results
-- Date: 2025-10-14

DROP FUNCTION IF EXISTS search_gemstones_fulltext(text, jsonb, integer, integer);

CREATE OR REPLACE FUNCTION search_gemstones_fulltext(
  search_query text,
  filters jsonb,
  page_num integer,
  page_size integer
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
AS $$
DECLARE
  ts_query tsquery;
  offset_val integer;
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
  use_fuzzy boolean;
BEGIN
  -- Parse filters
  min_price := (filters->>'minPrice')::numeric;
  max_price := (filters->>'maxPrice')::numeric;
  min_weight := (filters->>'minWeight')::numeric;
  max_weight := (filters->>'maxWeight')::numeric;
  types := ARRAY(SELECT jsonb_array_elements_text(filters->'types'));
  colors := ARRAY(SELECT jsonb_array_elements_text(filters->'colors'));
  cuts := ARRAY(SELECT jsonb_array_elements_text(filters->'cuts'));
  clarities := ARRAY(SELECT jsonb_array_elements_text(filters->'clarities'));
  origins_filter := ARRAY(SELECT jsonb_array_elements_text(filters->'origins'));
  in_stock_only := (filters->>'inStockOnly')::boolean;
  has_images := (filters->>'hasImages')::boolean;
  has_certification_filter := (filters->>'hasCertification')::boolean;
  has_ai_analysis_filter := (filters->>'hasAIAnalysis')::boolean;
  use_fuzzy := COALESCE((filters->>'useFuzzy')::boolean, false);

  -- Build ts_query for full-text search
  IF search_query IS NOT NULL AND search_query != '' THEN
    ts_query := plainto_tsquery('english', search_query);
  ELSE
    ts_query := NULL;
  END IF;

  -- Calculate offset
  offset_val := (page_num - 1) * page_size;

  -- Main query with relevance scoring
  RETURN QUERY
  WITH filtered_gemstones AS (
    SELECT 
      g.*,
      CASE 
        WHEN use_fuzzy AND search_query IS NOT NULL AND search_query != '' THEN
          -- Fuzzy search using trigram similarity
          GREATEST(
            similarity(COALESCE(g.serial_number, ''), search_query),
            similarity(g.name::text, search_query),
            similarity(COALESCE(g.description, ''), search_query)
          )
        WHEN ts_query IS NULL THEN 0
        ELSE ts_rank_cd(
          to_tsvector('english',
            COALESCE(g.serial_number, '') || ' ' ||
            COALESCE(g.name::text, '') || ' ' ||
            COALESCE(g.description, '')
          ),
          ts_query,
          32
        )
      END AS rel_score,
      COUNT(*) OVER() AS total
    FROM gemstones g
    WHERE
      -- Search condition
      (ts_query IS NULL OR 
        to_tsvector('english',
          COALESCE(g.serial_number, '') || ' ' ||
          COALESCE(g.name::text, '') || ' ' ||
          COALESCE(g.description, '')
        ) @@ ts_query
        OR (use_fuzzy AND (
          similarity(COALESCE(g.serial_number, ''), search_query) > 0.3
          OR similarity(g.name::text, search_query) > 0.3
          OR similarity(COALESCE(g.description, ''), search_query) > 0.3
        )))
      -- Filters
      AND (min_price IS NULL OR g.price_amount >= min_price)
      AND (max_price IS NULL OR g.price_amount <= max_price)
      AND (min_weight IS NULL OR g.weight_carats >= min_weight)
      AND (max_weight IS NULL OR g.weight_carats <= max_weight)
      AND (types IS NULL OR cardinality(types) = 0 OR g.name::text = ANY(types))
      AND (colors IS NULL OR cardinality(colors) = 0 OR g.color::text = ANY(colors))
      AND (cuts IS NULL OR cardinality(cuts) = 0 OR g.cut::text = ANY(cuts))
      AND (clarities IS NULL OR cardinality(clarities) = 0 OR g.clarity::text = ANY(clarities))
      AND (in_stock_only IS NULL OR NOT in_stock_only OR g.price_amount > 0)
      AND (has_images IS NULL OR NOT has_images OR EXISTS (
        SELECT 1 FROM gemstone_images gi WHERE gi.gemstone_id = g.id
      ))
      AND (has_ai_analysis_filter IS NULL OR NOT has_ai_analysis_filter OR g.ai_analyzed = true)
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
    fg.origin_id,
    false AS has_certification,
    COALESCE(fg.ai_analyzed, false) AS has_ai_analysis,
    fg.metadata_status,
    fg.created_at,
    fg.updated_at,
    fg.rel_score::real AS relevance_score,
    fg.total AS total_count
  FROM filtered_gemstones fg
  ORDER BY
    fg.rel_score DESC,
    fg.created_at DESC
  LIMIT page_size
  OFFSET offset_val;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION search_gemstones_fulltext IS 'Full-text search with fuzzy fallback, now includes in_stock and origin fields';

