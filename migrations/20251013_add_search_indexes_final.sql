-- Migration: Add Full-Text Search Indexes (Final - Fixed for Enums)
-- Date: 2025-10-13
-- Phase: 2 - Database & Full-Text Search
-- Purpose: Create GIN indexes and pg_trgm extension for advanced search

-- Enable pg_trgm extension for trigram similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for full-text search on gemstones
-- Only using text columns (serial_number, description) 
-- Enum columns (name, color, cut, clarity) handled via exact match filters
CREATE INDEX IF NOT EXISTS idx_gemstones_fulltext_search ON gemstones 
USING GIN (
  to_tsvector('english', 
    COALESCE(serial_number, '') || ' ' ||
    COALESCE(description, '')
  )
);

-- Create GIN index for trigram similarity (fuzzy search) on text columns
CREATE INDEX IF NOT EXISTS idx_gemstones_serial_trgm ON gemstones 
USING GIN (serial_number gin_trgm_ops);

-- Note: Cannot create trigram indexes on enum columns directly
-- Enum values are handled via exact match WHERE clauses in queries

-- Create composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_gemstones_name_color ON gemstones (name, color)
WHERE name IS NOT NULL AND color IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gemstones_price_weight ON gemstones (price_amount, weight_carats)
WHERE price_amount > 0 AND weight_carats > 0;

-- Add index for has_images filter (joining gemstone_images)
CREATE INDEX IF NOT EXISTS idx_gemstone_images_gemstone_id ON gemstone_images (gemstone_id)
WHERE gemstone_id IS NOT NULL;

-- Comments for documentation
COMMENT ON INDEX idx_gemstones_fulltext_search IS 
  'Full-text search index using GIN for fast text matching on serial_number and description fields';

COMMENT ON INDEX idx_gemstones_serial_trgm IS 
  'Trigram index for fuzzy matching on serial numbers (typo tolerance)';

COMMENT ON INDEX idx_gemstones_name_color IS 
  'Composite index for common gemstone type + color filter combinations';

-- Analyze tables to update statistics for query planner
ANALYZE gemstones;
ANALYZE gemstone_images;

