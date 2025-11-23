import { NextRequest, NextResponse } from "next/server";

import { AdminService } from "@/features/admin/services/admin-service";
import { ChatNotificationOrchestrator } from "@/features/chat/services/chat-notification-orchestrator";
import type { ChatMessage } from "@/features/chat/types/chat.types";
import { UserPreferencesService } from "@/features/user/services/user-preferences-service";
import { ChatEmailService } from "@/lib/email/services/chat-email-service";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createContextLogger } from "@/shared/utils/logger";
import { z } from "zod";

const logger = createContextLogger("admin-chat-send-api");

// POST /api/admin/chat/send - Send admin message to user
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();

    // Validate request body
    const messageSchema = z.object({
      user_id: z.string().uuid(),
      content: z.string().min(1).max(2000),
    });

    const validationResult = messageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { user_id, content } = validationResult.data;

    // Insert admin message
    const { data: message, error: insertError } = await (supabase as any)
      .from("chat_messages")
      .insert({
        user_id,
        admin_id: user.id,
        content,
        sender_type: "admin",
        is_read: false,
      })
      .select()
      .single();

    if (insertError) {
      logger.error("Failed to send admin message", insertError, {
        adminId: user.id,
        userId: user_id,
      });
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    logger.info("Admin message sent successfully", {
      messageId: message.id,
      adminId: user.id,
      userId: user_id,
    });

    // Send email notification to user (non-blocking)
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const emailService = new ChatEmailService(resendApiKey);
        const userPreferencesService = new UserPreferencesService();
        const adminService = new AdminService();
        const notificationOrchestrator = new ChatNotificationOrchestrator(
          emailService,
          userPreferencesService,
          adminService
        );

        const chatMessage: ChatMessage = {
          id: message.id,
          user_id: message.user_id,
          admin_id: message.admin_id,
          content: message.content,
          attachments: message.attachments,
          sender_type: message.sender_type as "user" | "admin",
          is_auto_response: message.is_auto_response,
          is_read: message.is_read,
          created_at: message.created_at,
        };

        // Fire and forget - don't wait for email
        notificationOrchestrator
          .handleAdminMessageSent(user_id, chatMessage, user.id)
          .catch((err) => {
            logger.error("Failed to send email notification", err as Error, {
              messageId: message.id,
              adminId: user.id,
              userId: user_id,
            });
          });
      }
    } catch (emailError) {
      // Log but don't fail the request
      logger.error(
        "Exception setting up email notification",
        emailError as Error,
        {
          messageId: message.id,
          adminId: user.id,
          userId: user_id,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Failed to send admin message", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
