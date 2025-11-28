-- Migration: Create User Management Tables
-- Date: 2025-01-25
-- Purpose: Create tables for user audit logs and invitations, and add RLS policies for user_profiles admin access

BEGIN;

-- Ensure is_admin() function exists (from previous migration)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Returns true if the current authenticated user has role = admin.';

-- User activity audit log
CREATE TABLE IF NOT EXISTS user_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'role_change', 'suspend', 'activate', 'password_reset'
  changes JSONB, -- Before/after state
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User invitations
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role user_role DEFAULT 'regular_customer',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_audit_logs
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_admin ON user_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_target ON user_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_created_at ON user_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_action ON user_audit_logs(action);

-- Indexes for user_invitations
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at ON user_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_invitations_accepted_at ON user_invitations(accepted_at);

-- RLS Policies for user_audit_logs
ALTER TABLE user_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON user_audit_logs;
CREATE POLICY "Admins can view audit logs" ON user_audit_logs
  FOR SELECT USING (public.is_admin());

-- Only admins can insert audit logs (via application layer)
DROP POLICY IF EXISTS "Admins can insert audit logs" ON user_audit_logs;
CREATE POLICY "Admins can insert audit logs" ON user_audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- RLS Policies for user_invitations
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can manage invitations
DROP POLICY IF EXISTS "Admins can manage invitations" ON user_invitations;
CREATE POLICY "Admins can manage invitations" ON user_invitations
  FOR ALL USING (public.is_admin());

-- RLS Policies for user_profiles (admin access)
-- Allow admins to view all user profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (public.is_admin() OR user_id = auth.uid());

-- Allow admins to update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
CREATE POLICY "Admins can update any profile" ON user_profiles
  FOR UPDATE USING (public.is_admin() OR user_id = auth.uid())
  WITH CHECK (public.is_admin() OR user_id = auth.uid());

-- Allow admins to delete profiles (with safeguards in application layer)
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
CREATE POLICY "Admins can delete profiles" ON user_profiles
  FOR DELETE USING (public.is_admin());

-- Helper function to check if user is last admin
CREATE OR REPLACE FUNCTION public.is_last_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM user_profiles
  WHERE role = 'admin';
  
  IF admin_count <= 1 THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION public.is_last_admin(UUID) IS 'Returns true if the user is the last admin user in the system.';

-- Helper function to get user statistics (optimized)
CREATE OR REPLACE FUNCTION public.get_user_statistics()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'totalUsers', (SELECT COUNT(*)::integer FROM user_profiles),
    'activeUsers', (
      SELECT COUNT(*)::integer 
      FROM user_profiles up
      JOIN auth.users au ON up.user_id = au.id
      WHERE au.banned_until IS NULL OR au.banned_until < NOW()
    ),
    'premiumUsers', (SELECT COUNT(*)::integer FROM user_profiles WHERE role = 'premium_customer'),
    'admins', (SELECT COUNT(*)::integer FROM user_profiles WHERE role = 'admin'),
    'newUsersThisMonth', (
      SELECT COUNT(*)::integer 
      FROM user_profiles 
      WHERE created_at >= date_trunc('month', NOW())
    ),
    'regularCustomers', (SELECT COUNT(*)::integer FROM user_profiles WHERE role = 'regular_customer')
  ) INTO stats;
  
  RETURN stats;
END;
$$;

COMMENT ON FUNCTION public.get_user_statistics() IS 'Returns comprehensive user statistics for admin dashboard.';

-- Grant execute permission to authenticated users (RLS will handle admin check)
GRANT EXECUTE ON FUNCTION public.is_last_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_statistics() TO authenticated;

COMMIT;

