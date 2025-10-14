-- Create search analytics table for tracking search behavior
-- Used to identify popular searches, zero-result queries, and optimization opportunities

CREATE TABLE IF NOT EXISTS search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query text NOT NULL,
  filters jsonb,
  results_count integer NOT NULL,
  used_fuzzy_search boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(search_query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_session ON search_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_zero_results ON search_analytics(results_count) WHERE results_count = 0;

-- Enable Row Level Security
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own analytics
CREATE POLICY "Users can view their own analytics"
  ON search_analytics FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policy: Anyone can insert analytics (anonymous tracking allowed)
CREATE POLICY "Anyone can insert analytics"
  ON search_analytics FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Only admins can view all analytics
CREATE POLICY "Admins can view all analytics"
  ON search_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admin function: Get aggregated search analytics summary
CREATE OR REPLACE FUNCTION get_search_analytics_summary(
  days_back integer DEFAULT 30
)
RETURNS TABLE (
  search_query text,
  search_count bigint,
  avg_results integer,
  zero_result_count bigint,
  fuzzy_usage_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    sa.search_query,
    COUNT(*) as search_count,
    ROUND(AVG(sa.results_count))::integer as avg_results,
    COUNT(*) FILTER (WHERE sa.results_count = 0) as zero_result_count,
    COUNT(*) FILTER (WHERE sa.used_fuzzy_search = true) as fuzzy_usage_count
  FROM search_analytics sa
  WHERE sa.created_at >= NOW() - (days_back || ' days')::interval
  GROUP BY sa.search_query
  ORDER BY search_count DESC
  LIMIT 100;
END;
$$;

-- Admin function: Get search trends over time
CREATE OR REPLACE FUNCTION get_search_trends(
  days_back integer DEFAULT 30,
  time_bucket text DEFAULT 'day' -- 'hour', 'day', 'week'
)
RETURNS TABLE (
  time_bucket timestamptz,
  search_count bigint,
  avg_results numeric,
  zero_result_count bigint,
  fuzzy_usage_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bucket_interval interval;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Set bucket interval based on parameter
  bucket_interval := CASE time_bucket
    WHEN 'hour' THEN '1 hour'::interval
    WHEN 'day' THEN '1 day'::interval
    WHEN 'week' THEN '1 week'::interval
    ELSE '1 day'::interval
  END;

  RETURN QUERY
  SELECT 
    date_trunc(time_bucket, sa.created_at) as time_bucket,
    COUNT(*) as search_count,
    ROUND(AVG(sa.results_count), 2) as avg_results,
    COUNT(*) FILTER (WHERE sa.results_count = 0) as zero_result_count,
    COUNT(*) FILTER (WHERE sa.used_fuzzy_search = true) as fuzzy_usage_count
  FROM search_analytics sa
  WHERE sa.created_at >= NOW() - (days_back || ' days')::interval
  GROUP BY date_trunc(time_bucket, sa.created_at)
  ORDER BY time_bucket DESC;
END;
$$;

-- Comment on table
COMMENT ON TABLE search_analytics IS 'Tracks search queries for analytics and optimization purposes. No PII stored - only search terms and aggregated metrics.';

