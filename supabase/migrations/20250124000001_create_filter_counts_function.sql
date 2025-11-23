-- Migration: Create Filter Counts and Category Counts RPC Functions
-- Date: 2025-01-24
-- Purpose: Optimize counts by using database GROUP BY instead of fetching all rows
-- This avoids Supabase max_rows limit and improves performance

BEGIN;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_catalog_filter_counts();
DROP FUNCTION IF EXISTS get_catalog_category_counts();

-- Create optimized filter counts function
-- Uses SECURITY DEFINER to bypass RLS for catalog counts
-- Uses STABLE to allow query optimization
-- Filters match catalog logic: price > 0, has images, in_stock = true
CREATE OR REPLACE FUNCTION get_catalog_filter_counts()
RETURNS JSON
LANGUAGE plpgsql
STABLE
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
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Create optimized category counts function
-- Uses same filtering logic as catalog: price > 0, has images, in_stock = true
CREATE OR REPLACE FUNCTION get_catalog_category_counts()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'categories', (
      SELECT json_agg(
        json_build_object(
          'name', name,
          'count', count
        ) ORDER BY count DESC
      )
      FROM (
        SELECT name, COUNT(*)::integer as count
        FROM gemstones_enriched
        WHERE price_amount > 0
          AND primary_image_url IS NOT NULL
          AND in_stock = true
          AND name IS NOT NULL
        GROUP BY name
      ) category_counts
    ),
    'totalCount', (
      SELECT COUNT(*)::integer
      FROM gemstones_enriched
      WHERE price_amount > 0
        AND primary_image_url IS NOT NULL
        AND in_stock = true
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users (RLS will handle access control)
GRANT EXECUTE ON FUNCTION get_catalog_filter_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_catalog_filter_counts() TO anon;
GRANT EXECUTE ON FUNCTION get_catalog_category_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_catalog_category_counts() TO anon;

COMMIT;

