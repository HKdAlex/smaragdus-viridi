/**
 * Use Filter State Hook
 * 
 * Simplified filter state management without URL coupling.
 * Follows single responsibility principle - only manages filter state.
 * 
 * URL synchronization is handled separately by use-filter-url-sync.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdvancedGemstoneFilters } from '../types/filter.types';
import { getActiveFilterCount } from '../types/filter.types';

export interface UseFilterStateOptions {
  initialFilters?: AdvancedGemstoneFilters;
}

export interface UseFilterStateReturn {
  filters: AdvancedGemstoneFilters;
  updateFilters: (updates: Partial<AdvancedGemstoneFilters>) => void;
  setFilters: (filters: AdvancedGemstoneFilters) => void;
  resetFilters: () => void;
  filterCount: number;
  hasFilters: boolean;
}

/**
 * Pure filter state management
 * 
 * Benefits:
 * - No side effects (no URL manipulation)
 * - Easy to test
 * - Composable with other hooks
 * - Clear single responsibility
 */
export function useFilterState(
  options: UseFilterStateOptions = {}
): UseFilterStateReturn {
  const { initialFilters = {} } = options;

  const [filters, setFilters] = useState<AdvancedGemstoneFilters>(initialFilters);

  // Sync filters when initialFilters change (e.g., from URL changes)
  // Only sync if initialFilters is not the default empty object
  useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters);
    }
  }, [JSON.stringify(initialFilters)]);

  const updateFilters = useCallback((updates: Partial<AdvancedGemstoneFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const filterCount = useMemo(() => 
    getActiveFilterCount(filters), 
    [filters]
  );

  const hasFilters = useMemo(() =>
    filterCount > 0,
    [filterCount]
  );

  return {
    filters,
    updateFilters,
    setFilters,
    resetFilters,
    filterCount,
    hasFilters,
  };
}

