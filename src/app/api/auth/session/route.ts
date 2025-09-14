import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with SSR cookie handling (same as middleware)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Don't set cookies in session check
          },
        },
      }
    );

    // Get session and user (same as middleware does)
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (sessionError || userError || !userData.user) {
      return NextResponse.json({
        user: null,
        profile: null,
        isAuthenticated: false,
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userData.user.id)
      .single();

    return NextResponse.json({
      user: {
        id: userData.user.id,
        email: userData.user.email,
      },
      profile: profile || null,
      isAuthenticated: true,
    });
  } catch (error) {
    console.error("[SESSION API] Error:", error);
    return NextResponse.json({
      user: null,
      profile: null,
      isAuthenticated: false,
    });
  }
}
