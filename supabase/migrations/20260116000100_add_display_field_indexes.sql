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
