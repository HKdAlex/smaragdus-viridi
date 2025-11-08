"use client";

import type {
    GetActivityHistoryRequest,
    GetActivityHistoryResponse,
    UseActivityHistoryReturn,
    UserActivity,
} from '../types/user-profile.types';
import { useCallback, useEffect, useState } from 'react';

import { userProfileService } from '../services/user-profile-service';

export function useActivityHistory(userId?: string): UseActivityHistoryReturn {
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  const loadActivities = useCallback(async (request: GetActivityHistoryRequest = {}) => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const response: GetActivityHistoryResponse = await userProfileService.getActivityHistory(
        userId,
        {
          ...request,
          page: request.page || page,
          limit: request.limit || 20,
        }
      )

      if (response.success) {
        if (request.page === 1 || !request.page) {
          setActivities(response.activities)
        } else {
          setActivities(prev => [...prev, ...response.activities])
        }

        setTotal(response.total)
        setHasMore(response.hasMore)
        setPage(response.page)
      } else {
        setError(response.error || 'Failed to load activities')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities')
    } finally {
      setLoading(false)
    }
  }, [userId, page])

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadActivities({ page: page + 1 })
    }
  }, [hasMore, loading, page, loadActivities])

  const refresh = useCallback(() => {
    setPage(1)
    loadActivities({ page: 1 })
  }, [loadActivities])

  // Load initial activities when userId is available
  useEffect(() => {
    if (userId) {
      loadActivities({ page: 1 })
    } else {
      setActivities([])
      setTotal(0)
      setHasMore(false)
      setPage(1)
      setError(null)
    }
  }, [userId, loadActivities])

  return {
    activities,
    loading,
    error,
    total,
    hasMore,
    loadActivities,
    loadMore,
    refresh,
  }
}























