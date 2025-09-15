import { createBrowserClient, createServerClient } from "@supabase/ssr";

import { Database } from "@/shared/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Typed singleton wrapper to prevent schema widening and bypass internal cache pitfalls
let _browserClient: SupabaseClient<Database, "public">;

export function getBrowserClient(): SupabaseClient<Database, "public"> {
  if (!_browserClient) {
    _browserClient = createBrowserClient<Database, "public">(
      supabaseUrl,
      supabaseAnonKey,
      {
        // Keep schema a literal, not string
        db: { schema: "public" as const },
        // Opt out of the package's internal singleton to avoid type pollution
        isSingleton: false,
      }
    ) as SupabaseClient<Database, "public">;
  }
  return _browserClient;
}

// Export the typed client for backward compatibility
export const supabase = getBrowserClient();

// Server-side Supabase client with service role - bypasses RLS policies
// Only available on server-side
export const supabaseAdmin = (() => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey) {
    // Return null if service role key is not available (client-side)
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
})();

// Server-side Supabase client for use in Server Components and Route Handlers
export const createServerSupabaseClient = async () => {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
};
