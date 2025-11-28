import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase";
import { orderService } from "@/features/orders/services/order-service";
import { createContextLogger } from "@/shared/utils/logger";

const logger = createContextLogger('order-cancel-api');

const cancelRequestSchema = z.object({
  reason: z.string().max(500).optional(),
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

    // Parse request body
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is OK
    }

    const validation = cancelRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: validation.error.format() },
        { status: 400 }
      );
    }

    logger.info('Order cancellation requested by user', {
      orderId,
      userId: user.id,
      reason: validation.data.reason,
    });

    // Cancel the order
    const result = await orderService.cancelOrder(
      orderId,
      user.id,
      validation.data.reason
    );

    if (!result.success) {
      logger.warn('Order cancellation failed', {
        orderId,
        userId: user.id,
        error: result.error,
      });
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    logger.info('Order cancelled successfully', {
      orderId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: { order: result.order },
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    logger.error('Unexpected error cancelling order', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

