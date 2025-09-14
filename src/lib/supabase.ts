import { Database } from '@/shared/types/database'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Client-side Supabase client - can be used in Client Components
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey) 

// Server-side Supabase client with service role - bypasses RLS policies
// Only available on server-side
export const supabaseAdmin = (() => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseServiceRoleKey) {
    // Return null if service role key is not available (client-side)
    return null
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
})() 