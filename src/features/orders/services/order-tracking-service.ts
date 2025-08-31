import { createContextLogger } from '@/shared/utils/logger'
import type { 
  OrderEvent, 
  CreateOrderEventRequest, 
  OrderTimeline,
  OrderEventType 
} from '../types/order-tracking.types'
import { ORDER_EVENT_TEMPLATES } from '../types/order-tracking.types'

const logger = createContextLogger('order-tracking')

export class OrderTrackingService {
  /**
   * Create a new order event
   */
  static async createEvent(request: CreateOrderEventRequest): Promise<OrderEvent | null> {
    try {
      // Get template for the event type
      const template = ORDER_EVENT_TEMPLATES[request.event_type]
      
      // For now, return a mock event since the order_events table doesn't exist yet
      const mockEvent: OrderEvent = {
        id: Math.random().toString(36).substr(2, 9),
        order_id: request.order_id,
        event_type: request.event_type,
        severity: request.severity || template.severity,
        title: request.title || template.title,
        description: request.description || template.description,
        metadata: request.metadata || {},
        performed_at: new Date().toISOString(),
        is_internal: request.is_internal || false
      }

      logger.info('Mock order event created', { 
        orderId: request.order_id, 
        eventType: request.event_type,
        eventId: mockEvent.id 
      })

      return mockEvent
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
      // For now, return a mock timeline since the order_events table doesn't exist yet
      // This will be replaced with actual database queries once the table is created
      const mockTimeline: OrderTimeline = {
        order_id: orderId,
        events: [
          {
            id: '1',
            order_id: orderId,
            event_type: 'order_created',
            severity: 'success',
            title: 'Order Created',
            description: 'Order has been successfully created',
            performed_at: new Date().toISOString(),
            is_internal: false
          }
        ],
        current_status: 'pending',
        last_updated: new Date().toISOString()
      }

      logger.info('Mock order timeline retrieved', { 
        orderId, 
        eventCount: mockTimeline.events.length 
      })

      return mockTimeline
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
      // For now, return mock events since the order_events table doesn't exist yet
      const mockEvents: OrderEvent[] = [
        {
          id: '1',
          order_id: 'mock-order-1',
          event_type: 'order_created',
          severity: 'success',
          title: 'Order Created',
          description: 'Order has been successfully created',
          performed_at: new Date().toISOString(),
          is_internal: false
        }
      ]

      return mockEvents.slice(0, limit)
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
      // For now, return mock events since the order_events table doesn't exist yet
      const mockEvents: OrderEvent[] = [
        {
          id: '1',
          order_id: orderId,
          event_type: 'order_created',
          severity: 'success',
          title: 'Order Created',
          description: 'Order has been successfully created',
          performed_at: new Date().toISOString(),
          is_internal: false
        }
      ]

      return {
        events: mockEvents.slice(offset, offset + limit),
        total: mockEvents.length
      }
    } catch (error) {
      logger.error('Error getting order events', error as Error, { orderId })
      return { events: [], total: 0 }
    }
  }
}
