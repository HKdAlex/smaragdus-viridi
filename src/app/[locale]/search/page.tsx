/**
 * Search Results Page
 * 
 * Displays full-text search results with relevance ranking.
 * Features:
 * - Server-side searchParams reading
 * - Client-side data fetching with React Query
 * - Filter integration
 * - Pagination
 */

import { Suspense } from 'react';
import { SearchResults } from '@/features/search/components/search-results';
import { LoadingState } from '@/features/gemstones/components/loading-state';

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingState count={24} />}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}

