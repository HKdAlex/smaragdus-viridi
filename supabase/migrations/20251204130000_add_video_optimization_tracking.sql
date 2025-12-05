-- Add columns to track video optimization status and metrics
-- This allows the UI to show real-time optimization progress and results

ALTER TABLE gemstone_videos
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS original_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS optimized_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS optimization_percentage NUMERIC(5, 2);

-- Add index for efficient querying of processing status
CREATE INDEX IF NOT EXISTS idx_gemstone_videos_processing_status 
ON gemstone_videos(processing_status) 
WHERE processing_status IN ('pending', 'processing');

-- Add comment for documentation
COMMENT ON COLUMN gemstone_videos.processing_status IS 'Status of video optimization: pending, processing, completed, or failed';
COMMENT ON COLUMN gemstone_videos.original_size_bytes IS 'Original file size in bytes before optimization';
COMMENT ON COLUMN gemstone_videos.optimized_size_bytes IS 'File size in bytes after optimization';
COMMENT ON COLUMN gemstone_videos.optimization_percentage IS 'Percentage reduction in file size (0-100)';

