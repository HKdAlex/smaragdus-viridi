-- Setup RLS policies for cart functionality
-- Run this in Supabase SQL editor or via CLI

-- Enable RLS on cart_items table
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own cart items
CREATE POLICY "Users can view their own cart items"
ON cart_items FOR SELECT
USING (auth.uid()::text = user_id);

-- Allow users to insert their own cart items
CREATE POLICY "Users can insert their own cart items"
ON cart_items FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Allow users to update their own cart items
CREATE POLICY "Users can update their own cart items"
ON cart_items FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Allow users to delete their own cart items
CREATE POLICY "Users can delete their own cart items"
ON cart_items FOR DELETE
USING (auth.uid()::text = user_id);

-- Enable RLS on user_preferences table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own preferences
CREATE POLICY "Users can view their own preferences"
ON user_preferences FOR SELECT
USING (auth.uid()::text = user_id);

-- Allow users to insert their own preferences
CREATE POLICY "Users can insert their own preferences"
ON user_preferences FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Allow users to update their own preferences
CREATE POLICY "Users can update their own preferences"
ON user_preferences FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Allow users to delete their own preferences
CREATE POLICY "Users can delete their own preferences"
ON user_preferences FOR DELETE
USING (auth.uid()::text = user_id);
