-- Order Stock Management Functions
-- This script creates functions for managing inventory during order processing

-- Function to decrement stock for a gemstone
CREATE OR REPLACE FUNCTION decrement_stock(
  gemstone_id UUID,
  quantity_to_decrement INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock BOOLEAN;
  stock_updated BOOLEAN := FALSE;
BEGIN
  -- Check if gemstone exists and is in stock
  SELECT in_stock INTO current_stock
  FROM gemstones
  WHERE id = gemstone_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gemstone not found: %', gemstone_id;
  END IF;

  IF NOT current_stock THEN
    RAISE EXCEPTION 'Gemstone is out of stock: %', gemstone_id;
  END IF;

  -- For now, we just mark as out of stock if any quantity is ordered
  -- In a full inventory system, you'd track actual quantities
  IF quantity_to_decrement > 0 THEN
    UPDATE gemstones
    SET
      in_stock = FALSE,
      updated_at = NOW()
    WHERE id = gemstone_id;

    stock_updated := TRUE;
  END IF;

  RETURN stock_updated;
END;
$$;

-- Function to check if gemstone is available for ordering
CREATE OR REPLACE FUNCTION is_gemstone_available(gemstone_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  available BOOLEAN;
BEGIN
  SELECT in_stock INTO available
  FROM gemstones
  WHERE id = gemstone_id;

  RETURN COALESCE(available, FALSE);
END;
$$;

-- Function to get order summary for admin dashboard
CREATE OR REPLACE FUNCTION get_order_summary()
RETURNS TABLE (
  total_orders BIGINT,
  total_revenue DECIMAL,
  pending_orders BIGINT,
  confirmed_orders BIGINT,
  shipped_orders BIGINT,
  delivered_orders BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_orders,
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_orders,
    COUNT(*) FILTER (WHERE status = 'shipped') as shipped_orders,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders
  FROM orders
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
END;
$$;

-- Function to get recent orders for admin
CREATE OR REPLACE FUNCTION get_recent_orders(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  status order_status,
  total_amount DECIMAL,
  currency_code TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  item_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.user_id,
    o.status,
    o.total_amount,
    o.currency_code,
    o.created_at,
    o.updated_at,
    COUNT(oi.id) as item_count
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  GROUP BY o.id, o.user_id, o.status, o.total_amount, o.currency_code, o.created_at, o.updated_at
  ORDER BY o.created_at DESC
  LIMIT limit_count;
END;
$$;
