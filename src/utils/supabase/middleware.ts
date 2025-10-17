import { Database } from "@/shared/types/database";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Define route protection levels
type RouteProtectionLevel = "public" | "authenticated" | "admin";
type UserRole = Database["public"]["Enums"]["user_role"];

interface RouteConfig {
  path: string;
  protection: RouteProtectionLevel;
  description: string;
}

// Comprehensive route configuration
const ROUTE_CONFIG: RouteConfig[] = [
  // Public routes (no authentication required)
  { path: "/", protection: "public", description: "Home page" },
  { path: "/login", protection: "public", description: "Login page" },
  { path: "/register", protection: "public", description: "Registration page" },
  { path: "/catalog", protection: "public", description: "Gemstone catalog" },
  { path: "/gemstones", protection: "public", description: "Gemstone details" },
  { path: "/contact", protection: "public", description: "Contact page" },

  // Authenticated routes (require valid user session)
  {
    path: "/orders",
    protection: "authenticated",
    description: "Customer orders",
  },
  {
    path: "/profile",
    protection: "authenticated",
    description: "User profile",
  },
  { path: "/cart", protection: "authenticated", description: "Shopping cart" },
  {
    path: "/favorites",
    protection: "authenticated",
    description: "User favorites",
  },

  // Admin routes (require admin role)
  { path: "/admin", protection: "admin", description: "Admin dashboard" },
];

/**
 * Enhanced Supabase session update utility for Next.js middleware
 *
 * Features:
 * - Comprehensive route protection with role-based access control
 * - Security headers injection
 * - Audit logging for authentication events
 * - Performance optimized with minimal database calls
 * - Proper i18n locale handling
 */
export async function updateSession(request: NextRequest) {
  const startTime = Date.now();

  // Create response with security headers
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Add security headers
  addSecurityHeaders(supabaseResponse);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll();
          if (process.env.NODE_ENV === "development") {
            console.log(
              "[MIDDLEWARE] Reading cookies:",
              cookies.map((c) => ({ name: c.name, hasValue: !!c.value }))
            );
          }
          return cookies;
        },
        setAll(cookiesToSet) {
          // Set cookies on the request for server components to read
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);

            // Use more flexible cookie settings for auth
            const secureOptions = {
              ...options,
              // Don't force httpOnly - Supabase needs some client access
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax" as const,
              path: "/",
            };

            supabaseResponse.cookies.set(name, value, secureOptions);
          });

          // Create new response with updated cookies
          supabaseResponse = NextResponse.next({
            request,
          });

          // Set cookies on the response for browser to receive
          cookiesToSet.forEach(({ name, value, options }) => {
            const secureOptions = {
              ...options,
              // Don't force httpOnly - Supabase needs some client access
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax" as const,
              path: "/",
            };
            supabaseResponse.cookies.set(name, value, secureOptions);
          });
        },
      },
    }
  );

  // CRITICAL: Don't write logic between createServerClient and getUser()
  // This can cause random logout issues that are very hard to debug

  // First try to get the session to ensure token is valid
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  // IMPORTANT: Don't remove getUser() - it revalidates the Auth token
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Debug logging for session issues
  if (process.env.NODE_ENV === "development") {
    console.log("[AUTH DEBUG]", {
      hasSession: !!session,
      hasUser: !!user,
      sessionError: sessionError?.message,
      authError: authError?.message,
      cookies: request.cookies
        .getAll()
        .map((c) => c.name)
        .join(", "),
    });
  }

  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get("user-agent") || "";
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";

  // Extract locale from URL
  const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
  const locale = localeMatch ? localeMatch[1] : "en";
  const pathWithoutLocale = localeMatch
    ? pathname.replace(`/${locale}`, "") || "/"
    : pathname;

  // Determine route protection level
  const routeConfig = getRouteProtection(pathWithoutLocale);

  // Log authentication attempt for audit trail
  if (user && !authError) {
    logAuthEvent("session_validated", {
      userId: user.id,
      route: pathWithoutLocale,
      protection: routeConfig.protection,
      ip,
      userAgent: userAgent.substring(0, 200), // Truncate for security
      locale,
      processingTime: Date.now() - startTime,
    });
  }

  // Handle authentication requirements
  if (
    routeConfig.protection === "authenticated" ||
    routeConfig.protection === "admin"
  ) {
    if (!user || authError) {
      // Log failed authentication attempt
      logAuthEvent("authentication_required", {
        route: pathWithoutLocale,
        protection: routeConfig.protection,
        error: authError?.message,
        ip,
        locale,
        redirected: true,
      });

      // Redirect to login with return URL
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${locale}/login`;
      loginUrl.searchParams.set("redirectTo", pathname);
      loginUrl.searchParams.set("reason", "auth_required");

      return NextResponse.redirect(loginUrl);
    }

    // For admin routes, we need to verify admin role from database
    if (routeConfig.protection === "admin") {
      try {
        const { data: profile, error: profileError } = (await supabase
          .from("user_profiles")
          .select("role")
          .eq("user_id", user.id)
          .single()) as {
          data: { role: Database["public"]["Enums"]["user_role"] } | null;
          error: any;
        };

        if (profileError || !profile || profile.role !== "admin") {
          // Log unauthorized admin access attempt
          logAuthEvent("unauthorized_admin_access", {
            userId: user.id,
            route: pathWithoutLocale,
            userRole: profile?.role || "unknown",
            ip,
            locale,
            blocked: true,
          });

          // Redirect to unauthorized page or dashboard
          const unauthorizedUrl = request.nextUrl.clone();
          unauthorizedUrl.pathname = `/${locale}/unauthorized`;
          unauthorizedUrl.searchParams.set(
            "reason",
            "insufficient_permissions"
          );

          return NextResponse.redirect(unauthorizedUrl);
        }

        // Log successful admin access
        logAuthEvent("admin_access_granted", {
          userId: user.id,
          route: pathWithoutLocale,
          ip,
          locale,
        });
      } catch (error) {
        // Log database error
        logAuthEvent("auth_database_error", {
          userId: user.id,
          route: pathWithoutLocale,
          error:
            error instanceof Error ? error.message : "Unknown database error",
          ip,
          locale,
        });

        // Redirect to error page
        const errorUrl = request.nextUrl.clone();
        errorUrl.pathname = `/${locale}/error`;
        errorUrl.searchParams.set("reason", "auth_system_error");

        return NextResponse.redirect(errorUrl);
      }
    }
  }

  // Add performance headers
  supabaseResponse.headers.set(
    "X-Auth-Processing-Time",
    `${Date.now() - startTime}ms`
  );
  supabaseResponse.headers.set("X-Route-Protection", routeConfig.protection);

  // CRITICAL: You MUST return the supabaseResponse object as-is
  // This ensures proper cookie synchronization between browser and server
  return supabaseResponse;
}

/**
 * Determine route protection level based on path
 */
function getRouteProtection(pathname: string): RouteConfig {
  // Find exact match first
  const exactMatch = ROUTE_CONFIG.find((route) => route.path === pathname);
  if (exactMatch) return exactMatch;

  // Find prefix match for nested routes
  const prefixMatch = ROUTE_CONFIG.find(
    (route) => route.path !== "/" && pathname.startsWith(route.path)
  );
  if (prefixMatch) return prefixMatch;

  // Default to public for unknown routes
  return { path: pathname, protection: "public", description: "Unknown route" };
}

/**
 * Add comprehensive security headers
 */
function addSecurityHeaders(response: NextResponse) {
  // CSRF Protection
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // CSP (Content Security Policy) - Adjust as needed for your app
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: *.supabase.co",
    "media-src 'self' *.supabase.co blob: data:",
    "connect-src 'self' *.supabase.co",
    "font-src 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // HSTS for production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
}

/**
 * Centralized authentication event logging
 * In production, this should integrate with your logging service
 */
function logAuthEvent(event: string, data: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    level:
      event.includes("error") || event.includes("unauthorized")
        ? "warn"
        : "info",
    ...data,
  };

  // Log to console in development, should use proper logging service in production
  if (process.env.NODE_ENV === "development") {
    console.log(`[AUTH] ${event}:`, logEntry);
  }

  // TODO: In production, send to your logging service (e.g., Supabase audit_log table)
  // This could be done via a queue system to avoid blocking the middleware
}
