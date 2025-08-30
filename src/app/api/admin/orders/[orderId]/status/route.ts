import { NextRequest, NextResponse } from 'next/server'

import { createContextLogger } from '@/shared/utils/logger'
import { createServerClient } from '@/lib/supabase'
import { orderManagementService } from '@/features/admin/services/order-management-service'
import { z } from 'zod'

const logger = createContextLogger('admin-order-status-api')

// PUT /api/admin/orders/[orderId]/status - Update order status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const statusSchema = z.object({
      new_status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
      notes: z.string().optional()
    })

    const validationResult = statusSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { new_status, notes } = validationResult.data

    const response = await orderManagementService.updateOrderStatus({
      order_id: orderId,
      new_status,
      notes
    })

    if (response.success) {
      return NextResponse.json({
        success: true,
        order: response.order
      })
    } else {
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('Failed to update order status', error as Error, {
      orderId: (await params).orderId
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
