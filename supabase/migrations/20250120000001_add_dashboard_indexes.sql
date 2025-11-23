-- Migration: Add Performance Indexes for Dashboard Queries
-- Date: 2025-01-20
-- Purpose: Improve query performance for dashboard statistics aggregations

-- Index for filtering gemstones by stock status
-- Partial index only includes in_stock = true rows for faster counting
CREATE INDEX IF NOT EXISTS idx_gemstones_in_stock 
ON gemstones(in_stock) 
WHERE in_stock = true;

-- Index for filtering gemstones by stock status (false)
-- Partial index for out-of-stock count
CREATE INDEX IF NOT EXISTS idx_gemstones_out_of_stock 
ON gemstones(in_stock) 
WHERE in_stock = false;

-- Index for price amount calculations (average price)
-- Partial index only includes rows with valid prices
CREATE INDEX IF NOT EXISTS idx_gemstones_price_amount 
ON gemstones(price_amount) 
WHERE price_amount IS NOT NULL AND price_amount > 0;

-- Index for order revenue calculations
-- Partial index only includes rows with valid amounts
CREATE INDEX IF NOT EXISTS idx_orders_total_amount 
ON orders(total_amount) 
WHERE total_amount IS NOT NULL;

-- Index for user role filtering (if needed for future queries)
CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON user_profiles(role);

-- Index for user_id lookups (already used in admin context)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON user_profiles(user_id);

