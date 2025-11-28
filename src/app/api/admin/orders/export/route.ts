import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase";
import { orderExportService, type OrderExportOptions } from "@/features/orders/services/order-export-service";
import { createContextLogger } from "@/shared/utils/logger";

const logger = createContextLogger('orders-export-api');

// Validation schema for export options
const exportOptionsSchema = z.object({
  orderIds: z.array(z.string().uuid()).optional(),
  status: z.array(z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(['csv', 'json']).default('csv'),
  includeItems: z.boolean().default(true),
  includeCustomerInfo: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
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
    const validation = exportOptionsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid export options',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const options: OrderExportOptions = {
      orderIds: validation.data.orderIds,
      status: validation.data.status,
      dateFrom: validation.data.dateFrom,
      dateTo: validation.data.dateTo,
      format: validation.data.format,
      includeItems: validation.data.includeItems,
      includeCustomerInfo: validation.data.includeCustomerInfo,
    };

    logger.info('Order export requested', {
      adminId: user.id,
      format: options.format,
      orderIds: options.orderIds?.length,
    });

    // Execute export
    const result = await orderExportService.exportOrders(options);

    if (!result.success) {
      logger.error('Order export failed', new Error(result.error || 'Unknown error'));
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Return file download response
    const headers = new Headers();
    headers.set('Content-Type', result.mimeType || 'text/plain');
    headers.set('Content-Disposition', `attachment; filename="${result.filename}"`);

    logger.info('Order export completed', {
      adminId: user.id,
      orderCount: result.orderCount,
      format: options.format,
    });

    return new NextResponse(result.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    logger.error('Unexpected error in order export', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for simple CSV export with query params
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

    const { searchParams } = new URL(request.url);
    
    const options: OrderExportOptions = {
      format: (searchParams.get('format') as 'csv' | 'json') || 'csv',
      status: searchParams.get('status')?.split(',').filter(Boolean) as OrderExportOptions['status'],
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      includeItems: searchParams.get('includeItems') !== 'false',
      includeCustomerInfo: searchParams.get('includeCustomerInfo') !== 'false',
    };

    logger.info('Order export requested via GET', {
      adminId: user.id,
      format: options.format,
    });

    const result = await orderExportService.exportOrders(options);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    const headers = new Headers();
    headers.set('Content-Type', result.mimeType || 'text/plain');
    headers.set('Content-Disposition', `attachment; filename="${result.filename}"`);

    return new NextResponse(result.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    logger.error('Unexpected error in order export GET', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

