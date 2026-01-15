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
