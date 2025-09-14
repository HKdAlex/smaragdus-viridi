import { NextRequest, NextResponse } from 'next/server'

import { createContextLogger } from '@/shared/utils/logger'
import { createServerClient } from '@/lib/supabase-server'
import { orderManagementService } from '@/features/admin/services/order-management-service'

const logger = createContextLogger('admin-orders-api')

// GET /api/admin/orders - Get orders for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
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
      .single() as {
        data: { role: string } | null
        error: any
      }

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100)
    const sort_by = searchParams.get('sort_by') || 'created_at'
    const sort_order = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc'
    const search = searchParams.get('search') || undefined

    // Parse filters
    const status = searchParams.get('status')?.split(',').filter(Boolean)
    const date_from = searchParams.get('date_from') || undefined
    const date_to = searchParams.get('date_to') || undefined
    const min_amount = searchParams.get('min_amount') ? parseInt(searchParams.get('min_amount')!) : undefined
    const max_amount = searchParams.get('max_amount') ? parseInt(searchParams.get('max_amount')!) : undefined

    const filters = {
      status: status as any,
      date_from,
      date_to,
      min_amount,
      max_amount,
      search
    }

    const response = await orderManagementService.getOrders({
      page,
      limit,
      filters,
      sort_by: sort_by as any,
      sort_order
    })

    if (response.success) {
      return NextResponse.json({
        success: true,
        orders: response.orders,
        total: response.total,
        page: response.page,
        limit: response.limit,
        hasMore: response.hasMore
      })
    } else {
      return NextResponse.json(
        { error: response.error },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error('Failed to fetch admin orders', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
