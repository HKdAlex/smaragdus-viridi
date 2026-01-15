-- Migration: Update catalog_search_gemstones to return and filter on display_* fields
-- Ensures API returns resolved values with proper precedence
-- Contract: DISPLAY-C2.0

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
  -- NEW: Display fields (resolved values with precedence)
  display_name text,
  display_color text,
  display_cut text,
  display_clarity text,
  weight_carats numeric,
  clarity text,
  price_amount integer,
  price_currency currency_code,  -- FIX: Use currency_code enum type
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
BEGIN
  offset_val := (page_number - 1) * page_size;

  -- Build search pattern if search query provided
  IF search_query IS NOT NULL AND search_query != '' THEN
    -- Escape special characters for ilike
    search_pattern := '%' || replace(replace(replace(search_query, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  END IF;

  RETURN QUERY
  SELECT
    g.id,
    g.name::text,
    g.color::text,
    COALESCE(cu.code, g.cut_code)::text as cut,
    -- NEW: Display fields with precedence resolution
    COALESCE(NULLIF(TRIM(g.name_custom), ''), g.name::text) as display_name,
    COALESCE(NULLIF(TRIM(g.color_custom), ''), g.ai_color, g.color::text) as display_color,
    COALESCE(NULLIF(TRIM(g.cut_custom), ''), ai.detected_cut, cu.code) as display_cut,
    COALESCE(NULLIF(TRIM(g.clarity_custom), ''), g.clarity::text) as display_clarity,
    g.weight_carats,
    g.clarity::text,
    g.price_amount,
    g.price_currency::currency_code,  -- Cast to currency_code enum type
    g.in_stock,
    g.serial_number,
    g.ai_color,
    g.created_at,
    g.updated_at,
    ai.emotional_description_en,
    ai.emotional_description_ru,
    ai.marketing_highlights as marketing_highlights_en,  -- FIX: Column is named 'marketing_highlights', not '_en'
    ai.marketing_highlights_ru,
    ai.recommended_primary_image_index,
    ai.selected_image_uuid,
    ai.detected_cut,
    gi.image_url as primary_image_url,
    NULL::text as primary_video_url, -- Not in view yet
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
    -- Always filter out items with price <= 0 and no images
    g.price_amount > 0
    AND gi.image_url IS NOT NULL

    -- UPDATED: Search across display fields (includes custom values)
    AND (
      search_pattern IS NULL
      OR g.serial_number ILIKE search_pattern
      OR COALESCE(NULLIF(TRIM(g.name_custom), ''), g.name::text) ILIKE search_pattern
      OR COALESCE(NULLIF(TRIM(g.color_custom), ''), g.ai_color, g.color::text) ILIKE search_pattern
      OR COALESCE(NULLIF(TRIM(g.cut_custom), ''), ai.detected_cut, cu.code) ILIKE search_pattern
    )

    -- UPDATED: Filters operate on display fields (custom + enum values)
    AND (filter_types IS NULL OR cardinality(filter_types) = 0 OR
         COALESCE(NULLIF(TRIM(g.name_custom), ''), g.name::text) = ANY(filter_types))

    AND (filter_colors IS NULL OR cardinality(filter_colors) = 0 OR
         COALESCE(NULLIF(TRIM(g.color_custom), ''), g.ai_color, g.color::text) = ANY(filter_colors))

    AND (filter_cuts IS NULL OR cardinality(filter_cuts) = 0 OR
         COALESCE(NULLIF(TRIM(g.cut_custom), ''), ai.detected_cut, cu.code) = ANY(filter_cuts))

    AND (filter_clarities IS NULL OR cardinality(filter_clarities) = 0 OR
         COALESCE(NULLIF(TRIM(g.clarity_custom), ''), g.clarity::text) = ANY(filter_clarities))

    -- Origin filter
    AND (filter_origins IS NULL OR cardinality(filter_origins) = 0 OR o.name = ANY(filter_origins))

    -- Price range filter
    AND (filter_price_min IS NULL OR g.price_amount >= filter_price_min)
    AND (filter_price_max IS NULL OR g.price_amount <= filter_price_max)

    -- Weight range filter
    AND (filter_weight_min IS NULL OR g.weight_carats >= filter_weight_min)
    AND (filter_weight_max IS NULL OR g.weight_carats <= filter_weight_max)

    -- In stock filter
    AND (filter_in_stock_only IS NULL OR NOT filter_in_stock_only OR g.in_stock = true)

    -- Treatment status filter
    AND (filter_treatment_status IS NULL OR cardinality(filter_treatment_status) = 0 OR g.treatment_status = ANY(filter_treatment_status))

    -- Mining country filter
    AND (filter_mining_countries IS NULL OR cardinality(filter_mining_countries) = 0 OR g.mining_country = ANY(filter_mining_countries))

    -- Quality classification filter
    AND (filter_quality_classifications IS NULL OR cardinality(filter_quality_classifications) = 0 OR g.quality_classification = ANY(filter_quality_classifications))

    -- Color change filter
    AND (filter_has_color_change IS NULL OR NOT filter_has_color_change OR (g.color_change_description IS NOT NULL AND g.color_change_description != ''))

    -- Dimension filters
    AND (filter_min_length IS NULL OR g.length_mm >= filter_min_length)
    AND (filter_max_length IS NULL OR g.length_mm <= filter_max_length)
    AND (filter_min_width IS NULL OR g.width_mm >= filter_min_width)
    AND (filter_max_width IS NULL OR g.width_mm <= filter_max_width)

    -- Price per carat filter
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

COMMENT ON FUNCTION catalog_search_gemstones IS 'Catalog search with display_* fields (Admin Custom > AI > Enum precedence). Filters and searches on resolved values.';
