-- Migration: Add indexes for new filter fields
-- FILTER-C3.4: Add Database Indexes for New Filters
-- 
-- Adds indexes for:
-- - treatment_status
-- - mining_country
-- - quality_classification
-- - length_mm
-- - width_mm
-- - price_per_carat
-- - color_change_description (partial index for non-null values)

-- Treatment status index
CREATE INDEX IF NOT EXISTS idx_gemstones_treatment_status 
ON gemstones (treatment_status) 
WHERE treatment_status IS NOT NULL AND treatment_status != '';

-- Mining country index
CREATE INDEX IF NOT EXISTS idx_gemstones_mining_country 
ON gemstones (mining_country) 
WHERE mining_country IS NOT NULL AND mining_country != '';

-- Quality classification index
CREATE INDEX IF NOT EXISTS idx_gemstones_quality_classification 
ON gemstones (quality_classification) 
WHERE quality_classification IS NOT NULL AND quality_classification != '';

-- Dimension indexes for range queries
CREATE INDEX IF NOT EXISTS idx_gemstones_length_mm 
ON gemstones (length_mm) 
WHERE length_mm IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gemstones_width_mm 
ON gemstones (width_mm) 
WHERE width_mm IS NOT NULL;

-- Price per carat index for range queries
CREATE INDEX IF NOT EXISTS idx_gemstones_price_per_carat 
ON gemstones (price_per_carat) 
WHERE price_per_carat IS NOT NULL AND price_per_carat > 0;

-- Color change description partial index (for hasColorChange filter)
CREATE INDEX IF NOT EXISTS idx_gemstones_color_change 
ON gemstones (id) 
WHERE color_change_description IS NOT NULL AND color_change_description != '';

-- Composite index for common filter combinations (professional filters)
CREATE INDEX IF NOT EXISTS idx_gemstones_professional_filters 
ON gemstones (treatment_status, mining_country, quality_classification) 
WHERE in_stock = true AND price_amount > 0;

COMMENT ON INDEX idx_gemstones_treatment_status IS 'Index for treatment_status filter (FILTER-C3.4)';
COMMENT ON INDEX idx_gemstones_mining_country IS 'Index for mining_country filter (FILTER-C3.4)';
COMMENT ON INDEX idx_gemstones_quality_classification IS 'Index for quality_classification filter (FILTER-C3.4)';
COMMENT ON INDEX idx_gemstones_length_mm IS 'Index for length dimension filter (FILTER-C3.4)';
COMMENT ON INDEX idx_gemstones_width_mm IS 'Index for width dimension filter (FILTER-C3.4)';
COMMENT ON INDEX idx_gemstones_price_per_carat IS 'Index for price per carat filter (FILTER-C3.4)';
COMMENT ON INDEX idx_gemstones_color_change IS 'Index for color change filter (FILTER-C3.4)';
COMMENT ON INDEX idx_gemstones_professional_filters IS 'Composite index for professional filters (FILTER-C3.4)';
