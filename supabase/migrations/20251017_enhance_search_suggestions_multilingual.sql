-- Migration: Enhance search suggestions with multilingual support
-- Date: 2025-10-17
-- Purpose: Add locale parameter to search suggestions and include translated terms

BEGIN;

-- Drop existing function
DROP FUNCTION IF EXISTS get_search_suggestions(text, integer);

-- Recreate with locale parameter and translation table searches
CREATE OR REPLACE FUNCTION get_search_suggestions(
  query text,
  limit_count integer DEFAULT 10,
  search_locale text DEFAULT 'en'
)
RETURNS TABLE(suggestion text, category text, relevance real)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Serial numbers (no translation needed)
  SELECT DISTINCT
    g.serial_number AS suggestion,
    'serial_number'::text AS category,
    similarity(g.serial_number, query) AS relevance
  FROM gemstones g
  WHERE g.serial_number % query
  
  UNION ALL
  
  -- Gemstone types (localized)
  SELECT DISTINCT
    COALESCE(tt.name, g.name::text) AS suggestion,
    'type'::text AS category,
    GREATEST(
      similarity(g.name::text, query),
      COALESCE(similarity(tt.name, query), 0)
    ) AS relevance
  FROM gemstones g
  LEFT JOIN gemstone_type_translations tt ON tt.type_code = g.type_code AND tt.locale = search_locale
  WHERE g.name::text % query 
     OR (tt.name IS NOT NULL AND tt.name % query)
  
  UNION ALL
  
  -- Colors (localized)
  SELECT DISTINCT
    COALESCE(ct.name, g.color::text) AS suggestion,
    'color'::text AS category,
    GREATEST(
      similarity(g.color::text, query),
      COALESCE(similarity(ct.name, query), 0)
    ) AS relevance
  FROM gemstones g
  LEFT JOIN gem_color_translations ct ON ct.color_code = g.color_code AND ct.locale = search_locale
  WHERE g.color::text % query
     OR (ct.name IS NOT NULL AND ct.name % query)
  
  UNION ALL
  
  -- Cuts (localized)
  SELECT DISTINCT
    COALESCE(cut_t.name, g.cut::text) AS suggestion,
    'cut'::text AS category,
    GREATEST(
      similarity(g.cut::text, query),
      COALESCE(similarity(cut_t.name, query), 0)
    ) AS relevance
  FROM gemstones g
  LEFT JOIN gem_cut_translations cut_t ON cut_t.cut_code = g.cut::text AND cut_t.locale = search_locale
  WHERE g.cut::text % query
     OR (cut_t.name IS NOT NULL AND cut_t.name % query)
  
  UNION ALL
  
  -- Clarities (localized)
  SELECT DISTINCT
    COALESCE(cl_t.name, g.clarity::text) AS suggestion,
    'clarity'::text AS category,
    GREATEST(
      similarity(g.clarity::text, query),
      COALESCE(similarity(cl_t.name, query), 0)
    ) AS relevance
  FROM gemstones g
  LEFT JOIN gem_clarity_translations cl_t ON cl_t.clarity_code = g.clarity::text AND cl_t.locale = search_locale
  WHERE g.clarity::text % query
     OR (cl_t.name IS NOT NULL AND cl_t.name % query)
  
  ORDER BY relevance DESC
  LIMIT limit_count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION get_search_suggestions(text, integer, text) IS 
  'Provides multilingual autocomplete suggestions with trigram similarity matching. Searches across serial numbers, types, colors, cuts, and clarities with localized translations.';

COMMIT;

