import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase";
import { orderService } from "@/features/orders/services/order-service";
import { createContextLogger } from "@/shared/utils/logger";

const logger = createContextLogger('admin-order-cancel-api');

const cancelRequestSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500),
});

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { orderId } = await params;

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
    const validation = cancelRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reason is required for admin cancellation',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    logger.info('Admin order cancellation requested', {
      orderId,
      adminId: user.id,
      reason: validation.data.reason,
    });

    // Cancel the order
    const result = await orderService.adminCancelOrder(
      orderId,
      user.id,
      validation.data.reason
    );

    if (!result.success) {
      logger.warn('Admin order cancellation failed', {
        orderId,
        adminId: user.id,
        error: result.error,
      });
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    logger.info('Order cancelled by admin', {
      orderId,
      adminId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: { order: result.order },
      message: 'Order cancelled successfully by admin',
    });
  } catch (error) {
    logger.error('Unexpected error in admin order cancellation', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

