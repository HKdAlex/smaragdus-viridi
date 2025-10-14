/**
 * Search Analytics API Route
 *
 * POST: Track search queries (fire and forget)
 * GET: Retrieve analytics summary (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { SearchAnalyticsService } from "@/features/search/services/analytics.service";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schema for tracking requests
const trackSearchSchema = z.object({
  query: z.string().min(1).max(500),
  filters: z.record(z.any()).optional(),
  resultsCount: z.number().int().min(0),
  usedFuzzySearch: z.boolean(),
  sessionId: z.string().optional(),
});

// Validation schema for GET requests
const getAnalyticsSchema = z.object({
  daysBack: z.coerce.number().int().min(1).max(365).default(30),
});

/**
 * POST /api/search/analytics
 * Track a search query (anonymous or authenticated)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validated = trackSearchSchema.parse(body);

    // Get user ID if authenticated (optional)
    let userId: string | undefined;
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
    } catch (error) {
      // Anonymous tracking is fine - don't fail
      console.log("[SearchAnalytics] Anonymous tracking (no auth)");
    }

    // Track search (fire and forget - runs async)
    SearchAnalyticsService.trackSearch({
      query: validated.query,
      filters: validated.filters,
      resultsCount: validated.resultsCount,
      usedFuzzySearch: validated.usedFuzzySearch,
      userId,
      sessionId: validated.sessionId,
    }).catch((error) => {
      // Log but don't propagate error
      console.error("[SearchAnalytics] Background tracking failed:", error);
    });

    // Return immediately - don't wait for tracking to complete
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[SearchAnalytics] POST error:", error);
    // Return success even on error - tracking should never break UX
    return NextResponse.json({ success: true });
  }
}

/**
 * GET /api/search/analytics?daysBack=30
 * Get analytics summary (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role from user_profiles table
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== "admin") {
      console.error("[SearchAnalytics] Admin check failed:", {
        profileError,
        hasProfile: !!userProfile,
        role: userProfile?.role,
        userId: user.id,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = getAnalyticsSchema.parse({
      daysBack: searchParams.get("daysBack"),
    });

    // Get analytics metrics
    const metrics = await SearchAnalyticsService.getAnalyticsMetrics(
      params.daysBack
    );

    return NextResponse.json(metrics);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[SearchAnalytics] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

