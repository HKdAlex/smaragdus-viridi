import { routing } from '@/i18n/routing'
import { updateSession } from '@/utils/supabase/middleware'
import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // Step 1: Handle internationalization routing first
  // This ensures proper locale detection and routing
  const intlResponse = intlMiddleware(request)
  
  // If intl middleware wants to redirect (e.g., add locale prefix), let it
  if (intlResponse && intlResponse.headers.get('location')) {
    return intlResponse
  }

  // Step 2: Handle Supabase session management and authentication
  // This will refresh tokens and handle protected routes
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - Images and other static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)'
  ]
};
