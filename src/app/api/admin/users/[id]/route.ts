import {
  AdminAuthError,
  requireAdmin,
} from "@/app/api/admin/_utils/require-admin";
import { NextRequest, NextResponse } from "next/server";

import { Database } from "@/shared/types/database";
import type { UserWithAuth } from "@/features/admin/types/user-management.types";
import { createClient } from "@supabase/supabase-js";
import { updateUserSchema } from "@/features/admin/validation/user-management.schemas";

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

// GET /api/admin/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const adminClient = getAdminClient();
    const { id } = await params;

    const { data: profile, error: profileError } = await adminClient
      .from("user_profiles")
      .select("*")
      .eq("user_id", id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get auth user details
    const { data: authUser, error: authError } =
      await adminClient.auth.admin.getUserById(id);

    if (authError) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch user auth data" },
        { status: 400 }
      );
    }

    // Check if user is banned (banned_until might not be in getUserById response)
    const isActive =
      !(authUser.user as any)?.banned_until ||
      ((authUser.user as any)?.banned_until &&
        new Date((authUser.user as any).banned_until) < new Date());

    const userWithAuth: UserWithAuth = {
      ...profile,
      auth_email: authUser.user?.email || "",
      auth_created_at:
        authUser.user?.created_at ||
        profile.created_at ||
        new Date().toISOString(),
      auth_last_sign_in: authUser.user?.last_sign_in_at || null,
      is_active: isActive,
    };

    return NextResponse.json({
      success: true,
      data: userWithAuth,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, userId: adminUserId } = await requireAdmin();
    const adminClient = getAdminClient();
    const { id } = await params;

    // Get current user data for audit log
    const { data: currentProfile } = await adminClient
      .from("user_profiles")
      .select("*")
      .eq("user_id", id)
      .single();

    if (!currentProfile) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    // Get request metadata
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.phone !== undefined) updateData.phone = validated.phone;
    if (validated.role !== undefined) updateData.role = validated.role;
    if (validated.preferred_currency !== undefined)
      updateData.preferred_currency = validated.preferred_currency;
    if (validated.discount_percentage !== undefined)
      updateData.discount_percentage = validated.discount_percentage;
    if (validated.language_preference !== undefined)
      updateData.language_preference = validated.language_preference;

    // Update profile
    const { data: updatedProfile, error: updateError } = await adminClient
      .from("user_profiles")
      .update(updateData)
      .eq("user_id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    // Update email in auth if changed
    if (validated.email && validated.email !== currentProfile.email) {
      const { error: emailError } = await adminClient.auth.admin.updateUserById(
        id,
        { email: validated.email }
      );

      if (emailError) {
        console.error("Failed to update email:", emailError);
        // Don't fail the request, just log the error
      }
    }

    // Determine action type for audit log
    const action =
      validated.role && validated.role !== currentProfile.role
        ? "role_change"
        : "update";

    // Log audit action
    await adminClient.from("user_audit_logs").insert({
      admin_user_id: adminUserId,
      target_user_id: id,
      action,
      changes: {
        before: currentProfile,
        after: updatedProfile,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Get updated auth user details
    const { data: authUser } = await adminClient.auth.admin.getUserById(id);

    // Check if user is active (banned_until might not be in getUserById response)
    const isActive =
      !(authUser?.user as any)?.banned_until ||
      ((authUser?.user as any)?.banned_until &&
        new Date((authUser.user as any).banned_until) < new Date());

    const userWithAuth: UserWithAuth = {
      ...updatedProfile,
      auth_email: validated.email || authUser?.user?.email || "",
      auth_created_at:
        authUser?.user?.created_at ||
        updatedProfile.created_at ||
        new Date().toISOString(),
      auth_last_sign_in: authUser?.user?.last_sign_in_at || null,
      is_active: isActive,
    };

    return NextResponse.json({
      success: true,
      data: userWithAuth,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }

    console.error("Failed to update user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: adminUserId } = await requireAdmin();
    const adminClient = getAdminClient();
    const { id } = await params;

    // Safety checks
    if (id === adminUserId) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user is last admin
    const { data: isLastAdmin } = await adminClient.rpc("is_last_admin", {
      check_user_id: id,
    });

    if (isLastAdmin) {
      return NextResponse.json(
        { success: false, error: "Cannot delete the last admin user" },
        { status: 400 }
      );
    }

    // Get user data for audit log
    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("*")
      .eq("user_id", id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get request metadata
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;

    // Delete auth user (this will cascade delete profile due to ON DELETE CASCADE)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 400 }
      );
    }

    // Log audit action
    await adminClient.from("user_audit_logs").insert({
      admin_user_id: adminUserId,
      target_user_id: id,
      action: "delete",
      changes: {
        before: profile,
        after: null,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
