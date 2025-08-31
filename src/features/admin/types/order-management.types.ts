// ===== DATABASE LAYER =====
// Database types are imported from shared types
export type { DatabaseOrder, DatabaseOrderItem } from '@/shared/types'

// ===== APPLICATION LAYER EXTENSIONS =====

import type { CurrencyCode, DatabaseOrderItem } from '@/shared/types'

// Extended order with full details
export interface AdminOrder {
  readonly id: string
  readonly user_id: string
  readonly status: OrderStatus
  readonly total_amount: number
  readonly currency_code: CurrencyCode
  readonly created_at: string
  readonly updated_at: string
  readonly delivery_address?: string | null
  readonly notes?: string | null
  readonly user?: {
    id: string
    name: string
    email: string
  }
  readonly items: AdminOrderItem[]
}

// Extended order item with gemstone details
export interface AdminOrderItem extends DatabaseOrderItem {
  readonly id: string
  readonly order_id: string
  readonly gemstone_id: string
  readonly quantity: number
  readonly unit_price: number
  readonly line_total: number
  readonly gemstone?: {
    id: string
    name: string
    color: string
    cut: string
    weight_carats: number
    serial_number: string
    in_stock: boolean
  }
}

// Order status types
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type OrderStatusColor =
  | 'default'    // green - delivered
  | 'secondary'  // gray - cancelled
  | 'outline'    // blue - confirmed
  | 'destructive' // red - cancelled/error

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string
  color: OrderStatusColor
  description: string
  nextStatuses?: OrderStatus[]
}> = {
  pending: {
    label: 'Pending',
    color: 'outline',
    description: 'Order received, awaiting confirmation',
    nextStatuses: ['confirmed', 'cancelled']
  },
  confirmed: {
    label: 'Confirmed',
    color: 'outline',
    description: 'Order confirmed, payment processed',
    nextStatuses: ['processing', 'cancelled']
  },
  processing: {
    label: 'Processing',
    color: 'outline',
    description: 'Order being prepared for shipment',
    nextStatuses: ['shipped', 'cancelled']
  },
  shipped: {
    label: 'Shipped',
    color: 'outline',
    description: 'Order has been shipped',
    nextStatuses: ['delivered']
  },
  delivered: {
    label: 'Delivered',
    color: 'default',
    description: 'Order successfully delivered',
    nextStatuses: []
  },
  cancelled: {
    label: 'Cancelled',
    color: 'secondary',
    description: 'Order has been cancelled',
    nextStatuses: []
  }
}

// ===== API REQUEST/RESPONSE TYPES =====

// Order list filters
export interface OrderFilters {
  status?: OrderStatus[]
  user_id?: string
  date_from?: string
  date_to?: string
  min_amount?: number
  max_amount?: number
  currency?: string
  search?: string // order ID or user name
}

// Order list request
export interface GetOrdersRequest {
  page?: number
  limit?: number
  filters?: OrderFilters
  sort_by?: 'created_at' | 'updated_at' | 'total_amount' | 'status'
  sort_order?: 'asc' | 'desc'
}

// Order list response
export interface GetOrdersResponse {
  success: boolean
  orders: AdminOrder[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  error?: string
}

// Order update request
export interface UpdateOrderStatusRequest {
  order_id: string
  new_status: OrderStatus
  notes?: string
}

// Order update response
export interface UpdateOrderStatusResponse {
  success: boolean
  order?: AdminOrder
  error?: string
}

// Bulk order update request
export interface BulkUpdateOrdersRequest {
  order_ids: string[]
  new_status: OrderStatus
  notes?: string
}

// Bulk order update response
export interface BulkUpdateOrdersResponse {
  success: boolean
  updated_orders: AdminOrder[]
  failed_updates: Array<{
    order_id: string
    error: string
  }>
  error?: string
}

// ===== UI COMPONENT PROPS =====

// Order list component props
export interface OrderListProps {
  orders: AdminOrder[]
  loading: boolean
  onOrderSelect: (order: AdminOrder) => void
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => Promise<void>
  selectedOrderId?: string
}

// Order detail component props
export interface OrderDetailProps {
  order: AdminOrder
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => Promise<void>
  onBack: () => void
  loading?: boolean
}

// Order filters component props
export interface OrderFiltersProps {
  filters: OrderFilters
  onFiltersChange: (filters: OrderFilters) => void
  onClearFilters: () => void
}

// Order analytics component props
export interface OrderAnalyticsProps {
  dateRange?: {
    from: string
    to: string
  }
  refreshInterval?: number
}

// ===== HOOK TYPES =====

export interface UseAdminOrdersReturn {
  orders: AdminOrder[]
  loading: boolean
  error: string | null
  total: number
  page: number
  limit: number
  hasMore: boolean
  filters: OrderFilters
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>
  bulkUpdateOrders: (orderIds: string[], newStatus: OrderStatus) => Promise<void>
  setFilters: (filters: OrderFilters) => void
  setPage: (page: number) => void
  refresh: () => void
}

// ===== ANALYTICS TYPES =====

// Order analytics data
export interface OrderAnalytics {
  total_orders: number
  total_revenue: number
  average_order_value: number
  orders_by_status: Record<OrderStatus, number>
  orders_by_date: Array<{
    date: string
    count: number
    revenue: number
  }>
  top_products: Array<{
    gemstone_id: string
    gemstone_name: string
    total_sold: number
    total_revenue: number
  }>
  customer_stats: {
    total_customers: number
    repeat_customers: number
    average_orders_per_customer: number
  }
}

// ===== ERROR TYPES =====

export class OrderManagementError extends Error {
  constructor(
    public code: 'ORDER_NOT_FOUND' | 'INVALID_STATUS_TRANSITION' | 'PERMISSION_DENIED' | 'NETWORK_ERROR',
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'OrderManagementError'
  }
}

// ===== CONFIGURATION =====

export interface OrderManagementConfig {
  defaultPageSize: number
  maxPageSize: number
  statusTransitionTimeout: number
  bulkUpdateLimit: number
  analyticsRefreshInterval: number
}

export const DEFAULT_ORDER_MANAGEMENT_CONFIG: OrderManagementConfig = {
  defaultPageSize: 20,
  maxPageSize: 100,
  statusTransitionTimeout: 5000, // 5 seconds
  bulkUpdateLimit: 50,
  analyticsRefreshInterval: 300000, // 5 minutes
}
