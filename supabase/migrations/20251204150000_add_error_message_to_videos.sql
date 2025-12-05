-- Add error_message column to gemstone_videos table
-- This allows storing detailed error messages when video optimization fails

ALTER TABLE gemstone_videos
ADD COLUMN IF NOT EXISTS error_message TEXT;

COMMENT ON COLUMN gemstone_videos.error_message IS 'Detailed error message when video optimization fails';

