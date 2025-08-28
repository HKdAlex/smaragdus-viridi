-- Batch Tracking and Audit System Migration
-- Creates tables for comprehensive import tracking and auditing
-- Run this migration to enable batch tracking and audit trails

-- =================================================
-- AUDIT SESSIONS TABLE
-- =================================================

CREATE TABLE IF NOT EXISTS audit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type TEXT NOT NULL DEFAULT 'import_audit',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  summary JSONB,
  audit_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit sessions
CREATE INDEX IF NOT EXISTS idx_audit_sessions_status ON audit_sessions(status);
CREATE INDEX IF NOT EXISTS idx_audit_sessions_started_at ON audit_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_sessions_session_type ON audit_sessions(session_type);

-- =================================================
-- AUDIT LOG TABLE
-- =================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES audit_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  performance_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_session_id ON audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_level ON audit_log(level);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_session_event ON audit_log(session_id, event_type);

-- =================================================
-- ENHANCED IMPORT_BATCHES TABLE
-- =================================================

-- Add new columns to existing import_batches table if they don't exist
DO $$
BEGIN
  -- Add batch_metadata column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'import_batches' AND column_name = 'batch_metadata') THEN
    ALTER TABLE import_batches ADD COLUMN batch_metadata JSONB DEFAULT '{}';
  END IF;

  -- Add total_cost_usd column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'import_batches' AND column_name = 'total_cost_usd') THEN
    ALTER TABLE import_batches ADD COLUMN total_cost_usd DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- Add processing_started_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'import_batches' AND column_name = 'processing_started_at') THEN
    ALTER TABLE import_batches ADD COLUMN processing_started_at TIMESTAMPTZ;
  END IF;

  -- Add processing_completed_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'import_batches' AND column_name = 'processing_completed_at') THEN
    ALTER TABLE import_batches ADD COLUMN processing_completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- =================================================
-- ENHANCED GEMSTONES TABLE
-- =================================================

-- Add new columns to gemstones table for better metadata tracking
DO $$
BEGIN
  -- Add import_folder_path column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'gemstones' AND column_name = 'import_folder_path') THEN
    ALTER TABLE gemstones ADD COLUMN import_folder_path TEXT;
  END IF;

  -- Add import_notes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'gemstones' AND column_name = 'import_notes') THEN
    ALTER TABLE gemstones ADD COLUMN import_notes TEXT;
  END IF;

  -- Add ai_data_completeness column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'gemstones' AND column_name = 'ai_data_completeness') THEN
    ALTER TABLE gemstones ADD COLUMN ai_data_completeness DECIMAL(5,2) DEFAULT 0;
  END IF;
END $$;

-- =================================================
-- ENHANCED GEMSTONE_IMAGES TABLE
-- =================================================

-- Add new columns to gemstone_images table for better tracking
DO $$
BEGIN
  -- Add original_path column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'gemstone_images' AND column_name = 'original_path') THEN
    ALTER TABLE gemstone_images ADD COLUMN original_path TEXT;
  END IF;

  -- Add image_type column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'gemstone_images' AND column_name = 'image_type') THEN
    ALTER TABLE gemstone_images ADD COLUMN image_type TEXT DEFAULT 'processed';
  END IF;
END $$;

-- =================================================
-- ENHANCED GEMSTONE_VIDEOS TABLE
-- =================================================

-- Add new columns to gemstone_videos table for better tracking
DO $$
BEGIN
  -- Add original_path column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'gemstone_videos' AND column_name = 'original_path') THEN
    ALTER TABLE gemstone_videos ADD COLUMN original_path TEXT;
  END IF;
END $$;

-- =================================================
-- PERFORMANCE INDEXES
-- =================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gemstones_import_batch_id ON gemstones(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_gemstones_import_folder_path ON gemstones(import_folder_path);
CREATE INDEX IF NOT EXISTS idx_gemstone_images_original_filename ON gemstone_images(original_filename);
CREATE INDEX IF NOT EXISTS idx_gemstone_images_original_path ON gemstone_images(original_path);
CREATE INDEX IF NOT EXISTS idx_gemstone_videos_original_filename ON gemstone_videos(original_filename);
CREATE INDEX IF NOT EXISTS idx_gemstone_videos_original_path ON gemstone_videos(original_path);

-- =================================================
-- UTILITY FUNCTIONS
-- =================================================

-- Function to get batch statistics
CREATE OR REPLACE FUNCTION get_batch_statistics(batch_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'batch', (SELECT row_to_json(ib) FROM import_batches ib WHERE id = batch_uuid),
    'gemstones', (SELECT json_agg(row_to_json(g))
                 FROM gemstones g WHERE import_batch_id = batch_uuid),
    'images', (SELECT json_agg(row_to_json(gi))
              FROM gemstone_images gi
              WHERE gemstone_id IN (SELECT id FROM gemstones WHERE import_batch_id = batch_uuid)),
    'videos', (SELECT json_agg(row_to_json(gv))
              FROM gemstone_videos gv
              WHERE gemstone_id IN (SELECT id FROM gemstones WHERE import_batch_id = batch_uuid)),
    'summary', json_build_object(
      'total_gemstones', (SELECT COUNT(*) FROM gemstones WHERE import_batch_id = batch_uuid),
      'total_images', (SELECT COUNT(*) FROM gemstone_images
                      WHERE gemstone_id IN (SELECT id FROM gemstones WHERE import_batch_id = batch_uuid)),
      'total_videos', (SELECT COUNT(*) FROM gemstone_videos
                      WHERE gemstone_id IN (SELECT id FROM gemstones WHERE import_batch_id = batch_uuid))
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old audit data
CREATE OR REPLACE FUNCTION cleanup_audit_data(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := NOW() - INTERVAL '1 day' * days_old;

  -- Delete old audit log entries
  DELETE FROM audit_log WHERE created_at < cutoff_date;

  -- Delete old audit sessions (but keep active ones)
  DELETE FROM audit_sessions
  WHERE started_at < cutoff_date
    AND status != 'active';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get import statistics
CREATE OR REPLACE FUNCTION get_import_statistics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_batches', (SELECT COUNT(*) FROM import_batches),
    'total_gemstones', (SELECT COUNT(*) FROM gemstones),
    'total_images', (SELECT COUNT(*) FROM gemstone_images),
    'total_videos', (SELECT COUNT(*) FROM gemstone_videos),
    'recent_batches', (SELECT json_agg(row_to_json(ib))
                      FROM (SELECT * FROM import_batches
                            ORDER BY created_at DESC LIMIT 10) ib),
    'audit_sessions', (SELECT COUNT(*) FROM audit_sessions),
    'audit_entries', (SELECT COUNT(*) FROM audit_log)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =================================================
-- DATA INTEGRITY CONSTRAINTS
-- =================================================

-- Ensure import_batch_id references exist
ALTER TABLE gemstones
ADD CONSTRAINT fk_gemstones_import_batch_id
FOREIGN KEY (import_batch_id) REFERENCES import_batches(id) ON DELETE SET NULL;

-- Ensure audit session references exist
ALTER TABLE audit_log
ADD CONSTRAINT fk_audit_log_session_id
FOREIGN KEY (session_id) REFERENCES audit_sessions(id) ON DELETE CASCADE;

-- =================================================
-- MIGRATION COMPLETE
-- =================================================

-- Insert migration record
INSERT INTO import_batches (
  batch_name,
  source_path,
  total_folders,
  status,
  batch_metadata
) VALUES (
  'Database Migration - Batch Tracking & Audit System',
  'scripts/batch-audit-migration.sql',
  0,
  'completed',
  json_build_object(
    'migration_type', 'batch_audit_system',
    'version', '1.0.0',
    'tables_created', json_build_array('audit_sessions', 'audit_log'),
    'tables_modified', json_build_array('import_batches', 'gemstones', 'gemstone_images', 'gemstone_videos'),
    'functions_created', json_build_array('get_batch_statistics', 'cleanup_audit_data', 'get_import_statistics'),
    'migration_date', NOW()
  )
) ON CONFLICT DO NOTHING;

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '🎉 BATCH TRACKING & AUDIT SYSTEM MIGRATION COMPLETE';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ Created audit_sessions table';
  RAISE NOTICE '✅ Created audit_log table';
  RAISE NOTICE '✅ Enhanced import_batches table';
  RAISE NOTICE '✅ Enhanced gemstones table';
  RAISE NOTICE '✅ Enhanced gemstone_images table';
  RAISE NOTICE '✅ Enhanced gemstone_videos table';
  RAISE NOTICE '✅ Created utility functions';
  RAISE NOTICE '✅ Added performance indexes';
  RAISE NOTICE '✅ Added data integrity constraints';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Your import system now has:';
  RAISE NOTICE '   • Complete batch tracking';
  RAISE NOTICE '   • Comprehensive audit trails';
  RAISE NOTICE '   • Enhanced metadata storage';
  RAISE NOTICE '   • Performance monitoring';
  RAISE NOTICE '   • Compliance reporting';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready for advanced import operations!';
  RAISE NOTICE '=================================================';
END $$;
