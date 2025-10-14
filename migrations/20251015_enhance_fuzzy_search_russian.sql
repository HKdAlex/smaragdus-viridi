-- Migration: Enhance Fuzzy Search with Russian Support
-- Date: 2025-10-15
-- Purpose: Update fuzzy_search_suggestions to support Russian translations

BEGIN;

-- Enhanced fuzzy search with Russian translation support
CREATE OR REPLACE FUNCTION fuzzy_search_suggestions(
  search_term text,
  suggestion_limit integer DEFAULT 5,
  search_locale text DEFAULT 'en'
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
  WITH all_terms AS (
    -- Get gemstone type translations
    SELECT DISTINCT 
      t.name AS term,
      'type' AS match_type
    FROM gemstone_type_translations t
    WHERE t.locale = search_locale
    
    UNION
    
    -- Get color translations
    SELECT DISTINCT 
      c.name AS term,
      'color' AS match_type
    FROM gem_color_translations c
    WHERE c.locale = search_locale
    
    UNION
    
    -- Get cut translations
    SELECT DISTINCT 
      cu.name AS term,
      'cut' AS match_type
    FROM gem_cut_translations cu
    WHERE cu.locale = search_locale
    
    UNION
    
    -- Get clarity translations
    SELECT DISTINCT 
      cl.name AS term,
      'clarity' AS match_type
    FROM gem_clarity_translations cl
    WHERE cl.locale = search_locale
  )
  SELECT 
    at.term AS suggestion,
    similarity(at.term, search_term) AS similarity_score,
    at.match_type
  FROM all_terms at
  WHERE similarity(at.term, search_term) > 0.3  -- Similarity threshold
  ORDER BY similarity_score DESC, at.term
  LIMIT suggestion_limit;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION fuzzy_search_suggestions IS 
'Finds similar terms using trigram similarity for "Did you mean?" suggestions.
Now supports multiple locales by querying translation tables.
Uses pg_trgm extension with 0.3 similarity threshold.
Returns suggestions from gemstone types, colors, cuts, and clarities in the specified locale.';

COMMIT;

