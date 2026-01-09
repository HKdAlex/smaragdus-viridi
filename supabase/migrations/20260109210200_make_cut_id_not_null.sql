-- Make cut_id NOT NULL and drop gem_cut_translations table
-- Contract: CUT-C2.3

-- Verify all gemstones have cut_id before making NOT NULL
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM gemstones WHERE cut_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot make cut_id NOT NULL: % gemstones have NULL cut_id', null_count;
  END IF;
END $$;

-- Make cut_id NOT NULL
ALTER TABLE gemstones ALTER COLUMN cut_id SET NOT NULL;

-- Drop gem_cut_translations table (no longer needed, using cuts table)
DROP TABLE IF EXISTS gem_cut_translations CASCADE;

-- Note: We keep the cut column and gem_cut enum for now
-- They will be removed in Phase 3 (CUT-C3.1) after application code cleanup

COMMENT ON COLUMN gemstones.cut_id IS 'Foreign key to cuts table (NOT NULL, CUT-C2.3)';
COMMENT ON COLUMN gemstones.cut IS 'DEPRECATED: Use cut_id instead. Will be removed in Phase 3.';
