-- Fix search functions that reference non-existent g.cut column
-- The cut column was replaced with cut_id (UUID reference to cuts table)
-- Contract: FILTER-C0.1 (prerequisite fix)
-- NOTE: This migration was superseded by fix_search_functions_all_types
-- which correctly handles all column types including enums

-- Drop and recreate get_search_suggestions to use cut_id instead of cut
DROP FUNCTION IF EXISTS get_search_suggestions(text, text, integer);

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
  
  -- Cuts (localized via cuts table - using cut_id instead of cut)
  SELECT DISTINCT
    CASE WHEN search_locale = 'ru' THEN c.name_ru ELSE c.name_en END AS suggestion,
    'cut'::text AS category,
    GREATEST(
      COALESCE(similarity(c.code, query), 0),
      similarity(CASE WHEN search_locale = 'ru' THEN c.name_ru ELSE c.name_en END, query)
    ) AS relevance
  FROM gemstones g
  INNER JOIN cuts c ON c.id = g.cut_id
  WHERE c.code % query
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

-- Update search_gemstones_multilingual to use cut_id instead of cut
-- First check if the function exists and what it looks like
DROP FUNCTION IF EXISTS search_gemstones_multilingual(text, integer, integer, text, boolean, jsonb);

CREATE OR REPLACE FUNCTION search_gemstones_multilingual(
  search_query text DEFAULT '',
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 24,
  effective_locale text DEFAULT 'en',
  description_enabled boolean DEFAULT false,
  filters jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id uuid,
  serial_number text,
  internal_code text,
  name text,
  color text,
  cut text,
  clarity text,
  weight_carats numeric,
  price_amount numeric,
  price_currency text,
  price_per_carat numeric,
  in_stock boolean,
  quantity integer,
  description text,
  origin_id uuid,
  origin_name text,
  type_code text,
  color_code text,
  cut_code text,
  cut_id uuid,
  certification_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint,
  rank real
)
LANGUAGE plpgsql
AS $$
DECLARE
  offset_val integer;
  filter_types text[];
  filter_colors text[];
  filter_cuts text[];
  filter_clarities text[];
  filter_origins text[];
  filter_in_stock boolean;
  filter_has_certification boolean;
  filter_has_images boolean;
  filter_price_min numeric;
  filter_price_max numeric;
  filter_weight_min numeric;
  filter_weight_max numeric;
  use_fuzzy boolean;
BEGIN
  -- Calculate offset
  offset_val := (page_number - 1) * page_size;
  
  -- Extract filters from JSONB
  filter_types := ARRAY(SELECT jsonb_array_elements_text(filters->'gemstoneTypes'));
  filter_colors := ARRAY(SELECT jsonb_array_elements_text(filters->'colors'));
  filter_cuts := ARRAY(SELECT jsonb_array_elements_text(filters->'cuts'));
  filter_clarities := ARRAY(SELECT jsonb_array_elements_text(filters->'clarities'));
  filter_origins := ARRAY(SELECT jsonb_array_elements_text(filters->'origins'));
  filter_in_stock := (filters->>'inStockOnly')::boolean;
  filter_has_certification := (filters->>'hasCertification')::boolean;
  filter_has_images := (filters->>'hasImages')::boolean;
  filter_price_min := (filters->'priceRange'->>'min')::numeric;
  filter_price_max := (filters->'priceRange'->>'max')::numeric;
  filter_weight_min := (filters->'weightRange'->>'min')::numeric;
  filter_weight_max := (filters->'weightRange'->>'max')::numeric;
  use_fuzzy := COALESCE((filters->>'useFuzzy')::boolean, false);

  RETURN QUERY
  WITH search_results AS (
    SELECT 
      g.id,
      g.serial_number,
      g.internal_code,
      COALESCE(tt.name, g.name::text) AS name,
      COALESCE(ct.name, g.color::text) AS color,
      COALESCE(
        CASE WHEN effective_locale = 'ru' THEN cu.name_ru ELSE cu.name_en END,
        cu.code,
        g.cut_code
      ) AS cut,
      COALESCE(cl_t.name, g.clarity::text) AS clarity,
      g.weight_carats,
      g.price_amount,
      g.price_currency,
      g.price_per_carat,
      g.in_stock,
      g.quantity,
      g.description,
      g.origin_id,
      o.name AS origin_name,
      g.type_code,
      g.color_code,
      g.cut_code,
      g.cut_id,
      g.certification_id,
      g.created_at,
      g.updated_at,
      CASE 
        WHEN search_query = '' OR search_query IS NULL THEN 0
        WHEN use_fuzzy THEN
          GREATEST(
            similarity(g.serial_number, search_query),
            similarity(COALESCE(tt.name, g.name::text), search_query),
            similarity(COALESCE(ct.name, g.color::text), search_query)
          )
        ELSE
          ts_rank_cd(
            CASE WHEN effective_locale = 'ru' 
              THEN COALESCE(g.search_vector_ru, to_tsvector('russian', ''))
              ELSE COALESCE(g.search_vector_en, to_tsvector('english', ''))
            END,
            CASE WHEN effective_locale = 'ru'
              THEN plainto_tsquery('russian', search_query)
              ELSE plainto_tsquery('english', search_query)
            END
          )
      END AS rank
    FROM gemstones g
    LEFT JOIN gemstone_type_translations tt ON tt.type_code = g.type_code AND tt.locale = effective_locale
    LEFT JOIN gem_color_translations ct ON ct.color_code = g.color_code AND ct.locale = effective_locale
    LEFT JOIN cuts cu ON cu.id = g.cut_id
    LEFT JOIN gem_clarity_translations cl_t ON cl_t.clarity_code = g.clarity::text AND cl_t.locale = effective_locale
    LEFT JOIN origins o ON o.id = g.origin_id
    WHERE 
      -- Text search condition
      (
        search_query = '' OR search_query IS NULL
        OR (
          CASE WHEN use_fuzzy THEN
            similarity(g.serial_number, search_query) > 0.3
            OR similarity(COALESCE(tt.name, g.name::text), search_query) > 0.3
            OR similarity(COALESCE(ct.name, g.color::text), search_query) > 0.3
          ELSE
            CASE WHEN effective_locale = 'ru' THEN
              CASE WHEN description_enabled THEN
                g.search_vector_ru @@ plainto_tsquery('russian', search_query)
                OR g.description_vector_ru @@ plainto_tsquery('russian', search_query)
              ELSE
                g.search_vector_ru @@ plainto_tsquery('russian', search_query)
              END
            ELSE
              CASE WHEN description_enabled THEN
                g.search_vector_en @@ plainto_tsquery('english', search_query)
                OR g.description_vector_en @@ plainto_tsquery('english', search_query)
              ELSE
                g.search_vector_en @@ plainto_tsquery('english', search_query)
              END
            END
          END
        )
      )
      -- Type filter
      AND (cardinality(filter_types) = 0 OR g.name::text = ANY(filter_types))
      -- Color filter
      AND (cardinality(filter_colors) = 0 OR g.color::text = ANY(filter_colors))
      -- Cut filter (using cut_code or cuts table code)
      AND (cardinality(filter_cuts) = 0 OR g.cut_code = ANY(filter_cuts) OR cu.code = ANY(filter_cuts))
      -- Clarity filter
      AND (cardinality(filter_clarities) = 0 OR g.clarity::text = ANY(filter_clarities))
      -- Origin filter
      AND (cardinality(filter_origins) = 0 OR g.origin_id::text = ANY(filter_origins))
      -- In stock filter
      AND (filter_in_stock IS NULL OR filter_in_stock = false OR g.in_stock = true)
      -- Has certification filter
      AND (filter_has_certification IS NULL OR filter_has_certification = false OR g.certification_id IS NOT NULL)
      -- Has images filter
      AND (filter_has_images IS NULL OR filter_has_images = false OR EXISTS (
        SELECT 1 FROM gemstone_images gi WHERE gi.gemstone_id = g.id
      ))
      -- Price range filter
      AND (filter_price_min IS NULL OR g.price_amount >= filter_price_min)
      AND (filter_price_max IS NULL OR g.price_amount <= filter_price_max)
      -- Weight range filter
      AND (filter_weight_min IS NULL OR g.weight_carats >= filter_weight_min)
      AND (filter_weight_max IS NULL OR g.weight_carats <= filter_weight_max)
  ),
  counted AS (
    SELECT *, COUNT(*) OVER() AS total_count
    FROM search_results
  )
  SELECT 
    counted.id,
    counted.serial_number,
    counted.internal_code,
    counted.name,
    counted.color,
    counted.cut,
    counted.clarity,
    counted.weight_carats,
    counted.price_amount,
    counted.price_currency,
    counted.price_per_carat,
    counted.in_stock,
    counted.quantity,
    counted.description,
    counted.origin_id,
    counted.origin_name,
    counted.type_code,
    counted.color_code,
    counted.cut_code,
    counted.cut_id,
    counted.certification_id,
    counted.created_at,
    counted.updated_at,
    counted.total_count,
    counted.rank
  FROM counted
  ORDER BY 
    CASE WHEN search_query = '' OR search_query IS NULL THEN counted.created_at END DESC,
    counted.rank DESC
  LIMIT page_size
  OFFSET offset_val;
END;
$$;

-- Update update_gemstone_search_vectors to not reference g.cut
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

  -- Get cut translations from cuts table
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
    setweight(to_tsvector('english', coalesce(cut_name_en, NEW.cut_code, '')), 'B') ||
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
    setweight(to_tsvector('russian', coalesce(cut_name_ru, NEW.cut_code, '')), 'B') ||
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

COMMENT ON FUNCTION get_search_suggestions IS 'Search suggestions using cuts table via cut_id (FILTER-C0.1 fix)';
COMMENT ON FUNCTION search_gemstones_multilingual IS 'Multilingual search using cuts table via cut_id (FILTER-C0.1 fix)';
COMMENT ON FUNCTION update_gemstone_search_vectors IS 'Update search vectors using cuts table via cut_id (FILTER-C0.1 fix)';
