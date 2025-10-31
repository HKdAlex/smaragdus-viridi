import { createServerSupabaseClient as createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const locale = searchParams.get("locale") || "en";
  let next = searchParams.get("next") ?? `/${locale}/profile`;

  // Ensure next path starts with locale (but don't double-add it)
  if (!next.startsWith(`/${locale}`)) {
    next = `/${locale}${next.startsWith("/") ? next : `/${next}`}`;
  }

  const supabase = await createClient();

      // Handle email confirmation and password reset with token_hash (from Supabase email links)
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        });

        if (!error) {
          const forwardedHost = request.headers.get("x-forwarded-host");
          const isLocalEnv = process.env.NODE_ENV === "development";

          // For password reset, always redirect to reset-password page regardless of next param
          if (type === "recovery") {
            const resetPath = `/${locale}/reset-password`;
            const resetUrl = `${resetPath}?token_hash=${tokenHash}&type=${type}&locale=${locale}`;
            if (isLocalEnv) {
              return NextResponse.redirect(`${origin}${resetUrl}`);
            } else if (forwardedHost) {
              return NextResponse.redirect(`https://${forwardedHost}${resetUrl}`);
            } else {
              return NextResponse.redirect(`${origin}${resetUrl}`);
            }
          }

          // For email confirmation, redirect normally
          if (isLocalEnv) {
            return NextResponse.redirect(`${origin}${next}`);
          } else if (forwardedHost) {
            return NextResponse.redirect(`https://${forwardedHost}${next}`);
          } else {
            return NextResponse.redirect(`${origin}${next}`);
          }
        }
      }
  // Handle OAuth callback with code (from OAuth providers)
  else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/auth/auth-code-error`);
}
