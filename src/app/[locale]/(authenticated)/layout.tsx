import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

/**
 * Authenticated Layout - Second Layer of Protection
 * 
 * This layout provides thorough, database-validated authentication checks
 * for all routes nested under the (authenticated) route group.
 * 
 * This complements the middleware protection with:
 * - Deep session validation against the database
 * - User profile verification
 * - Role-based access control preparation
 */

interface AuthenticatedLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AuthenticatedLayout({
  children,
  params,
}: AuthenticatedLayoutProps) {
  const { locale } = await params;
  
  const supabase = await createServerClient();
  
  // Perform thorough authentication check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // If no valid session, redirect to login
  if (authError || !user) {
    redirect(`/${locale}/login`);
  }

  // Optional: Additional user profile validation
  // You can add checks here for:
  // - User profile completeness
  // - Account status (active/suspended)
  // - Email verification status
  // - Role-based access control

  // Optional: Check if user profile exists in database
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single();

  // If user exists in auth but not in profiles table, 
  // you might want to create the profile or handle this case
  if (!profile) {
    // Handle missing profile case
    // For now, we'll allow it to continue
    console.warn(`User ${user.id} authenticated but no profile found`);
  }

  return <>{children}</>;
}
