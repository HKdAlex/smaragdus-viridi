import { NextRequest, NextResponse } from "next/server";

import { createContextLogger } from "@/shared/utils/logger";
import { createServerSupabaseClient } from "@/lib/supabase";
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
