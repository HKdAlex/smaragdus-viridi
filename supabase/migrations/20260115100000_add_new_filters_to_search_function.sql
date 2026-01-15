-- Migration: Add new filter support to search_gemstones_multilingual function
-- FILTER-C3.2: Update Search API for New Filters
-- 
-- Adds support for:
-- - treatmentStatus (array filter)
-- - miningCountries (array filter)
-- - qualityClassifications (array filter)
-- - hasColorChange (boolean filter)
-- - minLength, maxLength (dimension filters)
-- - minWidth, maxWidth (dimension filters)
-- - minPricePerCarat, maxPricePerCarat (price per carat filters)
-- - hasAIAnalysis (boolean filter)

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
  -- Existing filters
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
  -- New filters (FILTER-C3.2)
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
  -- Calculate offset
  offset_val := (page_number - 1) * page_size;
  
  -- Extract existing filters from JSONB
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

  -- Extract new filters (FILTER-C3.2)
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
      -- Has certification filter (using certifications table)
      AND (filter_has_certification IS NULL OR filter_has_certification = false OR cert.id IS NOT NULL)
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
      -- NEW FILTERS (FILTER-C3.2)
      -- Treatment status filter
      AND (cardinality(filter_treatment_status) = 0 OR g.treatment_status = ANY(filter_treatment_status))
      -- Mining countries filter
      AND (cardinality(filter_mining_countries) = 0 OR g.mining_country = ANY(filter_mining_countries))
      -- Quality classifications filter
      AND (cardinality(filter_quality_classifications) = 0 OR g.quality_classification = ANY(filter_quality_classifications))
      -- Has color change filter
      AND (filter_has_color_change IS NULL OR filter_has_color_change = false OR (g.color_change_description IS NOT NULL AND g.color_change_description != ''))
      -- Has AI analysis filter
      AND (filter_has_ai_analysis IS NULL OR filter_has_ai_analysis = false OR ai.gemstone_id IS NOT NULL)
      -- Dimension filters
      AND (filter_min_length IS NULL OR g.length_mm >= filter_min_length)
      AND (filter_max_length IS NULL OR g.length_mm <= filter_max_length)
      AND (filter_min_width IS NULL OR g.width_mm >= filter_min_width)
      AND (filter_max_width IS NULL OR g.width_mm <= filter_max_width)
      -- Price per carat filters
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

-- Add comment documenting the new filters
COMMENT ON FUNCTION search_gemstones_multilingual IS 'Full-text search with multilingual support and comprehensive filtering. Supports: gemstoneTypes, colors, cuts, clarities, origins, inStockOnly, hasCertification, hasImages, priceRange, weightRange, treatmentStatus, miningCountries, qualityClassifications, hasColorChange, hasAIAnalysis, minLength, maxLength, minWidth, maxWidth, minPricePerCarat, maxPricePerCarat';
