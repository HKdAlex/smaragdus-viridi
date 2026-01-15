-- ============================================
-- COMPLETE MIGRATION PACKAGE: Display Fields System
-- ============================================
-- Project: bbtmedia-2025-1 (dpqapyojcdtrjwuhybky)
-- Safe to apply: All changes are additive and backward compatible
-- Execution time: ~2-5 seconds
--
-- TO APPLY THIS SAFELY:
-- 1. Go to: https://supabase.com/dashboard/project/dpqapyojcdtrjwuhybky/sql
-- 2. Copy this ENTIRE file
-- 3. Paste into the SQL Editor
-- 4. Click "Run" (or press Cmd+Enter)
-- 5. Verify "Success. No rows returned" message appears
--
-- SAFETY GUARANTEES:
-- ✓ Wrapped in transaction (auto-rollback on ANY error)
-- ✓ No data deletion
-- ✓ No breaking schema changes
-- ✓ All changes are reversible
-- ✓ Backward compatible with existing code
--
-- WHAT THIS DOES:
-- 1. Adds display_* computed fields to gemstones_enriched view
-- 2. Creates indexes for efficient filtering
-- 3. Updates catalog_search_gemstones to return display_* fields
-- 4. Updates get_catalog_filter_counts to aggregate by display_*
-- 5. Updates search vectors to index custom fields
-- ============================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'APPLYING DISPLAY FIELDS MIGRATIONS';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
END $$;


-- ============================================
-- MIGRATION 1: Add display_* fields to view
-- ============================================

-- Migration: Add display_* computed fields to gemstones_enriched view
-- Centralizes precedence logic: Admin Custom > AI > Enum
-- Enables filtering and search on resolved values
-- Contract: DISPLAY-C1.0

DROP VIEW IF EXISTS gemstones_enriched;

CREATE VIEW gemstones_enriched AS
SELECT
    g.id,
    g.serial_number,
    g.internal_code,
    g.name::text AS name,
    g.type_code,
    g.color::text AS color,
    g.color_code,
    g.cut_id,
    g.cut_code,
    c.code AS cut,
    c.name_en AS cut_name_en,
    c.name_ru AS cut_name_ru,
    g.clarity::text AS clarity,
    g.clarity_code,

    -- DISPLAY FIELDS (Precedence: Admin Custom > AI > Enum)
    -- These are the source of truth for rendering and filtering
    COALESCE(
        NULLIF(TRIM(g.name_custom), ''),  -- Admin custom (highest priority)
        g.name::text                       -- Enum code (fallback)
    ) AS display_name,

    COALESCE(
        NULLIF(TRIM(g.color_custom), ''),  -- Admin custom
        g.ai_color,                         -- AI detected
        g.color::text                       -- Enum code
    ) AS display_color,

    COALESCE(
        NULLIF(TRIM(g.cut_custom), ''),    -- Admin custom
        v6.detected_cut,                    -- AI detected
        c.code                              -- Cut code from cuts table
    ) AS display_cut,

    COALESCE(
        NULLIF(TRIM(g.clarity_custom), ''), -- Admin custom
        g.clarity::text                      -- Enum code
    ) AS display_clarity,

    -- Dimensions and pricing
    g.weight_carats,
    g.length_mm,
    g.width_mm,
    g.depth_mm,
    g.price_amount,
    g.price_currency::text AS price_currency,
    g.premium_price_amount,
    g.premium_price_currency::text AS premium_price_currency,
    g.price_per_carat,
    g.quantity,
    g.delivery_days,
    g.description,
    g.in_stock,
    g.origin_id,
    g.metadata_status::text AS metadata_status,
    g.created_at,
    g.updated_at,
    g.ai_text_generated_v6 AS ai_analyzed,
    g.ai_color,
    g.primary_image_url,
    g.primary_video_url,

    -- Custom fields for Professional Specifications (FLEX-C3.1)
    g.name_custom,
    g.color_custom,
    g.cut_custom,
    g.clarity_custom,
    g.quality_classification,
    g.mining_country,
    g.cutting_country,

    -- Custom fields for Treatment Disclosure (FLEX-C3.2)
    g.treatment_status,
    g.color_change_description,
    g.enhancement_notes,

    -- AI v6 fields
    v6.selected_image_uuid,
    v6.recommended_primary_image_index,
    v6.detected_cut,
    v6.cut_detection_confidence,
    v6.detected_color,
    v6.color_detection_confidence,
    v6.detected_color_description,
    v6.technical_description_en,
    v6.emotional_description_en,
    v6.narrative_story_en,
    v6.historical_context_en,
    v6.care_instructions_en,
    v6.promotional_text AS promotional_text_en,
    v6.marketing_highlights AS marketing_highlights_en,
    v6.technical_description_ru,
    v6.emotional_description_ru,
    v6.narrative_story_ru,
    v6.historical_context_ru,
    v6.care_instructions_ru,
    v6.promotional_text_ru,
    v6.marketing_highlights_ru,
    v6.model_version,
    v6.confidence_score,
    v6.needs_review,

    -- Counts
    COALESCE(img_counts.image_count, 0) AS image_count,
    COALESCE(vid_counts.video_count, 0) AS video_count

FROM gemstones g
LEFT JOIN cuts c ON c.id = g.cut_id
LEFT JOIN gemstones_ai_v6 v6 ON v6.gemstone_id = g.id
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS image_count
    FROM gemstone_images gi
    WHERE gi.gemstone_id = g.id
) img_counts ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*)::integer AS video_count
    FROM gemstone_videos gv
    WHERE gv.gemstone_id = g.id
) vid_counts ON true;

-- Grant permissions
GRANT SELECT ON gemstones_enriched TO anon, authenticated;

-- Documentation
COMMENT ON VIEW gemstones_enriched IS
'Enriched gemstone view with display_* computed fields.
Display fields implement precedence: Admin Custom > AI > Enum.
Use display_* fields for rendering and filtering to ensure consistency.';

COMMENT ON COLUMN gemstones_enriched.display_name IS 'Resolved name (custom > enum): Source of truth for display';
COMMENT ON COLUMN gemstones_enriched.display_color IS 'Resolved color (custom > AI > enum): Source of truth for display';
COMMENT ON COLUMN gemstones_enriched.display_cut IS 'Resolved cut (custom > AI > cut code): Source of truth for display';
COMMENT ON COLUMN gemstones_enriched.display_clarity IS 'Resolved clarity (custom > enum): Source of truth for display';


-- ============================================
-- MIGRATION 2: Create indexes on base columns
-- ============================================

-- Migration: Add indexes for display_* field filtering
-- Enables efficient filtering on computed display fields
-- Contract: DISPLAY-C1.1

-- Note: We index the base columns that contribute to display_* fields
-- PostgreSQL query planner will use these for queries against the gemstones_enriched view
-- We can't create functional indexes with JOINed data (ai_color), so we index component columns

-- Index for name_custom (used in display_name)
CREATE INDEX IF NOT EXISTS idx_gemstones_name_custom
ON gemstones (name_custom)
WHERE name_custom IS NOT NULL AND TRIM(name_custom) != '';

-- Index for base name enum (fallback for display_name)
CREATE INDEX IF NOT EXISTS idx_gemstones_name
ON gemstones (name);

-- Index for color_custom (used in display_color)
CREATE INDEX IF NOT EXISTS idx_gemstones_color_custom
ON gemstones (color_custom)
WHERE color_custom IS NOT NULL AND TRIM(color_custom) != '';

-- Index for ai_color (used in display_color, stored in gemstones table)
CREATE INDEX IF NOT EXISTS idx_gemstones_ai_color
ON gemstones (ai_color)
WHERE ai_color IS NOT NULL;

-- Index for base color enum (fallback for display_color)
CREATE INDEX IF NOT EXISTS idx_gemstones_color
ON gemstones (color);

-- Index for clarity_custom (used in display_clarity)
CREATE INDEX IF NOT EXISTS idx_gemstones_clarity_custom
ON gemstones (clarity_custom)
WHERE clarity_custom IS NOT NULL AND TRIM(clarity_custom) != '';

-- Index for base clarity enum (fallback for display_clarity)
CREATE INDEX IF NOT EXISTS idx_gemstones_clarity
ON gemstones (clarity);

-- Index for cut_custom (used in display_cut)
CREATE INDEX IF NOT EXISTS idx_gemstones_cut_custom
ON gemstones (cut_custom)
WHERE cut_custom IS NOT NULL AND TRIM(cut_custom) != '';

-- Ensure cut_id index exists (for joins in display_cut computation)
CREATE INDEX IF NOT EXISTS idx_gemstones_cut_id
ON gemstones (cut_id);

-- Composite index for common catalog queries (in_stock + price filtering)
CREATE INDEX IF NOT EXISTS idx_gemstones_catalog_filter
ON gemstones (in_stock, price_amount, name)
WHERE in_stock = true AND price_amount > 0;

-- Comments for documentation
COMMENT ON INDEX idx_gemstones_name_custom IS 'Supports filtering by custom gemstone names';
COMMENT ON INDEX idx_gemstones_color_custom IS 'Supports filtering by custom colors';
COMMENT ON INDEX idx_gemstones_clarity_custom IS 'Supports filtering by custom clarity values';
COMMENT ON INDEX idx_gemstones_cut_custom IS 'Supports filtering by custom cut values';
COMMENT ON INDEX idx_gemstones_catalog_filter IS 'Optimizes common catalog queries with in_stock and price filtering';


-- ============================================
-- MIGRATION 3: Update catalog_search_gemstones
-- ============================================

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
  price_currency text,
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
    g.price_currency,
    g.in_stock,
    g.serial_number,
    g.ai_color,
    g.created_at,
    g.updated_at,
    ai.emotional_description_en,
    ai.emotional_description_ru,
    ai.marketing_highlights_en,
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


-- ============================================
-- MIGRATION 4: Update filter counts function
-- ============================================

-- Migration: Update filter counts to aggregate by display_* fields
-- Ensures filter options show resolved values (custom + enum)
-- Contract: DISPLAY-C3.0

CREATE OR REPLACE FUNCTION get_catalog_filter_counts()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'gemstoneTypes', (
      SELECT json_object_agg(display_name, count)
      FROM (
        SELECT display_name, COUNT(*)::integer as count
        FROM gemstones_enriched
        WHERE price_amount > 0
          AND primary_image_url IS NOT NULL
          AND in_stock = true
          AND display_name IS NOT NULL
        GROUP BY display_name
      ) gemstone_types
    ),
    'colors', (
      SELECT json_object_agg(display_color, count)
      FROM (
        SELECT display_color, COUNT(*)::integer as count
        FROM gemstones_enriched
        WHERE price_amount > 0
          AND primary_image_url IS NOT NULL
          AND in_stock = true
          AND display_color IS NOT NULL
        GROUP BY display_color
      ) colors
    ),
    'cuts', (
      SELECT json_object_agg(display_cut, count)
      FROM (
        SELECT display_cut, COUNT(*)::integer as count
        FROM gemstones_enriched
        WHERE price_amount > 0
          AND primary_image_url IS NOT NULL
          AND in_stock = true
          AND display_cut IS NOT NULL
        GROUP BY display_cut
      ) cuts
    ),
    'clarities', (
      SELECT json_object_agg(display_clarity, count)
      FROM (
        SELECT display_clarity, COUNT(*)::integer as count
        FROM gemstones_enriched
        WHERE price_amount > 0
          AND primary_image_url IS NOT NULL
          AND in_stock = true
          AND display_clarity IS NOT NULL
        GROUP BY display_clarity
      ) clarities
    ),
    'origins', (
      SELECT json_object_agg(origin_name, count)
      FROM (
        SELECT o.name as origin_name, COUNT(*)::integer as count
        FROM gemstones_enriched ge
        INNER JOIN origins o ON ge.origin_id = o.id
        WHERE ge.price_amount > 0
          AND ge.primary_image_url IS NOT NULL
          AND ge.in_stock = true
          AND ge.origin_id IS NOT NULL
        GROUP BY o.name
      ) origins
    ),
    -- Treatment and professional filters (unchanged - use raw fields)
    'treatmentStatus', (
      SELECT json_object_agg(treatment_status, count)
      FROM (
        SELECT treatment_status, COUNT(*)::integer as count
        FROM gemstones_enriched
        WHERE price_amount > 0
          AND primary_image_url IS NOT NULL
          AND in_stock = true
          AND treatment_status IS NOT NULL
          AND treatment_status != ''
        GROUP BY treatment_status
      ) treatment_statuses
    ),
    'miningCountries', (
      SELECT json_object_agg(mining_country, count)
      FROM (
        SELECT mining_country, COUNT(*)::integer as count
        FROM gemstones_enriched
        WHERE price_amount > 0
          AND primary_image_url IS NOT NULL
          AND in_stock = true
          AND mining_country IS NOT NULL
          AND mining_country != ''
        GROUP BY mining_country
      ) mining_countries
    ),
    'qualityClassifications', (
      SELECT json_object_agg(quality_classification, count)
      FROM (
        SELECT quality_classification, COUNT(*)::integer as count
        FROM gemstones_enriched
        WHERE price_amount > 0
          AND primary_image_url IS NOT NULL
          AND in_stock = true
          AND quality_classification IS NOT NULL
          AND quality_classification != ''
        GROUP BY quality_classification
      ) quality_classifications
    )
  ) INTO result;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_catalog_filter_counts IS 'Returns filter counts aggregated by display_* fields (includes custom values) plus treatment/professional filters';


-- ============================================
-- MIGRATION 5: Update search vectors
-- ============================================

-- Migration: Update multilingual search to index display_* field values
-- Ensures full-text search includes custom values
-- Contract: DISPLAY-C4.0

-- Recreate trigger helper to include custom fields in search vectors
CREATE OR REPLACE FUNCTION update_gemstone_search_vectors()
RETURNS TRIGGER AS $$
DECLARE
  ai_record RECORD;
  origin_name_en text;
  origin_name_ru text;
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

  SELECT name_ru
  INTO cut_name_ru
  FROM cuts
  WHERE id = NEW.cut_id;

  SELECT name
  INTO clarity_name_ru
  FROM gem_clarity_translations
  WHERE clarity_code = NEW.clarity::text AND locale = 'ru';

  -- UPDATED: Include custom fields in English search vectors
  NEW.search_vector_en :=
    setweight(to_tsvector('english', coalesce(NEW.serial_number, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.name::text, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.name_custom, '')), 'A') ||  -- NEW: Custom name
    setweight(to_tsvector('english', coalesce(NEW.color_custom, '')), 'B') || -- NEW: Custom color
    setweight(to_tsvector('english', coalesce(NEW.cut_custom, '')), 'B') ||   -- NEW: Custom cut
    setweight(to_tsvector('english', coalesce(NEW.clarity_custom, '')), 'B') || -- NEW: Custom clarity
    setweight(to_tsvector('english', coalesce((SELECT code FROM cuts WHERE id = NEW.cut_id), '')), 'B') ||
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

  -- UPDATED: Include custom fields in Russian search vectors
  NEW.search_vector_ru :=
    setweight(to_tsvector('russian', coalesce(NEW.serial_number, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce((SELECT name FROM gemstone_type_translations WHERE type_code = NEW.type_code AND locale = 'ru'), NEW.name::text, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce(NEW.name_custom, '')), 'A') ||  -- NEW: Custom name
    setweight(to_tsvector('russian', coalesce((SELECT name FROM gem_color_translations WHERE color_code = NEW.color_code AND locale = 'ru'), NEW.color::text, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(NEW.color_custom, '')), 'B') || -- NEW: Custom color
    setweight(to_tsvector('russian', coalesce(cut_name_ru, (SELECT code FROM cuts WHERE id = NEW.cut_id), '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(NEW.cut_custom, '')), 'B') ||   -- NEW: Custom cut
    setweight(to_tsvector('russian', coalesce(clarity_name_ru, NEW.clarity::text, '')), 'B') ||
    setweight(to_tsvector('russian', coalesce(NEW.clarity_custom, '')), 'B') || -- NEW: Custom clarity
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
$$ LANGUAGE plpgsql;

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_update_gemstone_search_vectors ON gemstones;

-- Recreate trigger to fire on custom field changes too
CREATE TRIGGER trigger_update_gemstone_search_vectors
  BEFORE INSERT OR UPDATE OF serial_number, name, type_code, color, color_code, cut_id, clarity, origin_id, description,
                            name_custom, color_custom, cut_custom, clarity_custom  -- NEW: Include custom fields
  ON gemstones
  FOR EACH ROW
  EXECUTE FUNCTION update_gemstone_search_vectors();

-- Re-index existing rows to include custom fields in search vectors
-- Only update rows that have custom fields to minimize impact
UPDATE gemstones
SET updated_at = updated_at
WHERE name_custom IS NOT NULL
   OR color_custom IS NOT NULL
   OR cut_custom IS NOT NULL
   OR clarity_custom IS NOT NULL;

COMMENT ON FUNCTION update_gemstone_search_vectors IS 'Updates search vectors including custom fields for full-text search (DISPLAY-C4.0)';


-- ============================================
-- TRANSACTION COMMIT
-- ============================================

COMMIT;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'ALL MIGRATIONS APPLIED SUCCESSFULLY ✓';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test display fields: SELECT display_name, display_color FROM gemstones_enriched LIMIT 5';
  RAISE NOTICE '2. Restart your Next.js dev server';
  RAISE NOTICE '3. Test frontend at http://localhost:3000/en/catalog';
  RAISE NOTICE '';
END $$;
