import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";
import { createContextLogger } from "@/shared/utils/logger";
import { z } from "zod";

const logger = createContextLogger("chat-api");

// GET /api/chat - Get user's chat messages
export async function GET(request: NextRequest) {
  try {
    // Get user from regular client (for auth context)
    const authSupabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Use admin client for database operations (bypasses RLS)
    if (!supabaseAdmin) {
      throw new Error("Service role key not available");
    }

    const supabase = supabaseAdmin;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

    // Query messages directly from database
    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select(
        `
        id,
        user_id,
        content,
        attachments,
        sender_type,
        is_auto_response,
        is_read,
        created_at
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      logger.error(
        "Failed to fetch chat messages from database",
        messagesError
      );
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    // Get total count for hasMore calculation
    const { count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const hasMore = (count || 0) > offset + limit;

    return NextResponse.json({
      success: true,
      messages: messages || [],
      hasMore,
    });
  } catch (error) {
    logger.error("Failed to fetch chat messages", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/chat - Send a new chat message
export async function POST(request: NextRequest) {
  try {
    // Get user from regular client (for auth context)
    const authSupabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Use admin client for database operations (bypasses RLS)
    if (!supabaseAdmin) {
      throw new Error("Service role key not available");
    }

    const supabase = supabaseAdmin;

    const body = await request.json();

    // Validate request body
    const messageSchema = z.object({
      content: z.string().min(1).max(2000),
      attachments: z.array(z.string()).optional(),
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

    const { content, attachments } = validationResult.data;

    // Insert message directly into database
    const { data: message, error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        user_id: user.id,
        content: content.trim(),
        attachments: attachments || [],
        sender_type: "user",
        is_auto_response: false,
        is_read: false,
      })
      .select(
        `
        id,
        user_id,
        content,
        attachments,
        sender_type,
        is_auto_response,
        is_read,
        created_at
      `
      )
      .single();

    if (insertError) {
      logger.error("Failed to insert chat message", insertError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    logger.info("Message sent successfully", {
      messageId: message.id,
      userId: user.id,
      contentLength: content.length,
    });

    return NextResponse.json(
      {
        success: true,
        message,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Failed to send chat message", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
