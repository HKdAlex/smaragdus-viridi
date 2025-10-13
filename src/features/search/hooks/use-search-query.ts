/**
 * Search Query Hook
 * 
 * React Query hook for full-text search with filters and pagination.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdvancedGemstoneFilters } from '@/features/gemstones/types/filter.types';

export interface SearchQueryParams {
  query: string;
  filters?: AdvancedGemstoneFilters;
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  id: string;
  serial_number: string;
  name: string;
  color: string;
  cut: string | null;
  clarity: string | null;
  weight_carats: number;
  price_amount: number;
  price_currency: string;
  description: string | null;
  has_certification: boolean;
  has_ai_analysis: boolean;
  metadata_status: string | null;
  created_at: string;
  updated_at: string;
  relevance_score?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  pagination: {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Fetch search results from API
 */
async function fetchSearchResults(
  params: SearchQueryParams
): Promise<SearchResponse> {
  const { query, filters = {}, page = 1, pageSize = 24 } = params;

  const response = await fetch('/api/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      page,
      pageSize,
      filters,
    }),
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * React Query hook for full-text search
 * 
 * Features:
 * - Intelligent caching (5 min stale time)
 * - Automatic refetch on filter/page changes
 * - Loading and error states
 * 
 * @param params - Search parameters
 */
export function useSearchQuery(params: SearchQueryParams) {
  const { query, filters = {}, page = 1, pageSize = 24 } = params;

  return useQuery({
    queryKey: ['search', query, filters, page, pageSize],
    queryFn: () => fetchSearchResults(params),
    enabled: query.length > 0, // Only search if query exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

