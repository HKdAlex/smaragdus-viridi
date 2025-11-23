-- Migration: Create Chat Sessions Function
-- Date: 2025-01-20
-- Purpose: Optimize conversation fetching with proper SQL function (SSOT for conversation queries)

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_active_chat_sessions();

-- Create optimized function to get active chat sessions for admin dashboard
-- Returns conversation summaries with unread counts and user information
CREATE OR REPLACE FUNCTION get_active_chat_sessions()
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count BIGINT,
  has_attachments BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    SELECT DISTINCT ON (cm.user_id)
      cm.user_id,
      cm.content AS last_message_content,
      cm.created_at AS last_message_created_at,
      cm.attachments IS NOT NULL AND array_length(cm.attachments, 1) > 0 AS has_attachments
    FROM chat_messages cm
    ORDER BY cm.user_id, cm.created_at DESC
  ),
  unread_counts AS (
    SELECT
      cm.user_id,
      COUNT(*)::BIGINT AS unread_count
    FROM chat_messages cm
    WHERE cm.is_read = FALSE 
      AND cm.sender_type = 'user'
    GROUP BY cm.user_id
  )
  SELECT
    lm.user_id,
    COALESCE(up.name, 'Unknown User')::TEXT AS user_name,
    lm.last_message_content::TEXT AS last_message,
    lm.last_message_created_at AS last_message_at,
    COALESCE(uc.unread_count, 0)::BIGINT AS unread_count,
    COALESCE(lm.has_attachments, false)::BOOLEAN AS has_attachments
  FROM latest_messages lm
  LEFT JOIN user_profiles up ON lm.user_id = up.user_id
  LEFT JOIN unread_counts uc ON lm.user_id = uc.user_id
  ORDER BY lm.last_message_created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users (RLS will handle admin check)
GRANT EXECUTE ON FUNCTION get_active_chat_sessions() TO authenticated;

-- Create index for better performance on chat_messages queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_sender_created 
  ON chat_messages(user_id, sender_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_unread 
  ON chat_messages(user_id, is_read) 
  WHERE is_read = FALSE AND sender_type = 'user';

