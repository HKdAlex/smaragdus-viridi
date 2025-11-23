/**
 * Unattended Message Checker API Route
 * 
 * Scheduled endpoint to check for unattended messages and send alerts.
 * Can be called by cron job or scheduled task.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createContextLogger } from "@/shared/utils/logger";
import { ChatEmailService } from "@/lib/email/services/chat-email-service";
import { ChatNotificationOrchestrator } from "@/features/chat/services/chat-notification-orchestrator";
import { UserPreferencesService } from "@/features/user/services/user-preferences-service";
import { AdminService } from "@/features/admin/services/admin-service";

const logger = createContextLogger("unattended-message-checker");

// POST /api/admin/chat/check-unattended - Check for unattended messages
// GET /api/admin/chat/check-unattended - Also supports GET for Vercel cron
export async function POST(request: NextRequest) {
  return handleUnattendedCheck(request);
}

export async function GET(request: NextRequest) {
  // Support GET for Vercel cron jobs
  return handleUnattendedCheck(request);
}

async function handleUnattendedCheck(request: NextRequest) {
  try {
    // Check for Vercel cron header (from Vercel cron jobs)
    const vercelCron = request.headers.get("x-vercel-cron");
    // Check for API key (for external cron job authentication)
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.CHAT_CHECKER_API_KEY;
    const isCronRequest = vercelCron === "1" || (apiKey && authHeader === `Bearer ${apiKey}`);

    // If not a cron request, require admin authentication
    if (!isCronRequest) {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      // Check if user is admin
      const { data: userProfile, error: profileError } = (await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()) as {
        data: { role: string } | null;
        error: any;
      };

      if (profileError || userProfile?.role !== "admin") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      logger.warn("RESEND_API_KEY not configured, skipping email notifications");
      return NextResponse.json({
        success: true,
        message: "Email notifications disabled (RESEND_API_KEY not configured)",
        checked: true,
      });
    }

    // Initialize services
    const emailService = new ChatEmailService(resendApiKey);
    const userPreferencesService = new UserPreferencesService();
    const adminService = new AdminService();
    const notificationOrchestrator = new ChatNotificationOrchestrator(
      emailService,
      userPreferencesService,
      adminService
    );

    // Check for unattended messages
    await notificationOrchestrator.checkUnattendedMessages();

    logger.info("Unattended message check completed");

    return NextResponse.json({
      success: true,
      message: "Unattended message check completed",
      checked: true,
    });
  } catch (error) {
    logger.error("Failed to check unattended messages", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


