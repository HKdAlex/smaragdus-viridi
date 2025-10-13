/**
 * Use Filter URL Sync Hook
 *
 * Separate utility for synchronizing filter state with URL query parameters.
 * Follows single responsibility principle - only handles URL sync.
 *
 * Can be enabled/disabled independently from filter state management.
 */

"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

import type { AdvancedGemstoneFilters } from "../types/filter.types";
import { filtersToQueryString } from "../utils/filter-url.utils";

export interface UseFilterUrlSyncOptions {
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Synchronize filter state with URL query parameters
 *
 * Benefits:
 * - Shareable URLs with filters
 * - Browser back/forward support
 * - State persistence on refresh
 * - Debounced updates (avoid rapid URL changes)
 * - Can be disabled for admin views
 *
 * Example:
 * ```typescript
 * const { filters, setFilters } = useFilterState();
 * useFilterUrlSync(filters); // Auto-sync to URL
 * ```
 */
export function useFilterUrlSync(
  filters: AdvancedGemstoneFilters,
  options: UseFilterUrlSyncOptions = {}
) {
  const { enabled = true, debounceMs = 100 } = options;

  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce URL updates
    timeoutRef.current = setTimeout(() => {
      const queryString = filtersToQueryString(filters);
      const currentQuery = window.location.search.slice(1);

      // Only update if query actually changed
      if (queryString !== currentQuery) {
        const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

        router.replace(newUrl as any, { scroll: false });
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [filters, enabled, debounceMs, router, pathname]);
}
