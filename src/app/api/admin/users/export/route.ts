import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/shared/types/database";
import { createClient } from "@supabase/supabase-js";
import { AdminAuthError, requireAdmin } from "@/app/api/admin/_utils/require-admin";
import { parseUserListRequest } from "@/features/admin/validation/user-management.schemas";

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

// GET /api/admin/users/export - Export users to CSV
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const adminClient = getAdminClient();

    const { searchParams } = new URL(request.url);
    const requestData = parseUserListRequest(searchParams);
    const filters = requestData.filters || {};

    // Build query (without auth relationship - we'll fetch auth data separately)
    let query = adminClient
      .from("user_profiles")
      .select("*");

    // Apply filters
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(
        `name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`
      );
    }

    if (filters.role && filters.role.length > 0) {
      query = query.in("role", filters.role);
    }

    if (filters.registered_from) {
      query = query.gte("created_at", filters.registered_from);
    }

    if (filters.registered_to) {
      query = query.lte("created_at", filters.registered_to);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Fetch auth users separately
    const userIds = (data || []).map((profile: any) => profile.user_id);
    const authUsersMap = new Map<string, any>();
    
    if (userIds.length > 0) {
      const { data: authUsers } = await adminClient.auth.admin.listUsers();
      authUsers.users
        .filter((u) => userIds.includes(u.id))
        .forEach((u) => {
          authUsersMap.set(u.id, u);
        });
    }

    // Transform to CSV format
    const csvRows: string[] = [];

    // CSV Header
    csvRows.push(
      "ID,Name,Email,Phone,Role,Preferred Currency,Discount %,Language,Created At,Last Sign In"
    );

    // CSV Rows
    for (const profile of data || []) {
      const authUser = authUsersMap.get(profile.user_id);

      const row = [
        profile.user_id || "",
        profile.name || "",
        authUser?.email || "",
        profile.phone || "",
        profile.role || "",
        profile.preferred_currency || "",
        profile.discount_percentage?.toString() || "0",
        profile.language_preference || "",
        profile.created_at || "",
        authUser?.last_sign_in_at || "",
      ];

      // Escape commas and quotes in CSV
      csvRows.push(
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      );
    }

    const csvContent = csvRows.join("\n");

    // Return as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="users-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("Failed to export users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

