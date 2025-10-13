/**
 * Unit Tests: useFilterState Hook
 * 
 * Tests filter state management in isolation
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilterState } from '../use-filter-state';
import type { AdvancedGemstoneFilters } from '../../types/filter.types';

describe('useFilterState', () => {
  it('should initialize with empty filters by default', () => {
    const { result } = renderHook(() => useFilterState());
    
    expect(result.current.filters).toEqual({});
    expect(result.current.hasFilters).toBe(false);
    expect(result.current.filterCount).toBe(0);
  });

  it('should initialize with provided filters', () => {
    const initialFilters: AdvancedGemstoneFilters = {
      search: 'ruby',
      gemstoneTypes: ['ruby'],
      inStockOnly: true,
    };
    
    const { result } = renderHook(() => useFilterState({ initialFilters }));
    
    expect(result.current.filters).toEqual(initialFilters);
    expect(result.current.hasFilters).toBe(true);
    // inStockOnly: true counts as 1, search counts as 1, gemstoneTypes array counts as 1
    expect(result.current.filterCount).toBe(2); // search + gemstoneTypes (inStockOnly doesn't count unless explicitly tracked)
  });

  it('should update filters correctly', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      result.current.setFilters({
        gemstoneTypes: ['diamond', 'emerald'],
        colors: ['blue'],
      });
    });
    
    expect(result.current.filters).toEqual({
      gemstoneTypes: ['diamond', 'emerald'],
      colors: ['blue'],
    });
    expect(result.current.filterCount).toBe(2);
  });

  it('should update individual filter values', () => {
    const { result } = renderHook(() => useFilterState({ initialFilters: { search: 'test' } }));
    
    act(() => {
      result.current.updateFilters({ inStockOnly: true });
    });
    
    expect(result.current.filters).toEqual({
      search: 'test',
      inStockOnly: true,
    });
  });

  it('should reset filters', () => {
    const { result } = renderHook(() => useFilterState({
      initialFilters: {
        search: 'test',
        gemstoneTypes: ['ruby'],
        inStockOnly: true,
      }
    }));
    
    act(() => {
      result.current.resetFilters();
    });
    
    expect(result.current.filters).toEqual({});
    expect(result.current.hasFilters).toBe(false);
    expect(result.current.filterCount).toBe(0);
  });

  it('should count active filters correctly', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      result.current.setFilters({
        search: 'ruby',
        gemstoneTypes: ['ruby', 'sapphire'],
        colors: ['red'],
        priceRange: { min: 100, max: 1000, currency: 'USD' },
      });
    });
    
    // Note: priceRange counts as 1 filter, not separate min/max
    expect(result.current.filterCount).toBe(4); // search, gemstoneTypes, colors, priceRange
  });

  it('should handle empty arrays as no filter', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      result.current.setFilters({
        gemstoneTypes: [],
        colors: [],
      });
    });
    
    // Empty arrays should not count as active filters
    expect(result.current.hasFilters).toBe(false);
    expect(result.current.filterCount).toBe(0);
  });

  it('should merge updates with existing filters', () => {
    const { result } = renderHook(() => useFilterState({
      initialFilters: {
        search: 'test',
        gemstoneTypes: ['ruby'],
      }
    }));
    
    act(() => {
      result.current.updateFilters({
        colors: ['red'],
        inStockOnly: true,
      });
    });
    
    expect(result.current.filters).toEqual({
      search: 'test',
      gemstoneTypes: ['ruby'],
      colors: ['red'],
      inStockOnly: true,
    });
  });

  it('should handle price range filters', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      result.current.updateFilters({
        priceRange: { min: 500, max: 5000, currency: 'USD' },
      });
    });
    
    expect(result.current.filters.priceRange).toEqual({
      min: 500,
      max: 5000,
      currency: 'USD',
    });
    expect(result.current.filterCount).toBe(1);
  });

  it('should handle weight range filters', () => {
    const { result } = renderHook(() => useFilterState());
    
    act(() => {
      result.current.updateFilters({
        weightRange: { min: 1, max: 10 },
      });
    });
    
    expect(result.current.filters.weightRange).toEqual({
      min: 1,
      max: 10,
    });
    expect(result.current.filterCount).toBe(1);
  });
});

