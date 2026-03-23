-- Migration: Search improvements
--
-- 1A. get_search_suggestions: space-normalized serial number matching
--     V17 now returns V 17 as a suggestion (similarity was 0.286, below 0.3 threshold)
-- 1B. fuzzy_search_suggestions: add serial numbers to all_terms CTE
--     Serial numbers were never searched in "did you mean?" suggestions
-- 1C. search_gemstones_multilingual: boost rank for ILIKE serial number matches
--     V17 matching V 17 via ILIKE had rank=0, now gets rank=10 to sort first
-- 1D. search_gemstones_multilingual: simplify redundant FTS WHERE branches
--     4 nested CASE branches reduced to 2 (locale × description_enabled)
-- 1E. New trigger: refresh search vectors when gemstones_ai_v6 is updated
--     Previously, updating AI text didn't rebuild tsvectors on the gemstone row


-- =============================================
-- 1A. Fix get_search_suggestions
-- =============================================

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
  -- Serial numbers: trigram match (existing)
  SELECT DISTINCT
    g.serial_number AS suggestion,
    'serial_number'::text AS category,
    similarity(g.serial_number, query) AS relevance
  FROM gemstones g
  WHERE g.serial_number % query

  UNION ALL

  -- Serial numbers: space-normalized match (NEW)
  -- Handles V17 finding V 17 and vice versa when trigram similarity is below threshold
  SELECT DISTINCT
    g.serial_number AS suggestion,
    'serial_number'::text AS category,
    1.0::real AS relevance
  FROM gemstones g
  WHERE
    REPLACE(g.serial_number, ' ', '') ILIKE '%' || REPLACE(query, ' ', '') || '%'
    AND NOT (g.serial_number % query)  -- Avoid duplicates with trigram branch

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

  -- Cuts (localized via cuts table)
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

COMMENT ON FUNCTION get_search_suggestions IS 'Autocomplete suggestions with space-normalized serial number matching (V17 finds V 17).';


-- =============================================
-- 1B. Fix fuzzy_search_suggestions
-- =============================================

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
    -- Gemstone type translations
    SELECT DISTINCT
      t.name AS term,
      'type' AS match_type
    FROM gemstone_type_translations t
    WHERE t.locale = search_locale

    UNION

    -- Color translations
    SELECT DISTINCT
      c.name AS term,
      'color' AS match_type
    FROM gem_color_translations c
    WHERE c.locale = search_locale

    UNION

    -- Cut translations from cuts table
    SELECT DISTINCT
      CASE WHEN search_locale = 'ru' THEN cu.name_ru ELSE cu.name_en END AS term,
      'cut' AS match_type
    FROM cuts cu
    WHERE cu.is_active = true

    UNION

    -- Clarity translations
    SELECT DISTINCT
      cl.name AS term,
      'clarity' AS match_type
    FROM gem_clarity_translations cl
    WHERE cl.locale = search_locale

    UNION

    -- Serial numbers (NEW): include in "did you mean?" suggestions
    SELECT DISTINCT
      g.serial_number AS term,
      'serial_number' AS match_type
    FROM gemstones g
    WHERE g.serial_number IS NOT NULL
  )
  SELECT
    at.term AS suggestion,
    GREATEST(
      similarity(at.term, search_term),
      -- Space-normalized similarity: compare stripped versions
      similarity(REPLACE(at.term, ' ', ''), REPLACE(search_term, ' ', ''))
    ) AS similarity_score,
    at.match_type
  FROM all_terms at
  WHERE
    similarity(at.term, search_term) > 0.3
    OR similarity(REPLACE(at.term, ' ', ''), REPLACE(search_term, ' ', '')) > 0.3
  ORDER BY similarity_score DESC, at.term
  LIMIT suggestion_limit;
END;
$$;

COMMENT ON FUNCTION fuzzy_search_suggestions IS '"Did you mean?" suggestions including serial numbers with space-normalized matching.';


-- =============================================
-- 1C + 1D. Fix search_gemstones_multilingual
--   1C: Boost rank to 10.0 for ILIKE serial number matches
--   1D: Simplify FTS WHERE from 4 nested branches to 2
-- =============================================

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
  price_amount integer,
  price_currency text,
  price_per_carat integer,
  in_stock boolean,
  quantity integer,
  description text,
  origin_id uuid,
  origin_name text,
  type_code text,
  color_code text,
  cut_code text,
  cut_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint,
  rank real
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val integer;
  search_nospace_pattern text;
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
  filter_treatment_status text[];
  filter_mining_countries text[];
  filter_quality_classifications text[];
  filter_has_color_change boolean;
  filter_has_ai_analysis boolean;
  filter_min_length numeric;
  filter_max_length numeric;
  filter_min_width numeric;
  filter_max_width numeric;
  filter_min_price_per_carat numeric;
  filter_max_price_per_carat numeric;
BEGIN
  offset_val := (page_number - 1) * page_size;

  IF search_query IS NOT NULL AND search_query != '' THEN
    search_nospace_pattern := '%' || replace(replace(replace(replace(search_query, ' ', ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  END IF;

  filter_types := ARRAY(SELECT jsonb_array_elements_text(filters->'gemstoneTypes'));
  filter_colors := ARRAY(SELECT jsonb_array_elements_text(filters->'colors'));
  filter_cuts := ARRAY(SELECT jsonb_array_elements_text(filters->'cuts'));
  filter_clarities := ARRAY(SELECT jsonb_array_elements_text(filters->'clarities'));
  filter_origins := ARRAY(SELECT jsonb_array_elements_text(filters->'origins'));
  filter_in_stock := (filters->>'inStockOnly')::boolean;
  filter_has_certification := (filters->>'hasCertification')::boolean;
  filter_has_images := (filters->>'hasImages')::boolean;
  filter_price_min := COALESCE((filters->>'minPrice')::numeric, (filters->'priceRange'->>'min')::numeric);
  filter_price_max := COALESCE((filters->>'maxPrice')::numeric, (filters->'priceRange'->>'max')::numeric);
  filter_weight_min := COALESCE((filters->>'minWeight')::numeric, (filters->'weightRange'->>'min')::numeric);
  filter_weight_max := COALESCE((filters->>'maxWeight')::numeric, (filters->'weightRange'->>'max')::numeric);
  use_fuzzy := COALESCE((filters->>'useFuzzy')::boolean, false);

  filter_treatment_status := ARRAY(SELECT jsonb_array_elements_text(filters->'treatmentStatus'));
  filter_mining_countries := ARRAY(SELECT jsonb_array_elements_text(filters->'miningCountries'));
  filter_quality_classifications := ARRAY(SELECT jsonb_array_elements_text(filters->'qualityClassifications'));
  filter_has_color_change := (filters->>'hasColorChange')::boolean;
  filter_has_ai_analysis := (filters->>'hasAIAnalysis')::boolean;
  filter_min_length := (filters->>'minLength')::numeric;
  filter_max_length := (filters->>'maxLength')::numeric;
  filter_min_width := (filters->>'minWidth')::numeric;
  filter_max_width := (filters->>'maxWidth')::numeric;
  filter_min_price_per_carat := (filters->>'minPricePerCarat')::numeric;
  filter_max_price_per_carat := (filters->>'maxPricePerCarat')::numeric;

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
      g.price_currency::text AS price_currency,
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
      g.created_at,
      g.updated_at,
      -- 1C: Rank boost for serial number ILIKE matches
      -- Serial number matches always sort first (rank=10), above FTS matches
      CASE
        WHEN search_query = '' OR search_query IS NULL THEN 0::real
        WHEN search_nospace_pattern IS NOT NULL
             AND REPLACE(g.serial_number, ' ', '') ILIKE search_nospace_pattern THEN 10.0::real
        WHEN use_fuzzy THEN
          GREATEST(
            similarity(g.serial_number, search_query),
            similarity(COALESCE(tt.name, g.name::text), search_query),
            similarity(COALESCE(ct.name, g.color::text), search_query)
          )::real
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
          )::real
      END AS rank
    FROM gemstones g
    LEFT JOIN gemstone_type_translations tt ON tt.type_code = g.type_code AND tt.locale = effective_locale
    LEFT JOIN gem_color_translations ct ON ct.color_code = g.color_code AND ct.locale = effective_locale
    LEFT JOIN cuts cu ON cu.id = g.cut_id
    LEFT JOIN gem_clarity_translations cl_t ON cl_t.clarity_code = g.clarity::text AND cl_t.locale = effective_locale
    LEFT JOIN origins o ON o.id = g.origin_id
    LEFT JOIN certifications cert ON cert.gemstone_id = g.id
    LEFT JOIN gemstones_ai_v6 ai ON ai.gemstone_id = g.id
    WHERE
      (
        search_query = '' OR search_query IS NULL
        OR (
          CASE WHEN use_fuzzy THEN
            similarity(g.serial_number, search_query) > 0.3
            OR similarity(COALESCE(tt.name, g.name::text), search_query) > 0.3
            OR similarity(COALESCE(ct.name, g.color::text), search_query) > 0.3
          ELSE
            -- 1D: Simplified from 4 nested CASE branches to 2
            CASE WHEN effective_locale = 'ru' THEN
              g.search_vector_ru @@ plainto_tsquery('russian', search_query)
              OR (description_enabled AND g.description_vector_ru @@ plainto_tsquery('russian', search_query))
            ELSE
              g.search_vector_en @@ plainto_tsquery('english', search_query)
              OR (description_enabled AND g.description_vector_en @@ plainto_tsquery('english', search_query))
            END
          END
        )
        OR (search_nospace_pattern IS NOT NULL AND REPLACE(g.serial_number, ' ', '') ILIKE search_nospace_pattern)
      )
      AND (cardinality(filter_types) = 0 OR g.name::text = ANY(filter_types))
      AND (cardinality(filter_colors) = 0 OR g.color::text = ANY(filter_colors))
      AND (cardinality(filter_cuts) = 0 OR g.cut_code = ANY(filter_cuts) OR cu.code = ANY(filter_cuts))
      AND (cardinality(filter_clarities) = 0 OR g.clarity::text = ANY(filter_clarities))
      AND (cardinality(filter_origins) = 0 OR g.origin_id::text = ANY(filter_origins))
      AND (filter_in_stock IS NULL OR filter_in_stock = false OR g.in_stock = true)
      AND (filter_has_certification IS NULL OR filter_has_certification = false OR cert.id IS NOT NULL)
      AND (filter_has_images IS NULL OR filter_has_images = false OR EXISTS (
        SELECT 1 FROM gemstone_images gi WHERE gi.gemstone_id = g.id
      ))
      AND (filter_price_min IS NULL OR g.price_amount >= filter_price_min)
      AND (filter_price_max IS NULL OR g.price_amount <= filter_price_max)
      AND (filter_weight_min IS NULL OR g.weight_carats >= filter_weight_min)
      AND (filter_weight_max IS NULL OR g.weight_carats <= filter_weight_max)
      AND (cardinality(filter_treatment_status) = 0 OR g.treatment_status = ANY(filter_treatment_status))
      AND (cardinality(filter_mining_countries) = 0 OR g.mining_country = ANY(filter_mining_countries))
      AND (cardinality(filter_quality_classifications) = 0 OR g.quality_classification = ANY(filter_quality_classifications))
      AND (filter_has_color_change IS NULL OR filter_has_color_change = false OR (g.color_change_description IS NOT NULL AND g.color_change_description != ''))
      AND (filter_has_ai_analysis IS NULL OR filter_has_ai_analysis = false OR ai.gemstone_id IS NOT NULL)
      AND (filter_min_length IS NULL OR g.length_mm >= filter_min_length)
      AND (filter_max_length IS NULL OR g.length_mm <= filter_max_length)
      AND (filter_min_width IS NULL OR g.width_mm >= filter_min_width)
      AND (filter_max_width IS NULL OR g.width_mm <= filter_max_width)
      AND (filter_min_price_per_carat IS NULL OR g.price_per_carat >= filter_min_price_per_carat)
      AND (filter_max_price_per_carat IS NULL OR g.price_per_carat <= filter_max_price_per_carat)
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

COMMENT ON FUNCTION search_gemstones_multilingual IS 'Full-text search with space-normalized serial number matching, rank boosting for serial matches, and simplified FTS WHERE clause.';


-- =============================================
-- 1E. Trigger: refresh search vectors on AI data changes
-- =============================================

CREATE OR REPLACE FUNCTION refresh_gemstone_search_on_ai_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Touch the parent gemstone row so the existing search vector trigger fires
  UPDATE gemstones SET updated_at = NOW() WHERE id = NEW.gemstone_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_refresh_search_on_ai_update ON gemstones_ai_v6;

CREATE TRIGGER trigger_refresh_search_on_ai_update
  AFTER INSERT OR UPDATE ON gemstones_ai_v6
  FOR EACH ROW
  EXECUTE FUNCTION refresh_gemstone_search_on_ai_update();

COMMENT ON FUNCTION refresh_gemstone_search_on_ai_update IS 'Propagates AI data changes to gemstone search vectors by touching the parent row.';
