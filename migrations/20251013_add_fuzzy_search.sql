-- Migration: Add Fuzzy Search with Trigram Similarity
-- Description: Enhances search_gemstones_fulltext to fall back to fuzzy matching
--              when exact full-text search returns no results or few results.
--              Uses pg_trgm extension for similarity matching.

-- Create fuzzy search suggestions function
-- This function finds similar terms when a search returns no results
CREATE OR REPLACE FUNCTION fuzzy_search_suggestions(
  search_term text,
  suggestion_limit integer DEFAULT 5
)
RETURNS TABLE (
  suggestion text,
  similarity_score real,
  match_type text
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH gemstone_terms AS (
    -- Get unique gemstone names (types)
    SELECT DISTINCT 
      g.name::text AS term,
      'type' AS match_type
    FROM gemstones g
    WHERE g.name IS NOT NULL
    
    UNION
    
    -- Get unique colors
    SELECT DISTINCT 
      g.color::text AS term,
      'color' AS match_type
    FROM gemstones g
    WHERE g.color IS NOT NULL
    
    UNION
    
    -- Get unique cuts
    SELECT DISTINCT 
      g.cut::text AS term,
      'cut' AS match_type
    FROM gemstones g
    WHERE g.cut IS NOT NULL
    
    UNION
    
    -- Get unique clarities
    SELECT DISTINCT 
      g.clarity::text AS term,
      'clarity' AS match_type
    FROM gemstones g
    WHERE g.clarity IS NOT NULL
  )
  SELECT 
    gt.term AS suggestion,
    similarity(gt.term, search_term) AS similarity_score,
    gt.match_type
  FROM gemstone_terms gt
  WHERE similarity(gt.term, search_term) > 0.3  -- Similarity threshold
  ORDER BY similarity_score DESC, gt.term
  LIMIT suggestion_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION fuzzy_search_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION fuzzy_search_suggestions TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION fuzzy_search_suggestions IS 
'Finds similar terms using trigram similarity for "Did you mean?" suggestions.
Uses pg_trgm extension with 0.3 similarity threshold.
Returns suggestions from gemstone types, colors, cuts, and clarities.';

-- Update search_gemstones_fulltext to include fuzzy fallback
-- This modifies the existing function to handle fuzzy matching
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
  in_stock_only boolean;
  has_images boolean;
  has_certification_filter boolean;
  has_ai_analysis_filter boolean;
  use_fuzzy boolean DEFAULT false;
BEGIN
  -- Calculate offset for pagination
  offset_val := (page_num - 1) * page_size;
  
  -- Convert search query to tsquery (handle empty query)
  IF search_query IS NULL OR search_query = '' THEN
    ts_query := NULL;
  ELSE
    -- Use plainto_tsquery for natural language queries
    ts_query := plainto_tsquery('english', search_query);
    -- Check if we should use fuzzy search (when ts_query would match nothing)
    -- We'll try exact first, and service layer can retry with fuzzy if needed
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
  
  -- Extract boolean filters
  in_stock_only := (filters->>'inStockOnly')::boolean;
  has_images := (filters->>'hasImages')::boolean;
  has_certification_filter := (filters->>'hasCertification')::boolean;
  has_ai_analysis_filter := (filters->>'hasAIAnalysis')::boolean;
  use_fuzzy := COALESCE((filters->>'useFuzzy')::boolean, false);
  
  -- Main query with relevance scoring (full-text or fuzzy)
  RETURN QUERY
  WITH filtered_gemstones AS (
    SELECT 
      g.*,
      CASE 
        WHEN ts_query IS NULL THEN 0
        WHEN use_fuzzy THEN
          -- Fuzzy matching using trigram similarity
          GREATEST(
            similarity(g.serial_number, search_query),
            similarity(g.name::text, search_query),
            similarity(COALESCE(g.description, ''), search_query)
          )
        ELSE
          -- Standard full-text search
          ts_rank_cd(
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
      -- Search condition (full-text or fuzzy)
      (ts_query IS NULL OR 
        (use_fuzzy AND (
          similarity(g.serial_number, search_query) > 0.3 OR
          similarity(g.name::text, search_query) > 0.3 OR
          similarity(COALESCE(g.description, ''), search_query) > 0.3
        )) OR
        (NOT use_fuzzy AND to_tsvector('english',
          COALESCE(g.serial_number, '') || ' ' ||
          COALESCE(g.name::text, '') || ' ' ||
          COALESCE(g.description, '')
        ) @@ ts_query))
      -- All other filters remain the same
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_gemstones_fulltext TO authenticated;
GRANT EXECUTE ON FUNCTION search_gemstones_fulltext TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION search_gemstones_fulltext IS 
'Comprehensive search with full-text and fuzzy matching support.
Set useFuzzy:true in filters JSONB to enable trigram similarity matching.
Full-text uses ts_rank_cd, fuzzy uses similarity() with 0.3 threshold.';

