-- Migration: Add missing gemstone types and cuts from Russian CSV data
-- Date: 2025-01-25
-- Purpose: Expand enums to support Russian gemstone price list import

-- Add missing gemstone types
ALTER TYPE gemstone_type ADD VALUE IF NOT EXISTS 'paraiba';
ALTER TYPE gemstone_type ADD VALUE IF NOT EXISTS 'spinel';  
ALTER TYPE gemstone_type ADD VALUE IF NOT EXISTS 'alexandrite';
ALTER TYPE gemstone_type ADD VALUE IF NOT EXISTS 'agate';

-- Add missing gem cuts
ALTER TYPE gem_cut ADD VALUE IF NOT EXISTS 'baguette';
ALTER TYPE gem_cut ADD VALUE IF NOT EXISTS 'asscher';
ALTER TYPE gem_cut ADD VALUE IF NOT EXISTS 'rhombus';
ALTER TYPE gem_cut ADD VALUE IF NOT EXISTS 'trapezoid';
ALTER TYPE gem_cut ADD VALUE IF NOT EXISTS 'triangle';
ALTER TYPE gem_cut ADD VALUE IF NOT EXISTS 'heart';
ALTER TYPE gem_cut ADD VALUE IF NOT EXISTS 'cabochon';
ALTER TYPE gem_cut ADD VALUE IF NOT EXISTS 'pentagon';
ALTER TYPE gem_cut ADD VALUE IF NOT EXISTS 'hexagon';

-- Verify the new values were added
SELECT 
    'gemstone_type' as enum_name,
    unnest(enum_range(NULL::gemstone_type)) as enum_value
UNION ALL
SELECT 
    'gem_cut' as enum_name,
    unnest(enum_range(NULL::gem_cut)) as enum_value
ORDER BY enum_name, enum_value;
