-- Add cut_id column to gemstones table
-- Contract: CUT-C0.3

-- Add nullable cut_id column with foreign key to cuts table
ALTER TABLE gemstones
  ADD COLUMN IF NOT EXISTS cut_id UUID REFERENCES cuts(id);

-- Add index for performance on the foreign key
CREATE INDEX IF NOT EXISTS idx_gemstones_cut_id ON gemstones(cut_id);

COMMENT ON COLUMN gemstones.cut_id IS 'Foreign key to cuts table (replaces cut enum)';
