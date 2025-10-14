import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    console.log("[DEBUG API] Starting debug check");

    // Create Supabase client exactly like middleware does
    const supabase = await createServerSupabaseClient();

    // Get session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    console.log("[DEBUG API] Session check result:", {
      hasSession: !!sessionData.session,
      sessionError: sessionError?.message,
      userId: sessionData.session?.user?.id,
      expiresAt: sessionData.session?.expires_at,
    });

    // Get user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log("[DEBUG API] User check result:", {
      hasUser: !!userData.user,
      userError: userError?.message,
      userId: userData.user?.id,
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cookies: request.cookies.getAll().map((c) => ({
        name: c.name,
        hasValue: !!c.value,
        valuePreview: c.value?.substring(0, 20) + "...",
      })),
      session: {
        exists: !!sessionData.session,
        error: sessionError?.message,
        userId: sessionData.session?.user?.id,
        email: sessionData.session?.user?.email,
        expiresAt: sessionData.session?.expires_at,
      },
      user: {
        exists: !!userData.user,
        error: userError?.message,
        userId: userData.user?.id,
        email: userData.user?.email,
      },
    });
  } catch (error) {
    console.error("[DEBUG API] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
