-- Migration: Create Full-Text Search Functions
-- Date: 2025-10-13
-- Phase: 2 - Database & Full-Text Search
-- Purpose: Create RPC functions for full-text search with relevance ranking

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS search_gemstones_fulltext;

-- Create comprehensive full-text search function
CREATE OR REPLACE FUNCTION search_gemstones_fulltext(
  search_query text,
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
  offset_val integer;
  ts_query tsquery;
  min_price numeric;
  max_price numeric;
  min_weight numeric;
  max_weight numeric;
  types text[];
  colors text[];
  cuts text[];
  clarities text[];
  origins text[];
  in_stock_only boolean;
  has_images boolean;
  has_certification_filter boolean;
  has_ai_analysis_filter boolean;
BEGIN
  -- Calculate offset for pagination
  offset_val := (page_num - 1) * page_size;
  
  -- Convert search query to tsquery (handle empty query)
  IF search_query IS NULL OR search_query = '' THEN
    ts_query := NULL;
  ELSE
    -- Use plainto_tsquery for natural language queries
    ts_query := plainto_tsquery('english', search_query);
  END IF;
  
  -- Extract filters from JSONB
  min_price := (filters->>'minPrice')::numeric;
  max_price := (filters->>'maxPrice')::numeric;
  min_weight := (filters->>'minWeight')::numeric;
  max_weight := (filters->>'maxWeight')::numeric;
  
  -- Extract array filters
  types := ARRAY(SELECT jsonb_array_elements_text(filters->'gemstoneTypes'));
  colors := ARRAY(SELECT jsonb_array_elements_text(filters->'colors'));
  cuts := ARRAY(SELECT jsonb_array_elements_text(filters->'cuts'));
  clarities := ARRAY(SELECT jsonb_array_elements_text(filters->'clarities'));
  origins := ARRAY(SELECT jsonb_array_elements_text(filters->'origins'));
  
  -- Extract boolean filters
  in_stock_only := (filters->>'inStockOnly')::boolean;
  has_images := (filters->>'hasImages')::boolean;
  has_certification_filter := (filters->>'hasCertification')::boolean;
  has_ai_analysis_filter := (filters->>'hasAIAnalysis')::boolean;
  
  -- Main query with relevance scoring
  RETURN QUERY
  WITH filtered_gemstones AS (
    SELECT 
      g.*,
      CASE 
        WHEN ts_query IS NULL THEN 0
        ELSE ts_rank_cd(
          to_tsvector('english',
            COALESCE(g.serial_number, '') || ' ' ||
            COALESCE(g.description, '')
          ),
          ts_query,
          32 -- normalization flag: divide by document length
        )
      END AS rel_score,
      -- Count total matching records (for pagination)
      COUNT(*) OVER() AS total
    FROM gemstones g
    WHERE
      -- Full-text search condition (only text columns, enums filtered separately)
      (ts_query IS NULL OR to_tsvector('english',
        COALESCE(g.serial_number, '') || ' ' ||
        COALESCE(g.description, '')
      ) @@ ts_query)
      -- Price range filter
      AND (min_price IS NULL OR g.price_amount >= min_price)
      AND (max_price IS NULL OR g.price_amount <= max_price)
      -- Weight range filter
      AND (min_weight IS NULL OR g.weight_carats >= min_weight)
      AND (max_weight IS NULL OR g.weight_carats <= max_weight)
      -- Gemstone type filter (name column is gemstone_type enum)
      AND (types IS NULL OR cardinality(types) = 0 OR g.name::text = ANY(types))
      -- Color filter
      AND (colors IS NULL OR cardinality(colors) = 0 OR g.color = ANY(colors))
      -- Cut filter
      AND (cuts IS NULL OR cardinality(cuts) = 0 OR g.cut = ANY(cuts))
      -- Clarity filter
      AND (clarities IS NULL OR cardinality(clarities) = 0 OR g.clarity = ANY(clarities))
      -- Origin filter
      AND (origins IS NULL OR cardinality(origins) = 0 OR g.origin = ANY(origins))
      -- Stock filter (price > 0 means in stock)
      AND (in_stock_only IS NULL OR NOT in_stock_only OR g.price_amount > 0)
      -- Images filter
      AND (has_images IS NULL OR NOT has_images OR EXISTS (
        SELECT 1 FROM gemstone_images gi WHERE gi.gemstone_id = g.id
      ))
      -- Certification filter
      AND (has_certification_filter IS NULL OR NOT has_certification_filter OR g.has_certification = true)
      -- AI Analysis filter
      AND (has_ai_analysis_filter IS NULL OR NOT has_ai_analysis_filter OR g.has_ai_analysis = true)
    ORDER BY
      -- Order by relevance score (highest first), then by created date
      CASE WHEN ts_query IS NULL THEN 0 ELSE rel_score END DESC,
      g.created_at DESC
    LIMIT page_size
    OFFSET offset_val
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
    COALESCE(fg.has_certification, false) AS has_certification,
    COALESCE(fg.has_ai_analysis, false) AS has_ai_analysis,
    fg.metadata_status,
    fg.created_at,
    fg.updated_at,
    fg.rel_score::real AS relevance_score,
    fg.total AS total_count
  FROM filtered_gemstones fg;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_gemstones_fulltext TO authenticated;
GRANT EXECUTE ON FUNCTION search_gemstones_fulltext TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION search_gemstones_fulltext IS 
  'Full-text search with relevance ranking and comprehensive filtering. Returns paginated results with total count.';

-- Create helper function for search suggestions (autocomplete)
DROP FUNCTION IF EXISTS get_search_suggestions;

CREATE OR REPLACE FUNCTION get_search_suggestions(
  query text,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  suggestion text,
  category text,
  relevance real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Get suggestions from serial numbers
  SELECT DISTINCT
    g.serial_number AS suggestion,
    'serial_number'::text AS category,
    similarity(g.serial_number, query) AS relevance
  FROM gemstones g
  WHERE g.serial_number % query  -- % is the trigram similarity operator
  
  UNION ALL
  
  -- Get suggestions from gemstone types
  SELECT DISTINCT
    g.name::text AS suggestion,
    'type'::text AS category,
    similarity(g.name::text, query) AS relevance
  FROM gemstones g
  WHERE g.name::text % query
  
  UNION ALL
  
  -- Get suggestions from colors
  SELECT DISTINCT
    g.color::text AS suggestion,
    'color'::text AS category,
    similarity(g.color::text, query) AS relevance
  FROM gemstones g
  WHERE g.color::text % query
  
  ORDER BY relevance DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_search_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO anon;

COMMENT ON FUNCTION get_search_suggestions IS 
  'Get search suggestions using trigram similarity for autocomplete functionality';

