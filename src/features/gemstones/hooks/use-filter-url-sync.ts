/**
 * Use Filter URL Sync Hook
 *
 * Separate utility for synchronizing filter state with URL query parameters.
 * Follows single responsibility principle - only handles URL sync.
 *
 * Can be enabled/disabled independently from filter state management.
 */

"use client";

import {
  FILTER_PARAM_KEYS,
  filtersToQueryString,
} from "../utils/filter-url.utils";
import { useEffect, useRef } from "react";

import type { AdvancedGemstoneFilters } from "../types/filter.types";
import { usePathname } from "@/i18n/navigation";
import { useTypeSafeRouter } from "@/lib/navigation/type-safe-router";

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

  const router = useTypeSafeRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (typeof window === "undefined") {
        return;
      }

      const currentParams = new URLSearchParams(window.location.search);
      const nextParams = new URLSearchParams();

      currentParams.forEach((value, key) => {
        if (
          !FILTER_PARAM_KEYS.includes(key as (typeof FILTER_PARAM_KEYS)[number])
        ) {
          nextParams.set(key, value);
        }
      });

      const filtersQueryString = filtersToQueryString(filters);

      if (filtersQueryString) {
        const filterParams = new URLSearchParams(filtersQueryString);
        filterParams.forEach((value, key) => {
          nextParams.set(key, value);
        });
      }

      const nextQueryString = nextParams.toString();
      const currentQueryString = currentParams.toString();

      if (nextQueryString !== currentQueryString) {
        const newUrl = nextQueryString
          ? `${pathname}?${nextQueryString}`
          : pathname;
        router.replaceDynamic(newUrl, { scroll: false });
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [filters, enabled, debounceMs]);
}
