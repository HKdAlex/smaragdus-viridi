-- Sprint 5: Shopping Cart & User Preferences Database Migration
-- This migration enhances the cart_items table and creates user_preferences table

-- =====================================================
-- CART_ITEMS TABLE ENHANCEMENTS
-- =====================================================

-- Add missing fields to cart_items table
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS
  updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS
  metadata JSONB DEFAULT '{}';

-- Update existing records to have updated_at set
UPDATE cart_items
SET updated_at = added_at
WHERE updated_at IS NULL;

-- Add indexes for performance (if not already exists)
CREATE INDEX IF NOT EXISTS idx_cart_items_user_updated
  ON cart_items(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_cart_items_expiration
  ON cart_items(updated_at) WHERE updated_at < NOW() - INTERVAL '7 days';

-- =====================================================
-- USER_PREFERENCES TABLE CREATION
-- =====================================================

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Theme preferences
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),

  -- Currency preferences
  preferred_currency TEXT DEFAULT 'USD' REFERENCES currency_codes(code),

  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  cart_updates BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,

  -- Privacy preferences
  profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('public', 'private')),
  data_sharing BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can manage their own preferences"
  ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
  ON user_preferences(user_id);

-- =====================================================
-- CART CLEANUP FUNCTION
-- =====================================================

-- Function to clean up expired cart items (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_expired_cart_items()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cart_items
  WHERE updated_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CART VALIDATION FUNCTION
-- =====================================================

-- Function to validate cart operations
CREATE OR REPLACE FUNCTION validate_cart_item(
  p_gemstone_id UUID,
  p_user_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  gemstone_record RECORD;
  user_cart_count INTEGER;
BEGIN
  -- Check if gemstone exists and is available
  SELECT * INTO gemstone_record
  FROM gemstones
  WHERE id = p_gemstone_id AND in_stock = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gemstone not found or not available';
  END IF;

  -- Check quantity limits (max 99 per item)
  IF p_quantity < 1 OR p_quantity > 99 THEN
    RAISE EXCEPTION 'Invalid quantity: must be between 1 and 99';
  END IF;

  -- Check user's cart item count (max 100 items total)
  SELECT COUNT(*) INTO user_cart_count
  FROM cart_items
  WHERE user_id = p_user_id;

  IF user_cart_count >= 100 THEN
    RAISE EXCEPTION 'Cart is full: maximum 100 items allowed';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CART TOTAL CALCULATION FUNCTION
-- =====================================================

-- Function to calculate cart total for a user
CREATE OR REPLACE FUNCTION calculate_cart_total(p_user_id UUID)
RETURNS TABLE(
  total_amount INTEGER,
  total_items INTEGER,
  currency TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(ci.quantity * g.price_amount), 0)::INTEGER as total_amount,
    COALESCE(SUM(ci.quantity), 0)::INTEGER as total_items,
    'USD'::TEXT as currency
  FROM cart_items ci
  JOIN gemstones g ON ci.gemstone_id = g.id
  WHERE ci.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USER PREFERENCES TRIGGER
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

-- =====================================================
-- CART ITEMS TRIGGER
-- =====================================================

-- Trigger to update updated_at timestamp for cart_items
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_cart_items_updated_at();

-- =====================================================
-- MIGRATION LOG
-- =====================================================

-- Log this migration
DO $$
BEGIN
  RAISE NOTICE 'Sprint 5 cart schema migration completed successfully';
  RAISE NOTICE 'Enhanced cart_items table with updated_at and metadata fields';
  RAISE NOTICE 'Created user_preferences table with RLS policies';
  RAISE NOTICE 'Added cart validation and calculation functions';
  RAISE NOTICE 'Created cleanup and maintenance triggers';
END $$;
