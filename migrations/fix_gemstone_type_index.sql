-- Fix incorrect gemstone_type index
-- The database has 'name' column, not 'gemstone_type' column

-- Drop the incorrect index if it exists
DROP INDEX IF EXISTS idx_gemstones_type_color;

-- Create the correct index on name column
CREATE INDEX IF NOT EXISTS idx_gemstones_name_color ON gemstones (name, color)
WHERE name IS NOT NULL AND color IS NOT NULL;

-- Add comment for documentation
COMMENT ON INDEX idx_gemstones_name_color IS 
  'Composite index for filtering by gemstone name and color';
