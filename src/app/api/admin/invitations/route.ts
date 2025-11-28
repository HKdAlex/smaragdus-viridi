import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/shared/types/database";
import { createClient } from "@supabase/supabase-js";
import { AdminAuthError, requireAdmin } from "@/app/api/admin/_utils/require-admin";
import { createInvitationSchema } from "@/features/admin/validation/user-management.schemas";
import { Resend } from "resend";
import { randomBytes } from "crypto";
import type { UserInvitation } from "@/features/admin/types/user-management.types";

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

// GET /api/admin/invitations - List invitations
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const adminClient = getAdminClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = adminClient
      .from("user_invitations")
      .select("*")
      .order("created_at", { ascending: false });

    if (status === "pending") {
      query = query.is("accepted_at", null).gt("expires_at", new Date().toISOString());
    } else if (status === "accepted") {
      query = query.not("accepted_at", "is", null);
    } else if (status === "expired") {
      query = query.is("accepted_at", null).lt("expires_at", new Date().toISOString());
    }

    const { data: invitations, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Fetch inviter profiles separately
    const inviterIds = [...new Set((invitations || []).map((inv: any) => inv.invited_by))];
    const inviterProfilesMap = new Map<string, { name: string }>();
    
    if (inviterIds.length > 0) {
      const { data: profiles } = await adminClient
        .from("user_profiles")
        .select("user_id, name")
        .in("user_id", inviterIds);
      
      (profiles || []).forEach((profile) => {
        inviterProfilesMap.set(profile.user_id, { name: profile.name });
      });
    }

    // Transform to UserInvitation format
    const transformedInvitations: UserInvitation[] = (invitations || []).map(
      (inv: any) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role || "regular_customer",
        invited_by: inv.invited_by,
        invited_by_name: inviterProfilesMap.get(inv.invited_by)?.name || "Unknown",
        token: inv.token,
        expires_at: inv.expires_at,
        accepted_at: inv.accepted_at || null,
        created_at: inv.created_at || new Date().toISOString(),
      })
    );

    return NextResponse.json({
      success: true,
      data: transformedInvitations,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("Failed to fetch invitations:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/invitations - Send new invitation
export async function POST(request: NextRequest) {
  try {
    const { userId: adminUserId } = await requireAdmin();
    const adminClient = getAdminClient();

    const body = await request.json();
    const validated = createInvitationSchema.parse(body);

    const { email, role } = validated;

    // Check if user already exists
    const { data: existingUser } = await adminClient.auth.admin.listUsers();
    const userExists = existingUser.users.some((u) => u.email === email);

    if (userExists) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if invitation already exists and is pending
    const { data: existingInvitation } = await adminClient
      .from("user_invitations")
      .select("*")
      .eq("email", email)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: "Pending invitation already exists for this email" },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Create invitation record
    const { data: invitation, error: insertError } = await adminClient
      .from("user_invitations")
      .insert({
        email,
        role,
        invited_by: adminUserId,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 400 }
      );
    }

    // Get admin name for email
    const { data: adminProfile } = await adminClient
      .from("user_profiles")
      .select("name")
      .eq("user_id", adminUserId)
      .single();

    const adminName = adminProfile?.name || "Admin";

    // Send invitation email
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://crystallique.com";
        const invitationUrl = `${siteUrl}/invite/${token}`;

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin-bottom: 10px;">You're Invited!</h1>
              <p style="color: #6b7280; font-size: 16px;">Join Crystallique - Your Premium Gemstone Collection</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-bottom: 15px;">Welcome to Crystallique</h2>
              <p style="color: #4b5563; margin-bottom: 20px;">
                ${adminName} has invited you to join Crystallique as a <strong>${role}</strong>.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Accept Invitation</a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                This invitation will expire on ${expiresAt.toLocaleDateString()}.
              </p>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px;">
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        `;

        const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@crystallique.com";
        const fromName = process.env.RESEND_FROM_NAME || "Crystallique";

        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: email,
          subject: "You're Invited to Join Crystallique",
          html: emailHtml,
        });
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the request, invitation is still created
      }
    }

    // Get inviter name
    const { data: inviterProfile } = await adminClient
      .from("user_profiles")
      .select("name")
      .eq("user_id", adminUserId)
      .single();

    const invitationResponse: UserInvitation = {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role || "regular_customer",
      invited_by: invitation.invited_by,
      invited_by_name: inviterProfile?.name || "Unknown",
      token: invitation.token,
      expires_at: invitation.expires_at,
      accepted_at: invitation.accepted_at || null,
      created_at: invitation.created_at || new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: invitationResponse,
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

    console.error("Failed to create invitation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

