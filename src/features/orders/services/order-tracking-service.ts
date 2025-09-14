import type {
    CreateOrderEventRequest,
    OrderEvent,
    OrderEventType,
    OrderTimeline
} from '../types/order-tracking.types'

import { ORDER_EVENT_TEMPLATES } from '../types/order-tracking.types'
import { createContextLogger } from '@/shared/utils/logger'
import { createServerClient } from '@/lib/supabase-server'

const logger = createContextLogger('order-tracking')

export class OrderTrackingService {
  /**
   * Create a new order event
   */
  static async createEvent(request: CreateOrderEventRequest): Promise<OrderEvent | null> {
    try {
      const template = ORDER_EVENT_TEMPLATES[request.event_type]
      const supabase = await createServerClient()

      const { data, error } = await supabase
        .from('order_events')
        .insert({
          order_id: request.order_id,
          event_type: request.event_type,
          severity: request.severity || template.severity,
          title: request.title || template.title,
          description: request.description || template.description,
          metadata: request.metadata || {},
          is_internal: request.is_internal || false,
        })
        .select('*')
        .single()

      if (error) throw error

      logger.info('Order event created', { orderId: request.order_id, eventType: request.event_type })
      return data as unknown as OrderEvent
    } catch (error) {
      logger.error('Error creating order event', error as Error, { orderId: request.order_id })
      return null
    }
  }

  /**
   * Get order timeline with all events
   */
  static async getOrderTimeline(orderId: string): Promise<OrderTimeline | null> {
    try {
      const supabase = await createServerClient()

      // Fetch order for status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, status, updated_at')
        .eq('id', orderId)
        .single()

      if (orderError || !order) return null

      const { data: events, error } = await supabase
        .from('order_events')
        .select('*')
        .eq('order_id', orderId)
        .order('performed_at', { ascending: true })

      if (error) throw error

      return {
        order_id: orderId,
        events: (events || []) as unknown as OrderEvent[],
        current_status: (order.status || 'pending') as any,
        last_updated: order.updated_at || new Date().toISOString()
      }
    } catch (error) {
      logger.error('Error getting order timeline', error as Error, { orderId })
      return null
    }
  }

  /**
   * Create an event when order status changes
   */
  static async logStatusChange(
    orderId: string, 
    oldStatus: string, 
    newStatus: string,
    performedBy?: string
  ): Promise<OrderEvent | null> {
    const eventType = `order_${newStatus}` as OrderEventType
    
    return this.createEvent({
      order_id: orderId,
      event_type: eventType,
      title: `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      description: `Order status changed from ${oldStatus} to ${newStatus}`,
      metadata: {
        old_status: oldStatus,
        new_status: newStatus,
        performed_by: performedBy
      }
    })
  }

  /**
   * Add a note to the order
   */
  static async addNote(
    orderId: string,
    note: string,
    isInternal: boolean = false,
    performedBy?: string
  ): Promise<OrderEvent | null> {
    const eventType = isInternal ? 'admin_note_added' : 'note_added'
    
    return this.createEvent({
      order_id: orderId,
      event_type: eventType,
      title: isInternal ? 'Admin Note Added' : 'Note Added',
      description: note,
      is_internal: isInternal,
      metadata: {
        performed_by: performedBy
      }
    })
  }

  /**
   * Log payment events
   */
  static async logPaymentEvent(
    orderId: string,
    success: boolean,
    paymentMethod?: string,
    amount?: number,
    performedBy?: string
  ): Promise<OrderEvent | null> {
    const eventType = success ? 'payment_received' : 'payment_failed'
    
    return this.createEvent({
      order_id: orderId,
      event_type: eventType,
      title: success ? 'Payment Received' : 'Payment Failed',
      description: success 
        ? `Payment of ${amount ? `$${(amount / 100).toFixed(2)}` : 'amount'} received via ${paymentMethod || 'payment method'}`
        : `Payment failed via ${paymentMethod || 'payment method'}`,
      metadata: {
        payment_method: paymentMethod,
        amount: amount,
        performed_by: performedBy
      }
    })
  }

  /**
   * Log shipping events
   */
  static async logShippingEvent(
    orderId: string,
    eventType: 'shipping_label_created' | 'tracking_number_added',
    details: string,
    trackingNumber?: string,
    performedBy?: string
  ): Promise<OrderEvent | null> {
    return this.createEvent({
      order_id: orderId,
      event_type: eventType,
      title: eventType === 'shipping_label_created' ? 'Shipping Label Created' : 'Tracking Number Added',
      description: details,
      metadata: {
        tracking_number: trackingNumber,
        performed_by: performedBy
      }
    })
  }

  /**
   * Get recent events for multiple orders (for admin dashboard)
   */
  static async getRecentEvents(limit: number = 50): Promise<OrderEvent[]> {
    try {
      const supabase = await createServerClient()
      const { data, error } = await supabase
        .from('order_events')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as unknown as OrderEvent[]
    } catch (error) {
      logger.error('Error getting recent events', error as Error)
      return []
    }
  }

  /**
   * Get events for a specific order with pagination
   */
  static async getOrderEvents(
    orderId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ events: OrderEvent[], total: number }> {
    try {
      const supabase = await createServerClient()
      const { data, error, count } = await supabase
        .from('order_events')
        .select('*', { count: 'exact' })
        .eq('order_id', orderId)
        .order('performed_at', { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) throw error
      return { events: (data || []) as unknown as OrderEvent[], total: count || 0 }
    } catch (error) {
      logger.error('Error getting order events', error as Error, { orderId })
      return { events: [], total: 0 }
    }
  }
}
