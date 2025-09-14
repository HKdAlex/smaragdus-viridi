import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    // Create a response object first
    let response = NextResponse.json({ success: true });

    // Create Supabase client with proper SSR cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Set cookies on the response to clear them
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
              });
            });
          },
        },
      }
    );

    // Sign out (this will clear the session and cookies)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[AUTH API] Logout error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log successful logout
    console.log("[AUTH API] Successful logout:", {
      timestamp: new Date().toISOString(),
    });

    return response;
  } catch (error) {
    console.error("[AUTH API] Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
