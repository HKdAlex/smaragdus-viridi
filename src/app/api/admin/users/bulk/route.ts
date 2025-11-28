import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/shared/types/database";
import { createClient } from "@supabase/supabase-js";
import { AdminAuthError, requireAdmin } from "@/app/api/admin/_utils/require-admin";
import { bulkUserOperationSchema } from "@/features/admin/validation/user-management.schemas";
import type { BulkOperationResult } from "@/features/admin/types/user-management.types";

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

// POST /api/admin/users/bulk - Perform bulk operations
export async function POST(request: NextRequest) {
  try {
    const { userId: adminUserId } = await requireAdmin();
    const adminClient = getAdminClient();

    const body = await request.json();
    const validated = bulkUserOperationSchema.parse(body);

    const { user_ids, operation, role } = validated;

    // Get request metadata
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;

    const results: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Process each user
    for (const userId of user_ids) {
      try {
        // Skip if trying to delete self
        if (operation === "delete" && userId === adminUserId) {
          results.failed++;
          results.errors.push({
            user_id: userId,
            error: "Cannot delete your own account",
          });
          continue;
        }

        // Get current profile for audit log
        const { data: currentProfile } = await adminClient
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (!currentProfile) {
          results.failed++;
          results.errors.push({
            user_id: userId,
            error: "User not found",
          });
          continue;
        }

        // Check if last admin for delete operation
        if (operation === "delete") {
          const { data: isLastAdmin } = await adminClient.rpc(
            "is_last_admin",
            {
              check_user_id: userId,
            }
          );

          if (isLastAdmin) {
            results.failed++;
            results.errors.push({
              user_id: userId,
              error: "Cannot delete the last admin user",
            });
            continue;
          }
        }

        // Perform operation
        switch (operation) {
          case "role_change":
            if (!role) {
              results.failed++;
              results.errors.push({
                user_id: userId,
                error: "Role is required for role_change operation",
              });
              continue;
            }

            const { data: updatedProfile, error: updateError } =
              await adminClient
                .from("user_profiles")
                .update({ role })
                .eq("user_id", userId)
                .select()
                .single();

            if (updateError) {
              results.failed++;
              results.errors.push({
                user_id: userId,
                error: updateError.message,
              });
              continue;
            }

            // Log audit action
            await adminClient.from("user_audit_logs").insert({
              admin_user_id: adminUserId,
              target_user_id: userId,
              action: "role_change",
              changes: {
                before: { role: currentProfile.role },
                after: { role: updatedProfile.role },
              },
              ip_address: ipAddress,
              user_agent: userAgent,
            });

            results.success++;
            break;

          case "activate":
            await adminClient.auth.admin.updateUserById(userId, {
              ban_duration: "none",
            });

            await adminClient.from("user_audit_logs").insert({
              admin_user_id: adminUserId,
              target_user_id: userId,
              action: "activate",
              changes: {
                before: { banned: true },
                after: { banned: false },
              },
              ip_address: ipAddress,
              user_agent: userAgent,
            });

            results.success++;
            break;

          case "suspend":
            await adminClient.auth.admin.updateUserById(userId, {
              ban_duration: "876000h", // ~100 years (effectively permanent)
            });

            await adminClient.from("user_audit_logs").insert({
              admin_user_id: adminUserId,
              target_user_id: userId,
              action: "suspend",
              changes: {
                before: { banned: false },
                after: { banned: true },
              },
              ip_address: ipAddress,
              user_agent: userAgent,
            });

            results.success++;
            break;

          case "delete":
            await adminClient.auth.admin.deleteUser(userId);

            await adminClient.from("user_audit_logs").insert({
              admin_user_id: adminUserId,
              target_user_id: userId,
              action: "delete",
              changes: {
                before: currentProfile,
                after: null,
              },
              ip_address: ipAddress,
              user_agent: userAgent,
            });

            results.success++;
            break;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          user_id: userId,
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
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

    console.error("Failed to perform bulk operation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

