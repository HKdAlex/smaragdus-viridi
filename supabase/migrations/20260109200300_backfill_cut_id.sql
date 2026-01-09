-- Backfill cut_id from existing cut enum values
-- Contract: CUT-C0.4

-- Update all gemstones to set cut_id based on cut enum value
UPDATE gemstones g
SET cut_id = c.id
FROM cuts c
WHERE g.cut::text = c.code
  AND g.cut_id IS NULL;
