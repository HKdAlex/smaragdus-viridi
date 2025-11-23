-- Migration: Create gemstone_individual_stones table
-- Date: 2025-11-23
--
-- Purpose:
-- Create a table to store individual stone specifications for multi-stone gemstone items.
-- This allows each stone in a multi-stone item to have its own dimensions.
--
-- Initially includes only dimensions (length_mm, width_mm, depth_mm)
-- Future extensions can add color, cut, clarity, shape, etc.

BEGIN;

CREATE TABLE gemstone_individual_stones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,
  stone_number INTEGER NOT NULL, -- 1-based index for stones in this gemstone

  -- Dimensions for this specific stone
  length_mm DECIMAL(8,3) NOT NULL,
  width_mm DECIMAL(8,3) NOT NULL,
  depth_mm DECIMAL(8,3) NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT gemstone_individual_stones_stone_number_positive
    CHECK (stone_number > 0),
  CONSTRAINT gemstone_individual_stones_dimensions_positive
    CHECK (length_mm > 0 AND width_mm > 0 AND depth_mm > 0),
  CONSTRAINT gemstone_individual_stones_unique_gemstone_stone
    UNIQUE (gemstone_id, stone_number)
);

-- Indexes for performance
CREATE INDEX idx_gemstone_individual_stones_gemstone_id
  ON gemstone_individual_stones(gemstone_id);

CREATE INDEX idx_gemstone_individual_stones_stone_number
  ON gemstone_individual_stones(stone_number);

-- Row Level Security (RLS) policies
ALTER TABLE gemstone_individual_stones ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read individual stones
CREATE POLICY "Allow authenticated users to read individual stones"
  ON gemstone_individual_stones FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admin users to manage individual stones
CREATE POLICY "Allow admin users to manage individual stones"
  ON gemstone_individual_stones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gemstone_individual_stones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gemstone_individual_stones_updated_at
  BEFORE UPDATE ON gemstone_individual_stones
  FOR EACH ROW
  EXECUTE FUNCTION update_gemstone_individual_stones_updated_at();

-- Add comment for documentation
COMMENT ON TABLE gemstone_individual_stones IS
'Individual stone specifications for multi-stone gemstone items.
Each row represents one stone within a gemstone item, allowing
different dimensions and future attributes for each stone.';

COMMENT ON COLUMN gemstone_individual_stones.stone_number IS
'1-based index identifying which stone this is within the gemstone item';

COMMENT ON COLUMN gemstone_individual_stones.length_mm IS
'Length dimension of this specific stone in millimeters';
COMMENT ON COLUMN gemstone_individual_stones.width_mm IS
'Width dimension of this specific stone in millimeters';
COMMENT ON COLUMN gemstone_individual_stones.depth_mm IS
'Depth dimension of this specific stone in millimeters';

COMMIT;
