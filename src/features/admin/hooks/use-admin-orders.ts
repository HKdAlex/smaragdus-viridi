"use client";

import type {
    AdminOrder,
    OrderFilters,
    UseAdminOrdersReturn,
} from '../types/order-management.types';
import { useCallback, useEffect, useState } from 'react';

import { orderManagementService } from '../services/order-management-service';

export function useAdminOrders(): UseAdminOrdersReturn {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [hasMore, setHasMore] = useState(false)
  const [filters, setFilters] = useState<OrderFilters>({})

  const loadOrders = useCallback(async (loadPage: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const response = await orderManagementService.getOrders({
        page: loadPage,
        limit,
        filters,
        sort_by: 'created_at',
        sort_order: 'desc'
      })

      if (response.success) {
        if (loadPage === 1) {
          setOrders(response.orders)
        } else {
          setOrders(prev => [...prev, ...response.orders])
        }
        setTotal(response.total)
        setPage(response.page)
        setHasMore(response.hasMore)
      } else {
        setError(response.error || 'Failed to load orders')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [limit, filters])

  // Load orders when filters change
  useEffect(() => {
    loadOrders(1)
  }, [filters, loadOrders])

  const updateOrderStatus = useCallback(async (
    orderId: string,
    newStatus: string
  ): Promise<void> => {
    try {
      const response = await orderManagementService.updateOrderStatus({
        order_id: orderId,
        new_status: newStatus as any
      })

      if (response.success && response.order) {
        // Update the order in the local state
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? response.order! : order
          )
        )
      } else {
        throw new Error(response.error || 'Failed to update order status')
      }
    } catch (err) {
      throw err
    }
  }, [])

  const bulkUpdateOrders = useCallback(async (
    orderIds: string[],
    newStatus: string
  ): Promise<void> => {
    try {
      const response = await orderManagementService.bulkUpdateOrders({
        order_ids: orderIds,
        new_status: newStatus as any
      })

      if (response.success) {
        // Reload orders to get updated data
        await loadOrders(1)
      } else {
        throw new Error(response.error || 'Failed to update orders')
      }
    } catch (err) {
      throw err
    }
  }, [loadOrders])

  const updateFilters = useCallback((newFilters: OrderFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  const setPageNumber = useCallback((newPage: number) => {
    setPage(newPage)
    loadOrders(newPage)
  }, [loadOrders])

  const refresh = useCallback(() => {
    loadOrders(1)
  }, [loadOrders])

  return {
    orders,
    loading,
    error,
    total,
    page,
    limit,
    hasMore,
    filters,
    updateOrderStatus,
    bulkUpdateOrders,
    setFilters: updateFilters,
    setPage: setPageNumber,
    refresh
  }
}
