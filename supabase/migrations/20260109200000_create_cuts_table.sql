-- Create cuts reference table for extensible cut types
-- This replaces the gem_cut enum for better extensibility
-- Contract: CUT-C0.1

CREATE TABLE IF NOT EXISTS cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_en TEXT,
  description_ru TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cuts_code ON cuts(code);
CREATE INDEX IF NOT EXISTS idx_cuts_active ON cuts(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cuts_display_order ON cuts(display_order);

-- Enable RLS
ALTER TABLE cuts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read access
CREATE POLICY "cuts_select_policy" ON cuts
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies: Admin write access (authenticated users with admin role)
CREATE POLICY "cuts_insert_policy" ON cuts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "cuts_update_policy" ON cuts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "cuts_delete_policy" ON cuts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_cuts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cuts_updated_at_trigger
  BEFORE UPDATE ON cuts
  FOR EACH ROW
  EXECUTE FUNCTION update_cuts_updated_at();

COMMENT ON TABLE cuts IS 'Reference table for gemstone cut types with inline translations';
COMMENT ON COLUMN cuts.code IS 'Unique identifier code (e.g., round, marquise)';
COMMENT ON COLUMN cuts.name_en IS 'English display name';
COMMENT ON COLUMN cuts.name_ru IS 'Russian display name';
COMMENT ON COLUMN cuts.display_order IS 'Order for UI display (lower = first)';
COMMENT ON COLUMN cuts.is_active IS 'Soft delete flag';
