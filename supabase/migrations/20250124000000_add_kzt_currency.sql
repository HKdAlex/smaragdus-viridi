-- Add KZT to currency_code enum
-- This migration adds KZT (Kazakhstani Tenge) to the existing currency_code enum

-- First, check if KZT already exists (idempotent)
DO $$ 
BEGIN
    -- Add KZT to the enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'KZT' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'currency_code')
    ) THEN
        ALTER TYPE currency_code ADD VALUE 'KZT';
    END IF;
END $$;

-- Ensure currency_rates table can handle KZT conversions
-- The table structure already supports any currency_code enum value, so no changes needed

-- Add comment for documentation
COMMENT ON TYPE currency_code IS 'Supported currency codes: USD (base), EUR, GBP, RUB, CHF, JPY, KZT';

