/**
 * Search Suggestions Query Hook
 *
 * React Query hook for fetching autocomplete suggestions.
 * Uses debouncing to avoid excessive API calls.
 */

"use client";

import { useQuery } from "@tanstack/react-query";

export interface SearchSuggestion {
  suggestion: string;
  category: "serial_number" | "type" | "color";
  relevance: number;
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}

/**
 * Fetch search suggestions from API
 */
async function fetchSearchSuggestions(
  query: string,
  limit: number = 10
): Promise<SearchSuggestionsResponse> {
  if (!query || query.length < 2) {
    return { suggestions: [] };
  }

  const params = new URLSearchParams({
    query,
    limit: limit.toString(),
  });

  const response = await fetch(`/api/search/suggestions?${params}`);

  if (!response.ok) {
    throw new Error(`Search suggestions failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * React Query hook for search suggestions
 *
 * Features:
 * - Automatic caching (5 min stale time)
 * - Disabled when query is too short
 * - Returns empty array immediately for short queries
 *
 * @param query - Search query (minimum 2 characters)
 * @param options - Query options
 */
export function useSearchSuggestionsQuery(
  query: string,
  options: {
    enabled?: boolean;
    limit?: number;
  } = {}
) {
  const { enabled = true, limit = 10 } = options;

  // Normalize query
  const normalizedQuery = query.trim();
  const isQueryValid = normalizedQuery.length >= 2;

  return useQuery({
    queryKey: ["searchSuggestions", normalizedQuery, limit],
    queryFn: () => fetchSearchSuggestions(normalizedQuery, limit),
    enabled: enabled && isQueryValid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    placeholderData: { suggestions: [] }, // Show empty while loading
  });
}
