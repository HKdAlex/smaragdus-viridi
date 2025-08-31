import { NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@/lib/supabase'
import { logger } from '@/shared/utils/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const supabase = createServerClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch order with items and gemstone details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          gemstone:gemstones(
            *,
            images:gemstone_images(*),
            videos:gemstone_videos(*),
            origin:origins(*)
          )
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      logger.error('Failed to fetch order', orderError, { orderId })
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this order
    // Users can only view their own orders, admins can view all
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isAdmin = userProfile?.role === 'admin'
    const isOwner = order.user_id === user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get user information for the order
    let userInfo = null
    if (order.user_id) {
      // Get user profile information
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name, phone')
        .eq('user_id', order.user_id)
        .single()

      // Get user email from auth (admin only)
      let email = null
      if (isAdmin) {
        const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id)
        email = authUser?.user?.email
      }

      userInfo = {
        id: order.user_id,
        name: profile?.name || 'Unknown',
        phone: profile?.phone || '',
        email: email || 'Not available'
      }
    }

    // Format the response
    const formattedOrder = {
      ...order,
      user: userInfo,
      total_items: order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0
    }

    logger.info('Order details fetched successfully', {
      orderId,
      userId: user.id,
      isAdmin,
      itemCount: order.items?.length || 0
    })

    return NextResponse.json({
      success: true,
      order: formattedOrder
    })

  } catch (error) {
    logger.error('Error fetching order details', error as Error, { orderId: params })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
