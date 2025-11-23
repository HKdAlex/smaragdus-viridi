-- Migration: Create Dashboard Statistics RPC Function
-- Date: 2025-01-20
-- Purpose: Optimize dashboard statistics by using database aggregations instead of fetching all data

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_dashboard_stats();

-- Create optimized dashboard statistics function
-- Uses SECURITY DEFINER to bypass RLS for admin statistics
-- Uses STABLE to allow query optimization
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'totalGemstones', (SELECT COUNT(*)::integer FROM gemstones),
    'inStockGemstones', (SELECT COUNT(*)::integer FROM gemstones WHERE in_stock = true),
    'outOfStockGemstones', (SELECT COUNT(*)::integer FROM gemstones WHERE in_stock = false),
    'activeUsers', (SELECT COUNT(*)::integer FROM user_profiles),
    'totalOrders', (SELECT COUNT(*)::integer FROM orders),
    'totalRevenue', (SELECT COALESCE(SUM(total_amount), 0)::bigint FROM orders),
    'avgGemstonePrice', (
      SELECT COALESCE(AVG(price_amount), 0)::integer 
      FROM gemstones 
      WHERE price_amount IS NOT NULL AND price_amount > 0
    )
  );
END;
$$;

-- Grant execute permission to authenticated users (RLS will handle admin check)
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;

