import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/shared/types/database";
import { createClient } from "@supabase/supabase-js";
import { AdminAuthError, requireAdmin } from "@/app/api/admin/_utils/require-admin";
import {
  userListRequestSchema,
  createUserSchema,
  parseUserListRequest,
} from "@/features/admin/validation/user-management.schemas";
import type { UserWithAuth } from "@/features/admin/types/user-management.types";

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

// GET /api/admin/users - List users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const adminClient = getAdminClient();

    const { searchParams } = new URL(request.url);
    const requestData = parseUserListRequest(searchParams);
    const validated = userListRequestSchema.parse(requestData);

    const { page, limit, filters, sort_by, sort_order } = validated;
    const offset = (page - 1) * limit;

    // Build query (without auth relationship - we'll fetch auth data separately)
    let query = adminClient
      .from("user_profiles")
      .select("*", { count: "exact" });

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

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Fetch auth users separately using admin API
    const userIds = (data || []).map((profile: any) => profile.user_id);
    const authUsersMap = new Map<string, any>();
    
    if (userIds.length > 0) {
      // Fetch all auth users (admin API doesn't support filtering by IDs)
      const { data: authUsers } = await adminClient.auth.admin.listUsers();
      
      // Filter to only the users we need and create a map
      authUsers.users
        .filter((u) => userIds.includes(u.id))
        .forEach((u) => {
          authUsersMap.set(u.id, u);
        });
    }

    // Transform data to UserWithAuth format
    const users: UserWithAuth[] = (data || []).map((profile: any) => {
      const authUser = authUsersMap.get(profile.user_id);
      const isActive = !authUser || (!(authUser as any).banned_until || 
        ((authUser as any).banned_until && new Date((authUser as any).banned_until) < new Date()));

      return {
        ...profile,
        auth_email: authUser?.email || "",
        auth_created_at: authUser?.created_at || profile.created_at || new Date().toISOString(),
        auth_last_sign_in: authUser?.last_sign_in_at || null,
        is_active: isActive,
      };
    });

    // Apply is_active filter if specified (after fetching auth data)
    let filteredUsers = users;
    if (filters.is_active !== undefined) {
      filteredUsers = filteredUsers.filter((u) => u.is_active === filters.is_active);
    }

    // Filter by has_orders if needed
    if (filters.has_orders !== undefined) {
      const userIds = filteredUsers.map((u) => u.user_id);
      const { data: orders } = await adminClient
        .from("orders")
        .select("user_id")
        .in("user_id", userIds);

      const usersWithOrders = new Set(orders?.map((o) => o.user_id) || []);

      if (filters.has_orders) {
        filteredUsers = filteredUsers.filter((u) =>
          usersWithOrders.has(u.user_id)
        );
      } else {
        filteredUsers = filteredUsers.filter(
          (u) => !usersWithOrders.has(u.user_id)
        );
      }
    }

    const total = filters.has_orders !== undefined ? filteredUsers.length : count || 0;
    const total_pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        users: filteredUsers,
        total,
        page,
        limit,
        total_pages,
      },
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
        { success: false, error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const { supabase, userId: adminUserId } = await requireAdmin();
    const adminClient = getAdminClient();

    const body = await request.json();
    const validated = createUserSchema.parse(body);

    const { email, password, name, phone, role, preferred_currency, send_invitation } = validated;

    // Get request metadata for audit log
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") || null;

    if (send_invitation) {
      // Create invitation instead of user
      // This will be handled by the invitations API
      return NextResponse.json(
        { success: false, error: "Use /api/admin/invitations endpoint for invitations" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required when not sending invitation" },
        { status: 400 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    // Create user profile
    const { data: profile, error: profileError } = await adminClient
      .from("user_profiles")
      .insert({
        user_id: authData.user.id,
        name,
        phone: phone || null,
        role,
        preferred_currency: preferred_currency || null,
      })
      .select()
      .single();

    if (profileError) {
      // Cleanup: delete auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: profileError.message },
        { status: 400 }
      );
    }

    // Log audit action
    await adminClient.from("user_audit_logs").insert({
      admin_user_id: adminUserId,
      target_user_id: authData.user.id,
      action: "create",
      changes: {
        before: null,
        after: {
          email,
          name,
          role,
        },
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Get auth user details
    const { data: authUser } = await adminClient.auth.admin.getUserById(authData.user.id);

    // New users are always active
    const userWithAuth: UserWithAuth = {
      ...profile,
      auth_email: email,
      auth_created_at: authData.user.created_at || new Date().toISOString(),
      auth_last_sign_in: authUser?.user?.last_sign_in_at || null,
      is_active: true,
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

    console.error("Failed to create user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

