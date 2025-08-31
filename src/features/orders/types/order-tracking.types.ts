import type { OrderStatus, UserRole } from '@/shared/types'

// Order event types for tracking
export type OrderEventType = 
  | 'order_created'
  | 'order_confirmed'
  | 'order_processing'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'shipping_label_created'
  | 'tracking_number_added'
  | 'customer_contacted'
  | 'refund_requested'
  | 'refund_processed'
  | 'note_added'
  | 'admin_note_added'

// Order event severity levels
export type OrderEventSeverity = 'info' | 'warning' | 'error' | 'success'

// Order event interface
export interface OrderEvent {
  id: string
  order_id: string
  event_type: OrderEventType
  severity: OrderEventSeverity
  title: string
  description: string
  metadata?: Record<string, any>
  performed_by?: string
  performed_by_role?: UserRole
  performed_at: string
  is_internal?: boolean // For admin-only events
}

// Order event creation request
export interface CreateOrderEventRequest {
  order_id: string
  event_type: OrderEventType
  severity?: OrderEventSeverity
  title: string
  description: string
  metadata?: Record<string, any>
  is_internal?: boolean
}

// Order tracking timeline
export interface OrderTimeline {
  order_id: string
  events: OrderEvent[]
  current_status: OrderStatus
  estimated_delivery?: string
  last_updated: string
}

// Order event templates for common actions
export const ORDER_EVENT_TEMPLATES: Record<OrderEventType, {
  title: string
  description: string
  severity: OrderEventSeverity
  icon: string
  color: string
}> = {
  order_created: {
    title: 'Order Created',
    description: 'Order has been successfully created',
    severity: 'success',
    icon: '📋',
    color: 'blue'
  },
  order_confirmed: {
    title: 'Order Confirmed',
    description: 'Order has been confirmed and is ready for processing',
    severity: 'success',
    icon: '✅',
    color: 'green'
  },
  order_processing: {
    title: 'Order Processing',
    description: 'Order is being prepared for shipment',
    severity: 'info',
    icon: '⚙️',
    color: 'orange'
  },
  order_shipped: {
    title: 'Order Shipped',
    description: 'Order has been shipped and is in transit',
    severity: 'success',
    icon: '📦',
    color: 'purple'
  },
  order_delivered: {
    title: 'Order Delivered',
    description: 'Order has been successfully delivered',
    severity: 'success',
    icon: '🎉',
    color: 'green'
  },
  order_cancelled: {
    title: 'Order Cancelled',
    description: 'Order has been cancelled',
    severity: 'error',
    icon: '❌',
    color: 'red'
  },
  payment_received: {
    title: 'Payment Received',
    description: 'Payment has been successfully processed',
    severity: 'success',
    icon: '💰',
    color: 'green'
  },
  payment_failed: {
    title: 'Payment Failed',
    description: 'Payment processing failed',
    severity: 'error',
    icon: '💳',
    color: 'red'
  },
  shipping_label_created: {
    title: 'Shipping Label Created',
    description: 'Shipping label has been generated',
    severity: 'info',
    icon: '🏷️',
    color: 'blue'
  },
  tracking_number_added: {
    title: 'Tracking Number Added',
    description: 'Tracking number has been added to the order',
    severity: 'info',
    icon: '🔍',
    color: 'purple'
  },
  customer_contacted: {
    title: 'Customer Contacted',
    description: 'Customer has been contacted regarding this order',
    severity: 'info',
    icon: '📞',
    color: 'blue'
  },
  refund_requested: {
    title: 'Refund Requested',
    description: 'Customer has requested a refund',
    severity: 'warning',
    icon: '🔄',
    color: 'orange'
  },
  refund_processed: {
    title: 'Refund Processed',
    description: 'Refund has been processed and issued',
    severity: 'success',
    icon: '💸',
    color: 'green'
  },
  note_added: {
    title: 'Note Added',
    description: 'A note has been added to the order',
    severity: 'info',
    icon: '📝',
    color: 'gray'
  },
  admin_note_added: {
    title: 'Admin Note Added',
    description: 'An admin note has been added to the order',
    severity: 'info',
    icon: '👤',
    color: 'gray'
  }
}

// Order status colors for UI
export const ORDER_STATUS_COLORS: Record<OrderStatus, {
  light: string
  dark: string
  bg: string
  border: string
}> = {
  pending: {
    light: 'text-yellow-700',
    dark: 'dark:text-yellow-300',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800/30'
  },
  confirmed: {
    light: 'text-blue-700',
    dark: 'dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800/30'
  },
  processing: {
    light: 'text-orange-700',
    dark: 'dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800/30'
  },
  shipped: {
    light: 'text-purple-700',
    dark: 'dark:text-purple-300',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800/30'
  },
  delivered: {
    light: 'text-green-700',
    dark: 'dark:text-green-300',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800/30'
  },
  cancelled: {
    light: 'text-red-700',
    dark: 'dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800/30'
  }
}

// Order event severity colors
export const EVENT_SEVERITY_COLORS: Record<OrderEventSeverity, {
  light: string
  dark: string
  bg: string
  border: string
}> = {
  info: {
    light: 'text-blue-700',
    dark: 'dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800/30'
  },
  warning: {
    light: 'text-yellow-700',
    dark: 'dark:text-yellow-300',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800/30'
  },
  error: {
    light: 'text-red-700',
    dark: 'dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800/30'
  },
  success: {
    light: 'text-green-700',
    dark: 'dark:text-green-300',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800/30'
  }
}
