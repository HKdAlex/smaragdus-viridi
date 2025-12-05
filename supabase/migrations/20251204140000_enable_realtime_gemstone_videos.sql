-- Enable Realtime for gemstone_videos table
-- This allows the UI to receive real-time updates when optimization status changes

-- Add table to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE gemstone_videos;

