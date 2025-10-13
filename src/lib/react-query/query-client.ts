/**
 * React Query Client Configuration
 *
 * Centralized TanStack Query client with optimized defaults for gemstone catalog.
 *
 * Caching Strategy:
 * - Search results: 5 minutes (moderate freshness)
 * - Filter options: 10 minutes (changes infrequently)
 * - Images: 24 hours (static content)
 * - Gemstone details: 10 minutes
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache garbage collection (renamed from cacheTime in v5)
      refetchOnWindowFocus: false, // Don't refetch on window focus (expensive for our use case)
      refetchOnReconnect: true, // Refetch on reconnect (good for offline users)
      retry: 1, // Retry failed requests once
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 0, // Don't retry mutations by default
    },
  },
});
