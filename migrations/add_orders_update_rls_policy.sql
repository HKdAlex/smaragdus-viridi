-- Add UPDATE RLS policy for orders table
-- This allows admins to update order statuses

-- Enable RLS on orders table if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create UPDATE policy for admins
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Create UPDATE policy for users to update their own orders (for limited fields)
CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (
    auth.uid() = user_id
  );

