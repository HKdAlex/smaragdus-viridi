-- Migration: AI Analysis v5 pipeline tables
-- Date: 2025-10-15
-- Description: Adds non-destructive tables and columns used by the v5 structured-output pipeline.

-- Per-image extraction storage (intermediate claims)
CREATE TABLE IF NOT EXISTS gem_image_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,
  image_id UUID NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('instrument', 'label', 'gem_macro', 'unknown')),
  claims JSONB NOT NULL DEFAULT '[]',
  raw_response JSONB,
  model_version TEXT,
  processing_cost_usd NUMERIC(10, 6),
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gemstone_id, image_id)
);

CREATE INDEX IF NOT EXISTS idx_gem_image_extractions_gemstone ON gem_image_extractions(gemstone_id);
CREATE INDEX IF NOT EXISTS idx_gem_image_extractions_type ON gem_image_extractions(image_type);

COMMENT ON TABLE gem_image_extractions IS 'V5: Per-image typed extractions with claims-based data';

-- Fused gemstone analysis results (final consolidated record)
CREATE TABLE IF NOT EXISTS gemstones_ai_v5 (
  gemstone_id UUID PRIMARY KEY REFERENCES gemstones(id) ON DELETE CASCADE,
  images TEXT[] NOT NULL,
  final JSONB NOT NULL,
  confidence JSONB NOT NULL,
  provenance JSONB NOT NULL,
  conflicts TEXT[] NOT NULL DEFAULT '{}',
  needs_review BOOLEAN NOT NULL DEFAULT false,
  analysis_version TEXT NOT NULL DEFAULT 'v5',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gemstones_ai_v5_needs_review ON gemstones_ai_v5(needs_review) WHERE needs_review = true;

COMMENT ON TABLE gemstones_ai_v5 IS 'V5: Fused gemstone analysis with confidence tracking';

-- Tracking flags on gemstones without disrupting existing AI fields
ALTER TABLE gemstones
  ADD COLUMN IF NOT EXISTS ai_analysis_v5 BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_analysis_v5_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_gemstones_ai_v5_analyzed ON gemstones(ai_analysis_v5) WHERE ai_analysis_v5 = true;


