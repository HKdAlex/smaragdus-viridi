# Media Stats Dashboard - React Query Refactor Plan

## Summary

Refactor the Media Stats Dashboard component to use React Query for data fetching, replacing manual `useState`/`useEffect` patterns. This brings consistency with the recently refactored Admin Gemstone Management and provides better caching, automatic refetching, and error handling.

## Current State

### Component: `src/features/admin/components/media-stats-dashboard.tsx`

- Uses `useState` for: `stats`, `loading`, `error`, `refreshing`
- Uses `useEffect` for initial data fetch
- Manual `fetchStats` function with try/catch/finally
- Manual refresh button that calls `fetchStats`

### API Endpoint: `src/app/api/admin/media/stats/route.ts`

- GET endpoint returning `MediaStats` object
- No mutations currently (cleanup operations not yet implemented)

## Constraints

1. Must maintain existing UI/UX behavior
2. Must preserve the refresh button functionality
3. Must handle loading and error states identically
4. Should use existing query key patterns from `src/lib/react-query/query-keys.ts`
5. No new API endpoints needed

## Implementation Plan

### Task 1: Add Query Keys for Media Stats

**File**: `src/lib/react-query/query-keys.ts`

Add media stats keys under the admin namespace:

```typescript
admin: {
  // ... existing keys
  mediaStats: {
    all: () => [...queryKeys.admin.all, "mediaStats"] as const,
    stats: () => [...queryKeys.admin.mediaStats.all(), "stats"] as const,
  },
}
```

### Task 2: Create Media Stats Query Hook

**File**: `src/features/admin/hooks/use-media-stats-query.ts` (new file)

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";

export interface MediaStats {
  totalImages: number;
  totalVideos: number;
  totalStorageFiles: number;
  orphanedImages: Array<{
    id: string;
    gemstone_id: string;
    original_path: string | null;
    image_url: string;
    original_filename: string | null;
  }>;
  orphanedVideos: Array<{
    id: string;
    gemstone_id: string;
    original_path: string | null;
    video_url: string;
    original_filename: string | null;
  }>;
  orphanedStorageFiles: Array<{
    name: string;
    path: string;
    size: number;
    lastModified: string;
  }>;
  storageSize: {
    total: number;
    images: number;
    videos: number;
  };
}

async function fetchMediaStats(): Promise<MediaStats> {
  const response = await fetch("/api/admin/media/stats");

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to fetch media statistics");
  }

  const result = await response.json();
  if (result.success && result.data) {
    return result.data;
  }

  throw new Error("Invalid response format");
}

export function useMediaStats() {
  return useQuery({
    queryKey: queryKeys.admin.mediaStats.stats(),
    queryFn: fetchMediaStats,
    staleTime: 5 * 60 * 1000, // 5 minutes - media stats don't change frequently
  });
}
```

### Task 3: Refactor MediaStatsDashboard Component

**File**: `src/features/admin/components/media-stats-dashboard.tsx`

Changes:

1. Remove `useState` for `stats`, `loading`, `error`, `refreshing`
2. Remove `fetchStats` function
3. Remove `useEffect` for initial fetch
4. Import and use `useMediaStats` hook
5. Use `refetch` from React Query for refresh button
6. Use `isFetching` for refresh spinner state

```typescript
"use client";

import { useMediaStats } from "../hooks/use-media-stats-query";
// ... other imports

export function MediaStatsDashboard() {
  const t = useTranslations("admin");

  const {
    data: stats,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useMediaStats();

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    // ... loading UI (unchanged)
  }

  if (error) {
    // ... error UI, use error.message
  }

  if (!stats) {
    return null;
  }

  // ... rest of component unchanged, just use isFetching for refresh spinner
}
```

### Task 4: (Future) Add Cleanup Mutations

When cleanup operations are implemented, add mutation hooks:

**File**: `src/features/admin/hooks/use-media-stats-mutations.ts` (future)

```typescript
// Example structure for future cleanup mutations
export function useCleanupOrphanedRecords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (type: "images" | "videos" | "files") =>
      fetch(`/api/admin/media/cleanup`, {
        method: "POST",
        body: JSON.stringify({ type }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.mediaStats.all(),
      });
    },
  });
}
```

## File Map

| File                                                      | Action | Description                          |
| --------------------------------------------------------- | ------ | ------------------------------------ |
| `src/lib/react-query/query-keys.ts`                       | Modify | Add mediaStats query keys            |
| `src/features/admin/hooks/use-media-stats-query.ts`       | Create | New React Query hook for media stats |
| `src/features/admin/components/media-stats-dashboard.tsx` | Modify | Refactor to use React Query          |

## Public Interfaces

### useMediaStats Hook

```typescript
function useMediaStats(): UseQueryResult<MediaStats, Error>;
```

Returns standard React Query result with:

- `data: MediaStats | undefined`
- `isLoading: boolean`
- `isFetching: boolean`
- `error: Error | null`
- `refetch: () => Promise<...>`

## Data Model Impact

None - no database changes required.

## Test Strategy

1. **Manual Testing**:

   - Verify initial load shows loading spinner
   - Verify data displays correctly after load
   - Verify refresh button works and shows spinner
   - Verify error state displays correctly (can test by temporarily breaking API)
   - Verify data is cached (navigate away and back - should show cached data)

2. **Unit Tests** (if test infrastructure exists):
   - Test `useMediaStats` hook with mocked fetch
   - Test loading/error/success states

## Risks

| Risk                            | Likelihood | Impact | Mitigation                                     |
| ------------------------------- | ---------- | ------ | ---------------------------------------------- |
| Breaking existing functionality | Low        | Medium | Minimal changes to component logic             |
| Cache staleness issues          | Low        | Low    | 5-minute staleTime is reasonable for this data |

## Open Questions

1. Should we add a periodic auto-refresh for media stats? (e.g., every 5 minutes while tab is active)
2. Should cleanup operations be implemented as part of this refactor or as a separate task?

## Estimated Effort

- Task 1: 5 minutes
- Task 2: 10 minutes
- Task 3: 15 minutes
- Testing: 10 minutes

**Total: ~40 minutes**

## Dependencies

- React Query already configured in the project ✅
- Query keys pattern established ✅
- No external dependencies needed
