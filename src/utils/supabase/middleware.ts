import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase session update utility for Next.js middleware
 * This function manages authentication sessions and ensures proper cookie handling
 * between server and client components.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on the request for server components to read
          cookiesToSet.forEach(({ name, value, options }) => 
            request.cookies.set(name, value)
          )

          // Create new response with updated cookies
          supabaseResponse = NextResponse.next({
            request
          })

          // Set cookies on the response for browser to receive
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  // CRITICAL: Don't write logic between createServerClient and getUser()
  // This can cause random logout issues that are very hard to debug

  // IMPORTANT: Don't remove getUser() - it revalidates the Auth token
  const { data: { user }, error } = await supabase.auth.getUser()

  // Define protected routes that require authentication
  const protectedPaths = [
    '/orders',
    '/profile', 
    '/cart',
    '/admin'
  ]

  const pathname = request.nextUrl.pathname

  // Check if current path is protected (considering i18n locale prefix)
  const isProtectedRoute = protectedPaths.some(path => {
    // Handle both /path and /locale/path patterns
    return pathname === path || 
           pathname.match(new RegExp(`^/[a-z]{2}${path}(?:/.*)?$`))
  })

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && (!user || error)) {
    const url = request.nextUrl.clone()
    
    // Preserve locale in login redirect
    const localeMatch = pathname.match(/^\/([a-z]{2})\//)
    const locale = localeMatch ? localeMatch[1] : 'en'
    
    url.pathname = `/${locale}/login`
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // For admin routes, check for admin role
  if (pathname.includes('/admin') && user) {
    // Note: This is a basic check. For production, you should verify admin role
    // from your user_profiles table or similar. This requires additional database call.
    // For now, we'll let the layout handle the thorough admin check.
  }

  // CRITICAL: You MUST return the supabaseResponse object as-is
  // This ensures proper cookie synchronization between browser and server
  // If you need to modify the response:
  // 1. Pass the request: NextResponse.next({ request })
  // 2. Copy cookies: myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Avoid changing the cookies!
  return supabaseResponse
}
