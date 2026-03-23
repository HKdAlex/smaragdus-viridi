-- Migration: Fix search for alphanumeric codes without spaces
-- Problem: Searching "V17" doesn't match serial_number "V 17" (and vice versa)
-- Fix: Add space-normalized comparison for serial_number in both search functions

-- =============================================
-- 1. Update catalog_search_gemstones
-- =============================================

CREATE OR REPLACE FUNCTION catalog_search_gemstones(
  search_query text DEFAULT NULL,
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 24,
  filter_types text[] DEFAULT NULL,
  filter_colors text[] DEFAULT NULL,
  filter_cuts text[] DEFAULT NULL,
  filter_clarities text[] DEFAULT NULL,
  filter_origins text[] DEFAULT NULL,
  filter_price_min integer DEFAULT NULL,
  filter_price_max integer DEFAULT NULL,
  filter_weight_min numeric DEFAULT NULL,
  filter_weight_max numeric DEFAULT NULL,
  filter_in_stock_only boolean DEFAULT NULL,
  filter_has_images boolean DEFAULT NULL,
  filter_has_certification boolean DEFAULT NULL,
  filter_treatment_status text[] DEFAULT NULL,
  filter_mining_countries text[] DEFAULT NULL,
  filter_quality_classifications text[] DEFAULT NULL,
  filter_has_color_change boolean DEFAULT NULL,
  filter_min_length numeric DEFAULT NULL,
  filter_max_length numeric DEFAULT NULL,
  filter_min_width numeric DEFAULT NULL,
  filter_max_width numeric DEFAULT NULL,
  filter_min_price_per_carat numeric DEFAULT NULL,
  filter_max_price_per_carat numeric DEFAULT NULL,
  sort_by text DEFAULT 'created_at',
  sort_direction text DEFAULT 'desc'
)
RETURNS TABLE (
  id uuid,
  name text,
  color text,
  cut text,
  display_name text,
  display_color text,
  display_cut text,
  display_clarity text,
  weight_carats numeric,
  clarity text,
  price_amount integer,
  price_currency currency_code,
  in_stock boolean,
  serial_number text,
  ai_color text,
  created_at timestamptz,
  updated_at timestamptz,
  emotional_description_en text,
  emotional_description_ru text,
  marketing_highlights_en text[],
  marketing_highlights_ru text[],
  recommended_primary_image_index integer,
  selected_image_uuid uuid,
  detected_cut text,
  primary_image_url text,
  primary_video_url text,
  origin_id uuid,
  origin_name text,
  origin_country text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val integer;
  search_pattern text;
  search_nospace_pattern text;
BEGIN
  offset_val := (page_number - 1) * page_size;

  IF search_query IS NOT NULL AND search_query != '' THEN
    search_pattern := '%' || replace(replace(replace(search_query, '\', '\\'), '%', '\%'), '_', '\_') || '%';
    search_nospace_pattern := '%' || replace(replace(replace(replace(search_query, ' ', ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  END IF;

  RETURN QUERY
  SELECT
    g.id,
    g.name::text,
    g.color::text,
    COALESCE(cu.code, g.cut_code)::text as cut,
    COALESCE(NULLIF(TRIM(g.name_custom), ''), g.name::text) as display_name,
    COALESCE(NULLIF(TRIM(g.color_custom), ''), g.ai_color, g.color::text) as display_color,
    COALESCE(NULLIF(TRIM(g.cut_custom), ''), ai.detected_cut, cu.code) as display_cut,
    COALESCE(NULLIF(TRIM(g.clarity_custom), ''), g.clarity::text) as display_clarity,
    g.weight_carats,
    g.clarity::text,
    g.price_amount,
    g.price_currency::currency_code,
    g.in_stock,
    g.serial_number,
    g.ai_color,
    g.created_at,
    g.updated_at,
    ai.emotional_description_en,
    ai.emotional_description_ru,
    ai.marketing_highlights as marketing_highlights_en,
    ai.marketing_highlights_ru,
    ai.recommended_primary_image_index,
    ai.selected_image_uuid,
    ai.detected_cut,
    gi.image_url as primary_image_url,
    NULL::text as primary_video_url,
    o.id as origin_id,
    o.name as origin_name,
    o.country as origin_country,
    COUNT(*) OVER() as total_count
  FROM gemstones g
  LEFT JOIN cuts cu ON cu.id = g.cut_id
  LEFT JOIN origins o ON o.id = g.origin_id
  LEFT JOIN gemstones_ai_v6 ai ON ai.gemstone_id = g.id
  LEFT JOIN LATERAL (
    SELECT image_url
    FROM gemstone_images
    WHERE gemstone_id = g.id
    ORDER BY image_order ASC
    LIMIT 1
  ) gi ON true
  WHERE
    g.price_amount > 0
    AND gi.image_url IS NOT NULL

    AND (
      search_pattern IS NULL
      OR g.serial_number ILIKE search_pattern
      OR REPLACE(g.serial_number, ' ', '') ILIKE search_nospace_pattern
      OR COALESCE(NULLIF(TRIM(g.name_custom), ''), g.name::text) ILIKE search_pattern
      OR COALESCE(NULLIF(TRIM(g.color_custom), ''), g.ai_color, g.color::text) ILIKE search_pattern
      OR COALESCE(NULLIF(TRIM(g.cut_custom), ''), ai.detected_cut, cu.code) ILIKE search_pattern
    )

    AND (filter_types IS NULL OR cardinality(filter_types) = 0 OR
         COALESCE(NULLIF(TRIM(g.name_custom), ''), g.name::text) = ANY(filter_types))

    AND (filter_colors IS NULL OR cardinality(filter_colors) = 0 OR
         COALESCE(NULLIF(TRIM(g.color_custom), ''), g.ai_color, g.color::text) = ANY(filter_colors))

    AND (filter_cuts IS NULL OR cardinality(filter_cuts) = 0 OR
         COALESCE(NULLIF(TRIM(g.cut_custom), ''), ai.detected_cut, cu.code) = ANY(filter_cuts))

    AND (filter_clarities IS NULL OR cardinality(filter_clarities) = 0 OR
         COALESCE(NULLIF(TRIM(g.clarity_custom), ''), g.clarity::text) = ANY(filter_clarities))

    AND (filter_origins IS NULL OR cardinality(filter_origins) = 0 OR o.name = ANY(filter_origins))

    AND (filter_price_min IS NULL OR g.price_amount >= filter_price_min)
    AND (filter_price_max IS NULL OR g.price_amount <= filter_price_max)

    AND (filter_weight_min IS NULL OR g.weight_carats >= filter_weight_min)
    AND (filter_weight_max IS NULL OR g.weight_carats <= filter_weight_max)

    AND (filter_in_stock_only IS NULL OR NOT filter_in_stock_only OR g.in_stock = true)

    AND (filter_treatment_status IS NULL OR cardinality(filter_treatment_status) = 0 OR g.treatment_status = ANY(filter_treatment_status))

    AND (filter_mining_countries IS NULL OR cardinality(filter_mining_countries) = 0 OR g.mining_country = ANY(filter_mining_countries))

    AND (filter_quality_classifications IS NULL OR cardinality(filter_quality_classifications) = 0 OR g.quality_classification = ANY(filter_quality_classifications))

    AND (filter_has_color_change IS NULL OR NOT filter_has_color_change OR (g.color_change_description IS NOT NULL AND g.color_change_description != ''))

    AND (filter_min_length IS NULL OR g.length_mm >= filter_min_length)
    AND (filter_max_length IS NULL OR g.length_mm <= filter_max_length)
    AND (filter_min_width IS NULL OR g.width_mm >= filter_min_width)
    AND (filter_max_width IS NULL OR g.width_mm <= filter_max_width)

    AND (filter_min_price_per_carat IS NULL OR (g.price_amount::numeric / NULLIF(g.weight_carats, 0)) >= filter_min_price_per_carat)
    AND (filter_max_price_per_carat IS NULL OR (g.price_amount::numeric / NULLIF(g.weight_carats, 0)) <= filter_max_price_per_carat)

  ORDER BY
    CASE WHEN sort_direction = 'asc' THEN
      CASE sort_by
        WHEN 'price_amount' THEN g.price_amount::text
        WHEN 'weight_carats' THEN g.weight_carats::text
        WHEN 'name' THEN COALESCE(NULLIF(TRIM(g.name_custom), ''), g.name::text)
        WHEN 'color' THEN COALESCE(NULLIF(TRIM(g.color_custom), ''), g.ai_color, g.color::text)
        WHEN 'cut' THEN COALESCE(NULLIF(TRIM(g.cut_custom), ''), ai.detected_cut, cu.code)
        ELSE g.created_at::text
      END
    END ASC,
    CASE WHEN sort_direction = 'desc' THEN
      CASE sort_by
        WHEN 'price_amount' THEN g.price_amount::text
        WHEN 'weight_carats' THEN g.weight_carats::text
        WHEN 'name' THEN COALESCE(NULLIF(TRIM(g.name_custom), ''), g.name::text)
        WHEN 'color' THEN COALESCE(NULLIF(TRIM(g.color_custom), ''), g.ai_color, g.color::text)
        WHEN 'cut' THEN COALESCE(NULLIF(TRIM(g.cut_custom), ''), ai.detected_cut, cu.code)
        ELSE g.created_at::text
      END
    END DESC
  LIMIT page_size
  OFFSET offset_val;
END;
$$;

COMMENT ON FUNCTION catalog_search_gemstones IS 'Catalog search with space-normalized serial number matching (V17 matches V 17). Display fields with Admin Custom > AI > Enum precedence.';


-- =============================================
-- 2. Update search_gemstones_multilingual
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
      CASE
        WHEN search_query = '' OR search_query IS NULL THEN 0::real
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

COMMENT ON FUNCTION search_gemstones_multilingual IS 'Full-text search with space-normalized serial number matching and multilingual support. V17 matches V 17 and vice versa.';
