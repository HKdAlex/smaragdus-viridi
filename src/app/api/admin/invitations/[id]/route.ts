import {
  AdminAuthError,
  requireAdmin,
} from "@/app/api/admin/_utils/require-admin";
import { NextRequest, NextResponse } from "next/server";

import { Database } from "@/shared/types/database";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

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

// POST /api/admin/invitations/[id] - Resend invitation email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const adminClient = getAdminClient();
    const { id } = await params;

    // Get invitation
    const { data: invitation, error: fetchError } = await adminClient
      .from("user_invitations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.accepted_at) {
      return NextResponse.json(
        { success: false, error: "Invitation has already been accepted" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Get admin name
    const { data: adminProfile } = await adminClient
      .from("user_profiles")
      .select("name")
      .eq("user_id", invitation.invited_by)
      .single();

    const adminName = adminProfile?.name || "Admin";

    // Send invitation email
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "https://crystallique.com";
        const invitationUrl = `${siteUrl}/invite/${invitation.token}`;
        const expiresAt = new Date(invitation.expires_at);

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin-bottom: 10px;">You're Invited!</h1>
              <p style="color: #6b7280; font-size: 16px;">Join Crystallique - Your Premium Gemstone Collection</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-bottom: 15px;">Welcome to Crystallique</h2>
              <p style="color: #4b5563; margin-bottom: 20px;">
                ${adminName} has invited you to join Crystallique as a <strong>${
          invitation.role
        }</strong>.
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

        const fromEmail =
          process.env.RESEND_FROM_EMAIL || "noreply@crystallique.com";
        const fromName = process.env.RESEND_FROM_NAME || "Crystallique";

        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: invitation.email,
          subject: "You're Invited to Join Crystallique",
          html: emailHtml,
        });
      } catch (emailError) {
        console.error("Failed to resend invitation email:", emailError);
        return NextResponse.json(
          { success: false, error: "Failed to send email" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Invitation email resent",
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("Failed to resend invitation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/invitations/[id] - Cancel invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const adminClient = getAdminClient();
    const { id } = await params;

    // Check if invitation exists
    const { data: invitation, error: fetchError } = await adminClient
      .from("user_invitations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.accepted_at) {
      return NextResponse.json(
        { success: false, error: "Cannot cancel an accepted invitation" },
        { status: 400 }
      );
    }

    // Delete invitation
    const { error: deleteError } = await adminClient
      .from("user_invitations")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invitation cancelled",
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("Failed to cancel invitation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
