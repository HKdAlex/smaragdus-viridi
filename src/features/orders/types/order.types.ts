import type {
    DatabaseOrder,
    DatabaseOrderItem,
    OrderStatus
} from '@/shared/types'

// Extended order types for business logic
export interface Order extends DatabaseOrder {
  readonly items?: OrderItem[]
}

export interface OrderItem extends DatabaseOrderItem {
  readonly gemstone?: {
    id: string
    name: string
    color: string
    cut: string
    weight_carats: number
    serial_number: string
    images?: Array<{
      id: string
      image_url: string
      is_primary: boolean
    }>
  }
}

// Order creation request types
export interface CreateOrderRequest {
  items: Array<{
    gemstone_id: string
    quantity: number
    unit_price: number
  }>
  currency_code?: string
  notes?: string
  delivery_address?: {
    street: string
    city: string
    state?: string
    zip_code: string
    country: string
  }
}

// Order creation response types
export interface CreateOrderResponse {
  success: boolean
  order?: {
    id: string
    status: OrderStatus
    total_amount: number
    currency_code: string
    created_at: string
    items: Array<{
      gemstone_id: string
      quantity: number
      unit_price: number
      line_total: number
    }>
    payment: {
      reference: string
      processed_at: string
      simulated: boolean
    }
  }
  error?: string
}

// Order list response types
export interface OrderListResponse {
  success: boolean
  orders: Order[]
  pagination: {
    offset: number
    limit: number
    hasMore: boolean
  }
  error?: string
}

// Order status tracking
export interface OrderStatusUpdate {
  order_id: string
  old_status: OrderStatus
  new_status: OrderStatus
  updated_at: string
  updated_by?: string
}

// Order analytics types
export interface OrderAnalytics {
  total_orders: number
  total_revenue: number
  average_order_value: number
  orders_by_status: Record<OrderStatus, number>
  revenue_by_currency: Record<string, number>
  recent_orders: Order[]
}

// Order filtering and search
export interface OrderFilters {
  status?: OrderStatus[]
  date_from?: string
  date_to?: string
  min_amount?: number
  max_amount?: number
  currency?: string[]
  user_id?: string
}

export interface OrderSortOptions {
  field: 'created_at' | 'total_amount' | 'status' | 'updated_at'
  direction: 'asc' | 'desc'
}

// Order notification types
export interface OrderNotification {
  order_id: string
  user_id: string
  type: 'created' | 'status_changed' | 'shipped' | 'delivered' | 'cancelled'
  message: string
  data?: Record<string, any>
  created_at: string
}

// Order validation types
export interface OrderValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface OrderValidationError {
  field: string
  message: string
  code: string
}

// Order history and audit
export interface OrderHistoryEntry {
  id: string
  order_id: string
  action: string
  old_value?: any
  new_value?: any
  performed_by?: string
  performed_at: string
  notes?: string
}

// Order export types
export interface OrderExportOptions {
  format: 'csv' | 'json' | 'pdf'
  include_items: boolean
  date_range?: {
    from: string
    to: string
  }
  status_filter?: OrderStatus[]
  fields?: string[]
}

// Constants for order processing
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
} as const

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'yellow',
  confirmed: 'blue',
  processing: 'orange',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'red'
} as const

// Order workflow configuration
export const ORDER_WORKFLOW = {
  initial: 'pending' as OrderStatus,
  transitions: {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
  } as Record<OrderStatus, OrderStatus[]>
} as const

// Validation rules
export const ORDER_VALIDATION_RULES = {
  max_items: 50,
  max_quantity_per_item: 99,
  min_order_value: 100, // $1.00 in cents
  max_order_value: 10000000, // $100,000 in cents
  supported_currencies: ['USD', 'EUR', 'GBP', 'RUB', 'CHF', 'JPY']
} as const
