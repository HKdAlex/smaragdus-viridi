import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/shared/types/database";
import { createClient } from "@supabase/supabase-js";
import { AdminAuthError, requireAdmin } from "@/app/api/admin/_utils/require-admin";
import type { AuditLogEntry } from "@/features/admin/types/user-management.types";

// Server-side admin client
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// GET /api/admin/users/[id]/audit-logs - Get audit logs for specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const adminClient = getAdminClient();
    const { id } = await params;

    const { data: logs, error } = await adminClient
      .from("user_audit_logs")
      .select(
        `
        *,
        admin_profile:admin_user_id (
          name
        ),
        target_profile:target_user_id (
          name
        )
      `
      )
      .eq("target_user_id", id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Transform to AuditLogEntry format
    const auditLogs: AuditLogEntry[] = (logs || []).map((log: any) => ({
      id: log.id,
      admin_user_id: log.admin_user_id,
      admin_name:
        (Array.isArray(log.admin_profile)
          ? log.admin_profile[0]?.name
          : log.admin_profile?.name) || "Unknown",
      target_user_id: log.target_user_id,
      target_user_name:
        (Array.isArray(log.target_profile)
          ? log.target_profile[0]?.name
          : log.target_profile?.name) || null,
      action: log.action,
      changes: log.changes || {},
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: auditLogs,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

