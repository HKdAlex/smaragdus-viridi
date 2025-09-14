-- Migration: Add metadata_status field to gemstones table
-- Date: 2025-01-26
-- Purpose: Track the status of gemstone metadata after import

-- Create new enum type for metadata status
CREATE TYPE metadata_status_type AS ENUM (
  'needs_review',
  'updated',
  'needs_updating',
  'verified',
  'rejected'
);

-- Add new column to gemstones table
ALTER TABLE gemstones
ADD COLUMN metadata_status metadata_status_type DEFAULT 'needs_updating';

-- Optional: Add an index for faster queries if this field will be frequently filtered
CREATE INDEX IF NOT EXISTS idx_gemstones_metadata_status ON gemstones (metadata_status);