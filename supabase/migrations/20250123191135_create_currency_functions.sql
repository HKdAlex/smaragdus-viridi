-- Create database functions for currency conversion and formatting
-- These functions enable server-side currency operations following database-first principles

-- Convert amount from one currency to another using currency_rates table
CREATE OR REPLACE FUNCTION convert_currency(
  amount_cents BIGINT,
  from_currency currency_code DEFAULT 'USD',
  to_currency currency_code DEFAULT 'USD'
) RETURNS BIGINT AS $$
DECLARE
  conversion_rate DECIMAL(15,8);
BEGIN
  -- If same currency, no conversion needed
  IF from_currency = to_currency THEN
    RETURN amount_cents;
  END IF;
  
  -- Get rate from currency_rates table
  SELECT rate INTO conversion_rate
  FROM currency_rates
  WHERE base_currency = from_currency
    AND target_currency = to_currency
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- If rate not found, return original amount
  IF conversion_rate IS NULL THEN
    RETURN amount_cents;
  END IF;
  
  -- Convert and round to nearest cent
  RETURN ROUND(amount_cents * conversion_rate);
END;
$$ LANGUAGE plpgsql STABLE;

-- Format price with proper locale based on currency
-- Note: PostgreSQL doesn't have Intl.NumberFormat, so formatting is simplified
-- For full locale-aware formatting, use client-side Intl.NumberFormat
CREATE OR REPLACE FUNCTION format_price(
  amount_cents BIGINT,
  currency currency_code DEFAULT 'USD',
  locale TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  target_locale TEXT;
  formatted_amount TEXT;
BEGIN
  -- Determine locale based on currency if not provided
  -- (Note: locale parameter is for future use, actual formatting uses currency symbol)
  IF locale IS NULL THEN
    CASE currency
      WHEN 'KZT' THEN target_locale := 'kk-KZ';
      WHEN 'RUB' THEN target_locale := 'ru-RU';
      WHEN 'EUR' THEN target_locale := 'en-US';
      ELSE target_locale := 'en-US';
    END CASE;
  ELSE
    target_locale := locale;
  END IF;
  
  -- Format amount (convert from cents to base unit)
  formatted_amount := TO_CHAR(amount_cents / 100.0, 'FM999,999,999');
  
  -- Add currency symbol prefix
  RETURN format('%s%s', 
    CASE currency
      WHEN 'USD' THEN '$'
      WHEN 'EUR' THEN '€'
      WHEN 'GBP' THEN '£'
      WHEN 'RUB' THEN '₽'
      WHEN 'CHF' THEN 'CHF '
      WHEN 'JPY' THEN '¥'
      WHEN 'KZT' THEN '₸'
      ELSE currency::TEXT || ' '
    END,
    formatted_amount
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comments for documentation
COMMENT ON FUNCTION convert_currency IS 'Converts amount from one currency to another using rates from currency_rates table. Returns original amount if rate not found.';
COMMENT ON FUNCTION format_price IS 'Formats price amount with currency symbol. For full locale-aware formatting, use client-side Intl.NumberFormat.';

