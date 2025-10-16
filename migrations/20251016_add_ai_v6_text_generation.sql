-- Migration: AI Text Generation v6
-- Date: 2025-10-16
-- Description: Adds table and tracking columns for AI-generated textual content (descriptions, stories, etc.)

-- Text generation results table
CREATE TABLE IF NOT EXISTS gemstones_ai_v6 (
  gemstone_id UUID PRIMARY KEY REFERENCES gemstones(id) ON DELETE CASCADE,
  
  -- Generated text content
  technical_description_en TEXT,
  technical_description_ru TEXT,
  emotional_description_en TEXT,
  emotional_description_ru TEXT,
  narrative_story_en TEXT,
  narrative_story_ru TEXT,
  historical_context_en TEXT,
  historical_context_ru TEXT,
  care_instructions_en TEXT,
  care_instructions_ru TEXT,
  marketing_highlights TEXT[],
  promotional_text TEXT,
  
  -- Metadata
  model_version TEXT NOT NULL,
  used_images BOOLEAN NOT NULL DEFAULT false,
  image_urls TEXT[],
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  generation_cost_usd NUMERIC(10, 6),
  generation_time_ms INTEGER,
  
  -- Quality flags
  needs_review BOOLEAN NOT NULL DEFAULT false,
  review_notes TEXT,
  
  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gemstones_ai_v6_needs_review ON gemstones_ai_v6(needs_review) WHERE needs_review = true;

COMMENT ON TABLE gemstones_ai_v6 IS 'V6: AI-generated textual content for gemstones (descriptions, stories, marketing)';

-- Tracking flags on gemstones table
ALTER TABLE gemstones
  ADD COLUMN IF NOT EXISTS ai_text_generated_v6 BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_text_generated_v6_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_gemstones_ai_v6_generated ON gemstones(ai_text_generated_v6) WHERE ai_text_generated_v6 = true;


