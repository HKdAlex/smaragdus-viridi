"use client";

import type {
    GetOrderHistoryRequest,
    GetOrderHistoryResponse,
    UseOrderHistoryReturn,
    UserOrder,
} from '../types/user-profile.types';
import { useCallback, useEffect, useState } from 'react';

import { userProfileService } from '../services/user-profile-service';

export function useOrderHistory(userId?: string): UseOrderHistoryReturn {
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  const loadOrders = useCallback(async (request: GetOrderHistoryRequest = {}) => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const response: GetOrderHistoryResponse = await userProfileService.getOrderHistory(
        userId,
        {
          ...request,
          page: request.page || page,
          limit: request.limit || 10,
        }
      )

      if (response.success) {
        if (request.page === 1 || !request.page) {
          setOrders(response.orders)
        } else {
          setOrders(prev => [...prev, ...response.orders])
        }

        setTotal(response.total)
        setHasMore(response.hasMore)
        setPage(response.page)
      } else {
        setError(response.error || 'Failed to load orders')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [userId, page])

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadOrders({ page: page + 1 })
    }
  }, [hasMore, loading, page, loadOrders])

  const refresh = useCallback(() => {
    setPage(1)
    loadOrders({ page: 1 })
  }, [loadOrders])

  // Load initial orders when userId is available
  useEffect(() => {
    if (userId) {
      loadOrders({ page: 1 })
    } else {
      setOrders([])
      setTotal(0)
      setHasMore(false)
      setPage(1)
      setError(null)
    }
  }, [userId, loadOrders])

  return {
    orders,
    loading,
    error,
    total,
    hasMore,
    loadOrders,
    loadMore,
    refresh,
  }
}






















