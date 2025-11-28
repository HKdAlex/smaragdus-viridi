import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { orderAnalyticsService } from "@/features/admin/services/order-analytics-service";
import { createContextLogger } from "@/shared/utils/logger";

const logger = createContextLogger('order-analytics-api');

export async function GET(request: NextRequest) {
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

    // Parse date range from query params
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('from') || undefined;
    const dateTo = searchParams.get('to') || undefined;

    logger.info('Fetching order analytics', {
      adminId: user.id,
      dateFrom,
      dateTo,
    });

    // Get analytics
    const analytics = await orderAnalyticsService.getOrderAnalytics({
      from: dateFrom,
      to: dateTo,
    });

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Failed to fetch order analytics', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

