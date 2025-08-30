-- Catalog Performance Optimization Script
-- This script creates indexes and optimizes queries for the gemstone catalog

-- Enable Row Level Security on all tables
ALTER TABLE gemstones ENABLE ROW LEVEL SECURITY;
ALTER TABLE origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE gemstone_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_results ENABLE ROW LEVEL SECURITY;

-- Create optimized indexes for catalog queries

-- Primary search and filtering indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemstones_catalog_search
ON gemstones USING gin (
  to_tsvector('english',
    coalesce(serial_number, '') || ' ' ||
    coalesce(internal_code, '') || ' ' ||
    coalesce(name, '') || ' ' ||
    coalesce(color, '') || ' ' ||
    coalesce(cut, '')
  )
);

-- Multi-column indexes for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemstones_filters_basic
ON gemstones (name, color, cut, clarity, in_stock);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemstones_price_weight
ON gemstones (price_amount, weight_carats);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemstones_created_at_desc
ON gemstones (created_at DESC);

-- Foreign key indexes for joins
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemstones_origin_id
ON gemstones (origin_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemstone_images_gemstone_id
ON gemstone_images (gemstone_id, is_primary DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certifications_gemstone_id
ON certifications (gemstone_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_analysis_gemstone_id
ON ai_analysis_results (gemstone_id, confidence_score DESC);

-- Partial indexes for active data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemstones_active
ON gemstones (created_at DESC)
WHERE in_stock = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemstone_images_primary
ON gemstone_images (gemstone_id, image_order)
WHERE is_primary = true;

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gemstones_search_filters
ON gemstones (name, color, cut, price_amount, weight_carats, in_stock);

-- Origin indexes for filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_origins_name_country
ON origins (name, country);

-- Row Level Security Policies
-- Public read access for catalog browsing
CREATE POLICY "Gemstones are viewable by everyone" ON gemstones
FOR SELECT USING (true);

CREATE POLICY "Origins are viewable by everyone" ON origins
FOR SELECT USING (true);

CREATE POLICY "Images are viewable by everyone" ON gemstone_images
FOR SELECT USING (true);

CREATE POLICY "Certifications are viewable by everyone" ON certifications
FOR SELECT USING (true);

CREATE POLICY "AI analysis is viewable by everyone" ON ai_analysis_results
FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Only admins can modify gemstones" ON gemstones
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Function to get catalog statistics
CREATE OR REPLACE FUNCTION get_catalog_stats()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_gemstones', (SELECT count(*) FROM gemstones),
    'active_gemstones', (SELECT count(*) FROM gemstones WHERE in_stock = true),
    'gemstone_types', (
      SELECT json_object_agg(name, count)
      FROM (SELECT name, count(*) as count FROM gemstones GROUP BY name) t
    ),
    'colors', (
      SELECT json_object_agg(color, count)
      FROM (SELECT color, count(*) as count FROM gemstones GROUP BY color) t
    ),
    'cuts', (
      SELECT json_object_agg(cut, count)
      FROM (SELECT cut, count(*) as count FROM gemstones GROUP BY cut) t
    ),
    'clarities', (
      SELECT json_object_agg(clarity, count)
      FROM (SELECT clarity, count(*) as count FROM gemstones GROUP BY clarity) t
    ),
    'origins', (
      SELECT json_object_agg(name, count)
      FROM (SELECT o.name, count(*) as count FROM gemstones g JOIN origins o ON g.origin_id = o.id GROUP BY o.name) t
    ),
    'price_range', (
      SELECT json_build_object(
        'min', min(price_amount),
        'max', max(price_amount),
        'avg', avg(price_amount)
      ) FROM gemstones
    ),
    'weight_range', (
      SELECT json_build_object(
        'min', min(weight_carats),
        'max', max(weight_carats),
        'avg', avg(weight_carats)
      ) FROM gemstones
    ),
    'with_images', (SELECT count(*) FROM gemstones WHERE EXISTS (SELECT 1 FROM gemstone_images WHERE gemstone_images.gemstone_id = gemstones.id)),
    'with_certifications', (SELECT count(*) FROM gemstones WHERE EXISTS (SELECT 1 FROM certifications WHERE certifications.gemstone_id = gemstones.id)),
    'with_ai_analysis', (SELECT count(*) FROM gemstones WHERE EXISTS (SELECT 1 FROM ai_analysis_results WHERE ai_analysis_results.gemstone_id = gemstones.id AND confidence_score >= 0.5))
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for optimized catalog search
CREATE OR REPLACE FUNCTION search_gemstones_optimized(
  search_term text DEFAULT NULL,
  gemstone_types text[] DEFAULT NULL,
  colors text[] DEFAULT NULL,
  cuts text[] DEFAULT NULL,
  clarities text[] DEFAULT NULL,
  origins text[] DEFAULT NULL,
  min_price integer DEFAULT NULL,
  max_price integer DEFAULT NULL,
  min_weight numeric DEFAULT NULL,
  max_weight numeric DEFAULT NULL,
  in_stock_only boolean DEFAULT false,
  has_images boolean DEFAULT false,
  has_certifications boolean DEFAULT false,
  has_ai_analysis boolean DEFAULT false,
  sort_by text DEFAULT 'created_at',
  sort_direction text DEFAULT 'desc',
  page_limit integer DEFAULT 24,
  page_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  color text,
  cut text,
  weight_carats numeric,
  clarity text,
  price_amount integer,
  price_currency text,
  premium_price_amount integer,
  premium_price_currency text,
  in_stock boolean,
  delivery_days integer,
  internal_code text,
  serial_number text,
  created_at timestamptz,
  updated_at timestamptz,
  origin_name text,
  origin_country text,
  primary_image_url text,
  certifications_count integer,
  ai_analysis_count integer,
  total_count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_gemstones AS (
    SELECT
      g.id,
      g.name,
      g.color,
      g.cut,
      g.weight_carats,
      g.clarity,
      g.price_amount,
      g.price_currency,
      g.premium_price_amount,
      g.premium_price_currency,
      g.in_stock,
      g.delivery_days,
      g.internal_code,
      g.serial_number,
      g.created_at,
      g.updated_at,
      o.name as origin_name,
      o.country as origin_country,
      gi.image_url as primary_image_url,
      COALESCE(cert_count.count, 0) as certifications_count,
      COALESCE(ai_count.count, 0) as ai_analysis_count,
      COUNT(*) OVER() as total_count
    FROM gemstones g
    LEFT JOIN origins o ON g.origin_id = o.id
    LEFT JOIN gemstone_images gi ON g.id = gi.gemstone_id AND gi.is_primary = true
    LEFT JOIN (
      SELECT gemstone_id, count(*) as count
      FROM certifications
      GROUP BY gemstone_id
    ) cert_count ON g.id = cert_count.gemstone_id
    LEFT JOIN (
      SELECT gemstone_id, count(*) as count
      FROM ai_analysis_results
      WHERE confidence_score >= 0.5
      GROUP BY gemstone_id
    ) ai_count ON g.id = ai_count.gemstone_id
    WHERE
      (search_term IS NULL OR
       g.serial_number ILIKE '%' || search_term || '%' OR
       g.internal_code ILIKE '%' || search_term || '%' OR
       g.name ILIKE '%' || search_term || '%' OR
       g.color ILIKE '%' || search_term || '%' OR
       g.cut ILIKE '%' || search_term || '%')
      AND (gemstone_types IS NULL OR g.name = ANY(gemstone_types))
      AND (colors IS NULL OR g.color = ANY(colors))
      AND (cuts IS NULL OR g.cut = ANY(cuts))
      AND (clarities IS NULL OR g.clarity = ANY(clarities))
      AND (origins IS NULL OR o.name = ANY(origins))
      AND (min_price IS NULL OR g.price_amount >= min_price)
      AND (max_price IS NULL OR g.price_amount <= max_price)
      AND (min_weight IS NULL OR g.weight_carats >= min_weight)
      AND (max_weight IS NULL OR g.weight_carats <= max_weight)
      AND (NOT in_stock_only OR g.in_stock = true)
      AND (NOT has_images OR gi.image_url IS NOT NULL)
      AND (NOT has_certifications OR cert_count.count > 0)
      AND (NOT has_ai_analysis OR ai_count.count > 0)
  )
  SELECT * FROM filtered_gemstones
  ORDER BY
    CASE WHEN sort_by = 'created_at' AND sort_direction = 'desc' THEN created_at END DESC,
    CASE WHEN sort_by = 'created_at' AND sort_direction = 'asc' THEN created_at END ASC,
    CASE WHEN sort_by = 'price_amount' AND sort_direction = 'desc' THEN price_amount END DESC,
    CASE WHEN sort_by = 'price_amount' AND sort_direction = 'asc' THEN price_amount END ASC,
    CASE WHEN sort_by = 'weight_carats' AND sort_direction = 'desc' THEN weight_carats END DESC,
    CASE WHEN sort_by = 'weight_carats' AND sort_direction = 'asc' THEN weight_carats END ASC,
    CASE WHEN sort_by = 'name' AND sort_direction = 'desc' THEN name END DESC,
    CASE WHEN sort_by = 'name' AND sort_direction = 'asc' THEN name END ASC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_catalog_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION search_gemstones_optimized(text[], text[], text[], text[], text[], integer, integer, numeric, numeric, boolean, boolean, boolean, boolean, text, text, integer, integer) TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION get_catalog_stats() IS 'Returns comprehensive catalog statistics for filter options';
COMMENT ON FUNCTION search_gemstones_optimized(text, text[], text[], text[], text[], text[], integer, integer, numeric, numeric, boolean, boolean, boolean, boolean, text, text, integer, integer) IS 'Optimized function for catalog search with all filters applied server-side';

-- Performance monitoring view
CREATE OR REPLACE VIEW catalog_performance_metrics AS
SELECT
  'total_gemstones' as metric,
  count(*)::text as value
FROM gemstones
UNION ALL
SELECT
  'active_gemstones' as metric,
  count(*)::text as value
FROM gemstones
WHERE in_stock = true
UNION ALL
SELECT
  'gemstones_with_images' as metric,
  count(DISTINCT g.id)::text as value
FROM gemstones g
JOIN gemstone_images gi ON g.id = gi.gemstone_id
UNION ALL
SELECT
  'gemstones_with_certifications' as metric,
  count(DISTINCT g.id)::text as value
FROM gemstones g
JOIN certifications c ON g.id = c.gemstone_id
UNION ALL
SELECT
  'gemstones_with_ai_analysis' as metric,
  count(DISTINCT g.id)::text as value
FROM gemstones g
JOIN ai_analysis_results a ON g.id = a.gemstone_id
WHERE a.confidence_score >= 0.5;

-- Grant permissions on the view
GRANT SELECT ON catalog_performance_metrics TO authenticated;
