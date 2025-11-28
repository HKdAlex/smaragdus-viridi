import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/shared/types/database";
import { createClient } from "@supabase/supabase-js";
import { AdminAuthError, requireAdmin } from "@/app/api/admin/_utils/require-admin";

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

// POST /api/admin/users/[id]/reset-password - Send password reset email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: adminUserId } = await requireAdmin();
    const adminClient = getAdminClient();
    const { id } = await params;

    // Get user email
    const { data: authUser, error: authError } =
      await adminClient.auth.admin.getUserById(id);

    if (authError || !authUser.user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Generate password reset token and send email
    const { error: resetError } =
      await adminClient.auth.admin.generateLink({
        type: "recovery",
        email: authUser.user.email!,
      });

    if (resetError) {
      return NextResponse.json(
        { success: false, error: resetError.message },
        { status: 400 }
      );
    }

    // Log audit action
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;

    await adminClient.from("user_audit_logs").insert({
      admin_user_id: adminUserId,
      target_user_id: id,
      action: "password_reset",
      changes: {
        email: authUser.user.email,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("Failed to reset password:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

