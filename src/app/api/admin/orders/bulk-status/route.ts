import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase";
import { orderBulkService } from "@/features/admin/services/order-bulk-service";
import { createContextLogger } from "@/shared/utils/logger";

const logger = createContextLogger('bulk-status-api');

const bulkStatusRequestSchema = z.object({
  orderIds: z.array(z.string().uuid()).min(1, "At least one order ID required").max(100, "Maximum 100 orders"),
  newStatus: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  notes: z.string().max(500).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = bulkStatusRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    logger.info('Bulk status update requested', {
      adminId: user.id,
      orderCount: validation.data.orderIds.length,
      newStatus: validation.data.newStatus,
    });

    // Execute bulk update
    const result = await orderBulkService.bulkUpdateStatus({
      orderIds: validation.data.orderIds,
      newStatus: validation.data.newStatus,
      notes: validation.data.notes,
      adminId: user.id,
    });

    if (!result.success && result.updatedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Bulk update failed',
          data: {
            updatedCount: result.updatedCount,
            failedCount: result.failedCount,
            failedOrders: result.failedOrders,
          },
        },
        { status: 400 }
      );
    }

    logger.info('Bulk status update completed', {
      adminId: user.id,
      updatedCount: result.updatedCount,
      failedCount: result.failedCount,
    });

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Successfully updated ${result.updatedCount} orders`
        : `Updated ${result.updatedCount} orders, ${result.failedCount} failed`,
      data: {
        updatedCount: result.updatedCount,
        failedCount: result.failedCount,
        updatedOrders: result.updatedOrders,
        failedOrders: result.failedOrders,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in bulk status update', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

