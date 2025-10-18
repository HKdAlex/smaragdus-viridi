-- Fix RLS policies for admin operations
-- This migration addresses permission denied errors for admin users

-- 1. First, let's check if we need to create a user profile for the current admin user
-- We'll create a function to ensure admin users have profiles

CREATE OR REPLACE FUNCTION ensure_admin_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user profile exists, if not create one with admin role
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = NEW.id
  ) THEN
    INSERT INTO user_profiles (user_id, name, role)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      'admin'::user_role
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create admin profiles
DROP TRIGGER IF EXISTS ensure_admin_profile_trigger ON auth.users;
CREATE TRIGGER ensure_admin_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_admin_profile();

-- 2. Fix gemstone_images RLS policies
-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Gemstone media viewable by all" ON gemstone_images;
DROP POLICY IF EXISTS "Images are viewable by everyone" ON gemstone_images;
DROP POLICY IF EXISTS "Public can view gemstone images" ON gemstone_images;

-- Create comprehensive policies for gemstone_images
CREATE POLICY "gemstone_images_select_policy" ON gemstone_images
  FOR SELECT
  USING (true);

CREATE POLICY "gemstone_images_admin_policy" ON gemstone_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'::user_role
    )
  );

-- 3. Add RLS policies for gemstones_ai_v6
-- Enable RLS first
ALTER TABLE gemstones_ai_v6 ENABLE ROW LEVEL SECURITY;

-- Create policies for gemstones_ai_v6
CREATE POLICY "gemstones_ai_v6_select_policy" ON gemstones_ai_v6
  FOR SELECT
  USING (true);

CREATE POLICY "gemstones_ai_v6_admin_policy" ON gemstones_ai_v6
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'::user_role
    )
  );

-- 4. Fix gemstones policies
-- Drop conflicting policies
DROP POLICY IF EXISTS "Only admins can modify gemstones" ON gemstones;

-- Keep the existing admin policy but ensure it works
-- The existing "Gemstones manageable by admin" policy should work now that we have user profiles

-- 5. Add policy for user_profiles table
CREATE POLICY "user_profiles_admin_policy" ON user_profiles
  FOR ALL
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.role = 'admin'::user_role
    )
  );

-- 6. Create a function to manually create admin profile for existing users
CREATE OR REPLACE FUNCTION create_admin_profile_for_user(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
  
  IF user_uuid IS NOT NULL THEN
    -- Insert or update user profile
    INSERT INTO user_profiles (user_id, name, role)
    VALUES (user_uuid, user_email, 'admin'::user_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin'::user_role;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_admin_profile_for_user(TEXT) TO authenticated;
