-- Migration: Enable Realtime for chat_messages table
-- Date: 2025-01-20
-- Purpose: Enable real-time subscriptions for chat messages

-- Add chat_messages table to realtime publication
-- This allows clients to subscribe to INSERT, UPDATE, and DELETE events
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

