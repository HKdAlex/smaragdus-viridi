-- Update search functions to use cuts table instead of gem_cut_translations
-- Contract: CUT-C2.2

-- Drop old function overloads first
DROP FUNCTION IF EXISTS fuzzy_search_suggestions(text, integer);
DROP FUNCTION IF EXISTS fuzzy_search_suggestions(text, integer, text);
DROP FUNCTION IF EXISTS get_search_suggestions(text, integer, text);

-- Create fuzzy_search_suggestions with cuts table
CREATE OR REPLACE FUNCTION fuzzy_search_suggestions(
  search_term text,
  search_locale text DEFAULT 'en',
  suggestion_limit integer DEFAULT 10
)
RETURNS TABLE (
  suggestion text,
  similarity_score real,
  match_type text
)
LANGUAGE plpgsql
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
    
    -- Get cut translations from cuts table (CUT-C2.2)
    SELECT DISTINCT 
      CASE WHEN search_locale = 'ru' THEN cu.name_ru ELSE cu.name_en END AS term,
      'cut' AS match_type
    FROM cuts cu
    WHERE cu.is_active = true
    
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

-- Update get_search_suggestions to use cuts table
CREATE OR REPLACE FUNCTION get_search_suggestions(
  query text,
  search_locale text DEFAULT 'en',
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  suggestion text,
  category text,
  relevance real
)
LANGUAGE plpgsql
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
  
  -- Cuts (localized via cuts table - CUT-C2.2)
  SELECT DISTINCT
    CASE WHEN search_locale = 'ru' THEN c.name_ru ELSE c.name_en END AS suggestion,
    'cut'::text AS category,
    GREATEST(
      similarity(g.cut::text, query),
      similarity(CASE WHEN search_locale = 'ru' THEN c.name_ru ELSE c.name_en END, query)
    ) AS relevance
  FROM gemstones g
  LEFT JOIN cuts c ON c.id = g.cut_id
  WHERE g.cut::text % query
     OR (c.name_en IS NOT NULL AND c.name_en % query)
     OR (c.name_ru IS NOT NULL AND c.name_ru % query)
  
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

-- Update update_gemstone_search_vectors trigger function to use cuts table
CREATE OR REPLACE FUNCTION update_gemstone_search_vectors()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ai_record RECORD;
  origin_name_en text;
  origin_name_ru text;
  cut_name_en text;
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

  -- Get cut translations from cuts table (CUT-C2.2)
  SELECT name_en, name_ru
  INTO cut_name_en, cut_name_ru
  FROM cuts
  WHERE id = NEW.cut_id;

  SELECT name
  INTO clarity_name_ru
  FROM gem_clarity_translations
  WHERE clarity_code = NEW.clarity::text AND locale = 'ru';

  NEW.search_vector_en :=
    setweight(to_tsvector('english', coalesce(NEW.serial_number, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.name::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(cut_name_en, NEW.cut::text, '')), 'B') ||
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
$$;

COMMENT ON FUNCTION fuzzy_search_suggestions IS 'Fuzzy search suggestions using cuts table (CUT-C2.2)';
COMMENT ON FUNCTION get_search_suggestions IS 'Search suggestions using cuts table (CUT-C2.2)';
COMMENT ON FUNCTION update_gemstone_search_vectors IS 'Update search vectors using cuts table (CUT-C2.2)';
