-- Add Foreign Key Relationship Between Orders and User Profiles
-- This migration creates the necessary foreign key relationship for the admin order management to work

-- Add foreign key constraint for orders.user_id -> user_profiles.user_id
ALTER TABLE orders
ADD CONSTRAINT orders_user_id_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id)
ON DELETE CASCADE;

-- Verify the relationship exists
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'orders'
    AND kcu.column_name = 'user_id';

-- Test the relationship with a sample query
SELECT
    o.id as order_id,
    o.total_amount,
    o.status,
    o.created_at,
    up.name as user_name,
    up.email as user_email
FROM orders o
LEFT JOIN user_profiles up ON o.user_id = up.user_id
ORDER BY o.created_at DESC
LIMIT 5;


