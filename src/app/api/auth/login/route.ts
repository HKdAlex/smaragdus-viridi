import { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const { email, password } = loginSchema.parse(body);

    // Create Supabase client with proper SSR cookie handling
    // Let Next.js handle the response creation
    const response = NextResponse.json({ success: false });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Debug: log what cookies we're setting
            console.log(
              "[AUTH API] Supabase setting cookies:",
              cookiesToSet.map((c) => ({ name: c.name, hasValue: !!c.value }))
            );

            // Set cookies on both request and response
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("[AUTH API] Login error:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      console.log("[AUTH API] No user returned from login");
      return NextResponse.json(
        { success: false, error: "Login failed" },
        { status: 400 }
      );
    }

    // Force a session refresh to ensure cookies are properly set
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    console.log("[AUTH API] Session after login:", {
      hasSession: !!sessionData.session,
      sessionError: sessionError?.message,
    });

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", data.user.id)
      .single();

    // Log successful login
    console.log("[AUTH API] Successful login:", {
      userId: data.user.id,
      email: data.user.email,
      hasProfile: !!profile,
      timestamp: new Date().toISOString(),
    });

    // Create success response - cookies are already set via setAll callback
    const successResponse = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      profile: profile || null,
    });

    // Copy cookies from the response that was modified by Supabase
    response.cookies.getAll().forEach((cookie) => {
      successResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        path: cookie.path,
        maxAge: cookie.maxAge,
      });
    });

    return successResponse;
  } catch (error) {
    console.error("[AUTH API] Login error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
