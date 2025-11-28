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

// GET /api/admin/users/audit-logs - Get all audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const adminClient = getAdminClient();

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("target_user_id");
    const action = searchParams.get("action");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let query = adminClient
      .from("user_audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (targetUserId) {
      query = query.eq("target_user_id", targetUserId);
    }

    if (action) {
      query = query.eq("action", action);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Fetch admin and target profiles separately
    const adminIds = [...new Set((logs || []).map((log: any) => log.admin_user_id))];
    const targetIds = [
      ...new Set((logs || []).map((log: any) => log.target_user_id).filter(Boolean)),
    ];
    const profilesMap = new Map<string, { name: string }>();

    if (adminIds.length > 0 || targetIds.length > 0) {
      const allUserIds = [...new Set([...adminIds, ...targetIds])];
      const { data: profiles } = await adminClient
        .from("user_profiles")
        .select("user_id, name")
        .in("user_id", allUserIds);

      (profiles || []).forEach((profile) => {
        profilesMap.set(profile.user_id, { name: profile.name });
      });
    }

    // Transform to AuditLogEntry format
    const auditLogs: AuditLogEntry[] = (logs || []).map((log: any) => ({
      id: log.id,
      admin_user_id: log.admin_user_id,
      admin_name: profilesMap.get(log.admin_user_id)?.name || "Unknown",
      target_user_id: log.target_user_id,
      target_user_name: log.target_user_id
        ? profilesMap.get(log.target_user_id)?.name || null
        : null,
      action: log.action,
      changes: log.changes || {},
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        logs: auditLogs,
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
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

