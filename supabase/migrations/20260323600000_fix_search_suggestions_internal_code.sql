-- Fix get_search_suggestions to include internal_code and remove broken gem_cut_translations reference.
-- The old function referenced gem_cut_translations which does not exist in this database,
-- causing runtime errors. This migration:
--   1. Drops the duplicate overload (query, search_locale, limit_count) if it still exists.
--   2. Recreates the canonical overload (query, limit_count, search_locale) with:
--      - internal_code ILIKE space-normalised matching (И468 finds И 468)
--      - cut_code column instead of non-existent gem_cut_translations join

DROP FUNCTION IF EXISTS get_search_suggestions(text, text, integer);

CREATE OR REPLACE FUNCTION get_search_suggestions(
  query text,
  limit_count integer DEFAULT 10,
  search_locale text DEFAULT 'en'
)
RETURNS TABLE(suggestion text, category text, relevance real)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  nospace_pattern text;
BEGIN
  -- Build a space-normalised ILIKE pattern so И468 matches И 468
  nospace_pattern := '%' || replace(replace(replace(replace(query, ' ', ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';

  RETURN QUERY
  -- Internal codes (ILIKE space-normalised, highest priority for code searches)
  SELECT DISTINCT
    g.internal_code AS suggestion,
    'serial_number'::text AS category,
    1.0::real AS relevance
  FROM gemstones g
  WHERE g.internal_code IS NOT NULL
    AND REPLACE(g.internal_code, ' ', '') ILIKE nospace_pattern

  UNION ALL

  -- Serial numbers: space-normalised ILIKE (V18 finds V 18) — highest priority for serial matches
  SELECT DISTINCT
    g.serial_number AS suggestion,
    'serial_number'::text AS category,
    1.0::real AS relevance
  FROM gemstones g
  WHERE REPLACE(g.serial_number, ' ', '') ILIKE nospace_pattern

  UNION ALL

  -- Serial numbers: trigram similarity fallback for fuzzy partial matches
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

  -- Cuts (cut_code text column; gem_cut_translations does not exist in this DB)
  SELECT DISTINCT
    g.cut_code AS suggestion,
    'cut'::text AS category,
    similarity(g.cut_code, query) AS relevance
  FROM gemstones g
  WHERE g.cut_code IS NOT NULL AND g.cut_code % query

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

COMMENT ON FUNCTION get_search_suggestions(text, integer, text) IS
  'Autocomplete suggestions: internal codes (ILIKE space-normalised), serial numbers, types, colors, cuts, clarities.';
