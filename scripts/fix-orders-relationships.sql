-- Fix Orders Table Relationships Migration
-- This migration ensures proper foreign key relationships for the orders table

-- Add foreign key constraint for orders.user_id -> user_profiles.user_id
-- (This should already exist, but let's make sure)

DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'orders_user_id_fkey'
        AND table_name = 'orders'
    ) THEN
        -- Add the foreign key constraint if it doesn't exist
        ALTER TABLE orders
        ADD CONSTRAINT orders_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Verify the relationship works by testing a simple join query
-- This should work if the relationship is properly set up
SELECT o.id, o.total_amount, o.status, up.name, up.email
FROM orders o
LEFT JOIN user_profiles up ON o.user_id = up.user_id
LIMIT 1;


