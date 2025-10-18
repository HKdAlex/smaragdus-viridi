"use client"

import { format } from 'date-fns'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Package, 
  Truck, 
  User,
  CreditCard,
  FileText,
  Phone,
  RefreshCw,
  DollarSign,
  Tag,
  Search
} from 'lucide-react'

import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import type { OrderEvent, OrderTimeline } from '../types/order-tracking.types'
import { EVENT_SEVERITY_COLORS, ORDER_EVENT_TEMPLATES } from '../types/order-tracking.types'
import { useTranslations } from 'next-intl'

interface OrderTimelineProps {
  timeline: OrderTimeline
  showInternalEvents?: boolean
  className?: string
}

export function OrderTimeline({ 
  timeline, 
  showInternalEvents = false,
  className = "" 
}: OrderTimelineProps) {
  const t = useTranslations('orders')

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy')
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm')
  }

  const getEventIcon = (eventType: string) => {
    const template = ORDER_EVENT_TEMPLATES[eventType as keyof typeof ORDER_EVENT_TEMPLATES]
    if (!template) return <Clock className="w-4 h-4" />

    // Map emoji icons to Lucide icons for better consistency
    switch (template.icon) {
      case '📋':
        return <FileText className="w-4 h-4" />
      case '✅':
        return <CheckCircle className="w-4 h-4" />
      case '⚙️':
        return <Package className="w-4 h-4" />
      case '📦':
        return <Truck className="w-4 h-4" />
      case '🎉':
        return <CheckCircle className="w-4 h-4" />
      case '❌':
        return <AlertCircle className="w-4 h-4" />
      case '💰':
        return <DollarSign className="w-4 h-4" />
      case '💳':
        return <CreditCard className="w-4 h-4" />
      case '🏷️':
        return <Tag className="w-4 h-4" />
      case '🔍':
        return <Search className="w-4 h-4" />
      case '📞':
        return <Phone className="w-4 h-4" />
      case '🔄':
        return <RefreshCw className="w-4 h-4" />
      case '💸':
        return <DollarSign className="w-4 h-4" />
      case '📝':
        return <FileText className="w-4 h-4" />
      case '👤':
        return <User className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getEventColor = (severity: string) => {
    const colors = EVENT_SEVERITY_COLORS[severity as keyof typeof EVENT_SEVERITY_COLORS]
    return colors || EVENT_SEVERITY_COLORS.info
  }

  const getPerformerDisplay = (event: OrderEvent) => {
    if (event.performed_by_role === 'admin') {
      return t('admin')
    }
    if (event.performed_by_role === 'regular_customer' || event.performed_by_role === 'premium_customer') {
      return t('customer')
    }
    return event.performed_by || t('system')
  }

  // Filter events based on showInternalEvents flag
  const visibleEvents = timeline.events.filter(event => 
    showInternalEvents || !event.is_internal
  )

  if (visibleEvents.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
            <Clock className="w-5 h-5" />
            {t('orderHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t('noEventsYet')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-semibold">
          <Clock className="w-5 h-5" />
          {t('orderHistory')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {visibleEvents.map((event, index) => {
            const colors = getEventColor(event.severity)
            const isLast = index === visibleEvents.length - 1
            
            return (
              <div key={event.id} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-6 top-8 w-0.5 h-16 bg-border" />
                )}
                
                {/* Event dot */}
                <div className={`absolute left-4 top-2 w-4 h-4 rounded-full border-2 ${colors.border} ${colors.bg}`} />
                
                {/* Event content */}
                <div className="ml-12">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${colors.bg}`}>
                        {getEventIcon(event.event_type)}
                      </div>
                      <div>
                        <h4 className={`font-medium ${colors.light} ${colors.dark}`}>
                          {event.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {getPerformerDisplay(event)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatDate(event.performed_at)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(event.performed_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${colors.bg} ${colors.border} border`}>
                    <p className="text-sm">{event.description}</p>
                    
                    {/* Metadata display */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {event.metadata.tracking_number && (
                          <div className="flex items-center gap-2 text-xs">
                            <Search className="w-3 h-3" />
                            <span className="font-mono">{event.metadata.tracking_number}</span>
                          </div>
                        )}
                        {event.metadata.payment_method && (
                          <div className="flex items-center gap-2 text-xs">
                            <CreditCard className="w-3 h-3" />
                            <span>{event.metadata.payment_method}</span>
                          </div>
                        )}
                        {event.metadata.amount && (
                          <div className="flex items-center gap-2 text-xs">
                            <DollarSign className="w-3 h-3" />
                            <span>${(event.metadata.amount / 100).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Severity badge */}
                  <div className="mt-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${colors.light} ${colors.dark} ${colors.border}`}
                    >
                      {event.severity}
                    </Badge>
                    {event.is_internal && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {t('internal')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Timeline footer */}
        <Separator className="my-6" />
        <div className="text-center text-sm text-muted-foreground">
          <p>{t('lastUpdated')}: {formatDate(timeline.last_updated)} at {formatTime(timeline.last_updated)}</p>
        </div>
      </CardContent>
    </Card>
  )
}
