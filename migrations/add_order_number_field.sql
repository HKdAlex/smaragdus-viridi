-- Add order_number field to orders table
-- This migration adds a human-readable order number field with format cq-0001

-- Add the order_number column
ALTER TABLE orders 
ADD COLUMN order_number TEXT UNIQUE;

-- Create a function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    order_num TEXT;
BEGIN
    -- Get the next sequential number
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1
    INTO next_number
    FROM orders
    WHERE order_number IS NOT NULL
    AND order_number ~ '^cq-\d+$';
    
    -- Format as cq-0001, cq-0002, etc.
    order_num := 'cq-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate order numbers for new orders
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set order_number if it's not already set
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Backfill existing orders with order numbers
-- This will generate order numbers for all existing orders
DO $$
DECLARE
    order_record RECORD;
    counter INTEGER := 1;
BEGIN
    -- Update all existing orders that don't have order numbers
    FOR order_record IN 
        SELECT id FROM orders 
        WHERE order_number IS NULL 
        ORDER BY created_at ASC
    LOOP
        UPDATE orders 
        SET order_number = 'cq-' || LPAD(counter::TEXT, 4, '0')
        WHERE id = order_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Create index for better performance on order_number lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Verify the migration
SELECT 
    COUNT(*) as total_orders,
    COUNT(order_number) as orders_with_numbers,
    MIN(order_number) as first_order_number,
    MAX(order_number) as last_order_number
FROM orders;
