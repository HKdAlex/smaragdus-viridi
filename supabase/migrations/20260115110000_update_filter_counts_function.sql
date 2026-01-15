-- Migration: Update get_catalog_filter_counts to include new filter fields
-- FILTER-C3.3: Update Filter Counts Function
-- 
-- Adds counts for:
-- - treatmentStatus
-- - miningCountries
-- - qualityClassifications

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
      SELECT json_object_agg(name, count)
      FROM (
        SELECT name, COUNT(*)::integer as count
        FROM gemstones_enriched
        WHERE price_amount > 0
          AND primary_image_url IS NOT NULL
          AND in_stock = true
          AND name IS NOT NULL
        GROUP BY name
      ) gemstone_types
    ),
    'colors', (
      SELECT json_object_agg(color, count)
      FROM (
        SELECT color, COUNT(*)::integer as count
        FROM gemstones_enriched
        WHERE price_amount > 0
          AND primary_image_url IS NOT NULL
          AND in_stock = true
          AND color IS NOT NULL
        GROUP BY color
      ) colors
    ),
    'cuts', (
      SELECT json_object_agg(cut, count)
      FROM (
        SELECT cut, COUNT(*)::integer as count
        FROM gemstones_enriched
        WHERE price_amount > 0
          AND primary_image_url IS NOT NULL
          AND in_stock = true
          AND cut IS NOT NULL
        GROUP BY cut
      ) cuts
    ),
    'clarities', (
      SELECT json_object_agg(clarity, count)
      FROM (
        SELECT clarity, COUNT(*)::integer as count
        FROM gemstones_enriched
        WHERE price_amount > 0
          AND primary_image_url IS NOT NULL
          AND in_stock = true
          AND clarity IS NOT NULL
        GROUP BY clarity
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
    -- NEW FILTER COUNTS (FILTER-C3.3)
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

COMMENT ON FUNCTION get_catalog_filter_counts IS 'Returns filter counts for catalog including gemstoneTypes, colors, cuts, clarities, origins, treatmentStatus, miningCountries, qualityClassifications (FILTER-C3.3)';
