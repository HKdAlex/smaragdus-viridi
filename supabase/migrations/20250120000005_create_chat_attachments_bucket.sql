-- Migration: Create chat-attachments storage bucket
-- Date: 2025-01-20
-- Purpose: Set up storage bucket for chat file attachments with RLS policies

-- Create the chat-attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true, -- Public bucket for easy access to attachments
  10485760, -- 10MB file size limit (matches DEFAULT_CHAT_CONFIG.maxFileSize)
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ] -- Allowed MIME types: images, PDF, DOC, DOCX
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow authenticated users to upload attachments
-- Path structure: {timestamp}_{random}_{filename} (no folder prefix)
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

-- RLS Policy: Allow authenticated users to read attachments
-- Since bucket is public, this is mainly for consistency
CREATE POLICY "Authenticated users can read chat attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

-- RLS Policy: Allow public read access (since bucket is public)
-- This allows users to view attachments in messages
CREATE POLICY "Public can read chat attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat-attachments');

-- RLS Policy: Allow admins to read all chat attachments
CREATE POLICY "Admins can read all chat attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- RLS Policy: Allow admins to delete chat attachments (for moderation)
CREATE POLICY "Admins can delete chat attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Note: The upload path structure is: chat-attachments/{userId}/{filename}
-- This is handled by the ChatService.uploadAttachments() method
-- The path structure allows RLS policies to filter by user_id

