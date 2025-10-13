/**
 * React Query Provider
 * 
 * Wraps the application with TanStack Query client and devtools.
 * Provides intelligent caching, background refetching, and query state management.
 */

'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './query-client';

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools 
        initialIsOpen={false}
        position="bottom-right"
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  );
}

