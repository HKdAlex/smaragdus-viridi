-- Migration: Add flexible gemstone property fields
-- Contract: FLEX-C0.1
-- Purpose: Allow administrators to enter custom text values for gemstone properties
--          instead of being restricted to predefined enum dropdowns.
--
-- New columns:
--   - name_custom: Free-text gemstone name/type (e.g., "Paraiba Tourmaline")
--   - color_custom: Free-text color description
--   - cut_custom: Free-text cut/faceting description
--   - clarity_custom: Free-text clarity description
--   - treatment_status: Treatment/enhancement status (e.g., "Heat treated", "Untreated")
--   - color_change_description: Color change effect for alexandrites
--   - mining_country: Country where stone was mined
--   - cutting_country: Country where stone was cut
--   - quality_classification: Stone-specific quality grading (e.g., Russian ТУ Г1/Г2/Г3)
--   - enhancement_notes: Additional enhancement/treatment details
--
-- All columns are nullable TEXT to allow gradual adoption without breaking existing data.

-- Add custom text columns for core properties (alongside existing enum columns)
ALTER TABLE public.gemstones
ADD COLUMN IF NOT EXISTS name_custom TEXT,
ADD COLUMN IF NOT EXISTS color_custom TEXT,
ADD COLUMN IF NOT EXISTS cut_custom TEXT,
ADD COLUMN IF NOT EXISTS clarity_custom TEXT;

-- Add detailed property columns for professional jeweler information
ALTER TABLE public.gemstones
ADD COLUMN IF NOT EXISTS treatment_status TEXT,
ADD COLUMN IF NOT EXISTS color_change_description TEXT,
ADD COLUMN IF NOT EXISTS mining_country TEXT,
ADD COLUMN IF NOT EXISTS cutting_country TEXT,
ADD COLUMN IF NOT EXISTS quality_classification TEXT,
ADD COLUMN IF NOT EXISTS enhancement_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.gemstones.name_custom IS 'Admin-entered custom gemstone name/type (free text)';
COMMENT ON COLUMN public.gemstones.color_custom IS 'Admin-entered custom color description (free text)';
COMMENT ON COLUMN public.gemstones.cut_custom IS 'Admin-entered custom cut/faceting description (free text)';
COMMENT ON COLUMN public.gemstones.clarity_custom IS 'Admin-entered custom clarity description (free text)';
COMMENT ON COLUMN public.gemstones.treatment_status IS 'Treatment/enhancement status (e.g., Heat treated, Untreated, Oiled)';
COMMENT ON COLUMN public.gemstones.color_change_description IS 'Color change effect description for alexandrites and similar stones';
COMMENT ON COLUMN public.gemstones.mining_country IS 'Country where the gemstone was mined/extracted';
COMMENT ON COLUMN public.gemstones.cutting_country IS 'Country where the gemstone was cut/faceted';
COMMENT ON COLUMN public.gemstones.quality_classification IS 'Stone-specific quality grading (e.g., Russian ТУ Г1/Г2/Г3 for alexandrites)';
COMMENT ON COLUMN public.gemstones.enhancement_notes IS 'Additional notes about enhancements, treatments, or natural status';
