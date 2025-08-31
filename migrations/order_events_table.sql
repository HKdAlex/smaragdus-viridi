-- Create order_events table for tracking order history
CREATE TABLE IF NOT EXISTS order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  performed_by UUID REFERENCES user_profiles(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_performed_at ON order_events(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_events_event_type ON order_events(event_type);
CREATE INDEX IF NOT EXISTS idx_order_events_severity ON order_events(severity);
CREATE INDEX IF NOT EXISTS idx_order_events_performed_by ON order_events(performed_by);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_order_events_order_performed_at ON order_events(order_id, performed_at DESC);

-- Enable Row Level Security
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view events for their own orders
CREATE POLICY "Users can view their own order events" ON order_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_events.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can view all order events
CREATE POLICY "Admins can view all order events" ON order_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Admins can insert order events
CREATE POLICY "Admins can insert order events" ON order_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- System can insert order events (for automated events)
CREATE POLICY "System can insert order events" ON order_events
  FOR INSERT WITH CHECK (
    performed_by IS NULL
  );

-- Create trigger to automatically log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_events (
      order_id,
      event_type,
      severity,
      title,
      description,
      metadata,
      performed_at
    ) VALUES (
      NEW.id,
      'order_' || NEW.status,
      CASE 
        WHEN NEW.status = 'delivered' THEN 'success'
        WHEN NEW.status = 'cancelled' THEN 'error'
        WHEN NEW.status = 'pending' THEN 'warning'
        ELSE 'info'
      END,
      'Order ' || INITCAP(NEW.status),
      'Order status changed from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'automated', true
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_log_order_status_change ON orders;
CREATE TRIGGER trigger_log_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Create function to add initial order created event
CREATE OR REPLACE FUNCTION add_order_created_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_events (
    order_id,
    event_type,
    severity,
    title,
    description,
    metadata,
    performed_at
  ) VALUES (
    NEW.id,
    'order_created',
    'success',
    'Order Created',
    'Order has been successfully created',
    jsonb_build_object(
      'total_amount', NEW.total_amount,
      'currency_code', NEW.currency_code,
      'automated', true
    ),
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new orders
DROP TRIGGER IF EXISTS trigger_add_order_created_event ON orders;
CREATE TRIGGER trigger_add_order_created_event
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION add_order_created_event();
